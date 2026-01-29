import ballerina/http;
import ballerina/io;
import ballerina/jwt;
import ballerina/websocket;

// --- Configuration ---
configurable string pythonServiceUrl = "http://localhost:8000";
// Asgardeo Configuration
configurable string asgardeoOrgUrl = "https://api.asgardeo.io/t/yourorg";
configurable string asgardeoJwksUrl = "https://api.asgardeo.io/t/yourorg/oauth2/jwks";
configurable string asgardeoTokenAudience = "EquiHire-Core"; // This should match your Client ID

// --- Clients ---
final http:Client pythonClient = check new (pythonServiceUrl);

// --- State Management ---
// In-memory store for active frontend clients to broadcast messages
map<websocket:Caller> webClients = {};

// --- Service Definition ---

// 1. WebSocket Service for Twilio Media Streams (Public)
service /streams on new websocket:Listener(9090) {

    resource function get .(http:Request req) returns websocket:Service|websocket:UpgradeError {
        return new TwilioStreamService();
    }
}

service class TwilioStreamService {
    *websocket:Service;

    remote function onOpen(websocket:Caller caller) {
        io:println("Twilio Stream Connected: ", caller.getConnectionId());
    }

    remote function onMessage(websocket:Caller caller, anydata data) returns error? {
        json|error msg = data.ensureType();
        if msg is json {
            string|error event = (check msg.event).toString();

            if event is string && event == "media" {
                json|error media = msg.media;
                if media is json {
                    string|error payload = (check media.payload).toString();
                    if payload is string {
                        // Call Python AI Engine
                        json requestBody = {
                            "session_id": "session-123",
                            "audio_base64": payload
                        };

                        http:Response|error response = pythonClient->post("/transcribe", requestBody);

                        if response is http:Response {
                            json|error responseJson = response.getJsonPayload();
                            if responseJson is json {
                                string|error sanitizedText = (check responseJson.sanitized_text).toString();
                                if sanitizedText is string {
                                    broadcastToFrontend(sanitizedText);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    remote function onClose(websocket:Caller caller, int statusCode, string reason) {
        io:println("Twilio Stream Closed");
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

service /dashboard on dashboardListener {

    resource function get .(http:Request req) returns websocket:Service|websocket:UpgradeError {
        // Extract token from query param
        map<string[]> params = req.getQueryParams();
        string[]? param = params["token"];

        if param is () || param.length() == 0 {
            return error websocket:UpgradeError("Missing access token");
        }

        string token = param[0];

        // Validate Token
        jwt:Payload|jwt:Error result = jwt:validate(token, jwtValidatorConfig);

        if result is jwt:Error {
            return error websocket:UpgradeError("Invalid access token: " + result.message());
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

function broadcastToFrontend(string message) {
    foreach var caller in webClients {
        json msg = {"type": "transcription", "text": message};
        var err = caller->writeMessage(msg);
        if err is error {
            io:println("Error broadcasting to client: ", err);
        }
    }
}
