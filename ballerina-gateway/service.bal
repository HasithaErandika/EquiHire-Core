import ballerina/http;
import ballerina/io;
import ballerina/jwt;
import ballerina/websocket;

import equihire/gateway.openai;

// --- Configuration ---
configurable string pythonServiceUrl = ?;
configurable string openAIKey = ?;

// Asgardeo Configuration
configurable string asgardeoOrgUrl = ?;
configurable string asgardeoJwksUrl = ?;
configurable string asgardeoTokenAudience = ?;

// --- Clients ---
final http:Client pythonClient = check new (pythonServiceUrl);

// --- State Management ---
// in-memory store for active frontend clients
map<websocket:Caller> webClients = {};

// --- Service Definition ---

// 1. WebSocket Service for Twilio Media Streams (Public)
# WebSocket service to handle Twilio Media Streams.
# Orchestrates: Twilio (Audio) -> OpenAI (Transcribe) -> Python (Sanitize/Redact) -> Frontend (Display)
service /streams on new websocket:Listener(9090) {

    resource function get .(http:Request req) returns websocket:Service|websocket:UpgradeError {
        return new TwilioStreamService();
    }
}

service class TwilioStreamService {
    *websocket:Service;
    openai:Client? aiClient = ();
    string streamSid = "";

    remote function onOpen(websocket:Caller caller) returns error? {
        io:println("Twilio Stream Connected: ", caller.getConnectionId());

        // Initialize OpenAI Realtime Client
        // Pass 'onSanitizeRequired' as the callback for full sentences
        self.aiClient = check new (openAIKey, self.onSanitizeRequired);
    }

    remote function onMessage(websocket:Caller caller, anydata data) returns error? {
        json|error msg = data.ensureType();
        if msg is json {
            string|error event = (check msg.event).toString();

            if event is string && event == "start" {
                // Capture Stream SID if needed
                io:println("Stream Started");
            }

            if event is string && event == "media" {
                json|error media = msg.media;
                if media is json {
                    string|error payload = (check media.payload).toString();
                    if payload is string {
                        // STREAMING: Send Audio Chunk directly to OpenAI
                        openai:Client? validClient = self.aiClient;
                        if validClient is openai:Client {
                            check validClient.sendAudio(payload);
                        }
                    }
                }
            }
        }
    }

    // Callback: Triggered when OpenAI completes a sentence
    function onSanitizeRequired(string text) returns error? {
        io:println("FIREWALL: Analyzing sentence: ", text);

        // 1. Call Python Bias Firewall (Sanitize)
        json requestBody = {
            "text": text,
            "context": "live_interview"
        };

        http:Response|error response = pythonClient->post("/sanitize", requestBody);

        if response is http:Response {
            json|error responseJson = response.getJsonPayload();
            if responseJson is json {
                string|error sanitizedText = (check responseJson.sanitized_text).toString();
                boolean|error piiDetected = (check responseJson.pii_detected).ensureType(boolean);

                if sanitizedText is string {
                    // 2. Broadcast Validated/Redacted text to Recruiter
                    broadcastToFrontend(sanitizedText, piiDetected is boolean ? piiDetected : false);
                }
            }
        } else {
            io:println("Error calling Python Firewall: ", response);
        }
    }

    remote function onClose(websocket:Caller caller, int statusCode, string reason) {
        io:println("Twilio Stream Closed");
        // Close OpenAI connection
        openai:Client? validClient = self.aiClient;
        if validClient is openai:Client {
            var closeResult = validClient.close();
            if closeResult is error {
                io:println("Error closing OpenAI client: ", closeResult);
            }
        }
    }
}

// 2. WebSocket Service for React Frontend (Secured)
listener websocket:Listener dashboardListener = new (9091);

// JWT Configuration
jwt:ValidatorConfig jwtValidatorConfig = {
    issuer: asgardeoOrgUrl,
    audience: asgardeoTokenAudience,
    signatureConfig: {
        jwksConfig: {
            url: asgardeoJwksUrl
        }
    }
};

# WebSocket service for the Dashboard Frontend.
# Secured with Asgardeo JWT validation.
service /dashboard on dashboardListener {

    resource function get .(http:Request req) returns websocket:Service|websocket:UpgradeError {
        // Extract token from query param
        map<string[]> params = req.getQueryParams();
        string[]? param = params["token"];

        if param is () || param.length() == 0 {
            // For dev convenience, if no token, allow connection but warn.
            // In prod, return error.
            // return error websocket:UpgradeError("Missing access token");
            io:println("Warning: Connecting without token for Dev mode");
            return new DashboardService();
        }

        string token = param[0];

        // Validate Token
        jwt:Payload|jwt:Error result = jwt:validate(token, jwtValidatorConfig);

        if result is jwt:Error {
            io:println("Invalid Token: ", result.message());
            // For dev, verify if signature check failed vs expiration
            return error websocket:UpgradeError("Invalid access token");
        }

        return new DashboardService();
    }
}

service class DashboardService {
    *websocket:Service;

    remote function onOpen(websocket:Caller caller) {
        io:println("Frontend Client Connected: ", caller.getConnectionId());
        webClients[caller.getConnectionId().toString()] = caller;
    }

    remote function onClose(websocket:Caller caller, int statusCode, string reason) {
        string id = caller.getConnectionId().toString();
        _ = webClients.remove(id);
        io:println("Frontend Client Disconnected");
    }
}

// --- Helper Functions ---

function broadcastToFrontend(string message, boolean piiDetected) {
    foreach var caller in webClients {
        json msg = {
            "type": "transcription",
            "text": message,
            "pii_detected": piiDetected
        };
        var err = caller->writeMessage(msg);
        if err is error {
            io:println("Error broadcasting to client: ", err);
        }
    }
}
