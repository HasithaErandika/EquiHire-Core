import ballerina/io;
import ballerina/websocket;

public type OpenAISentenceCallback function (string sentence) returns error?;

public client class Client {
    websocket:Client wsClient;
    OpenAISentenceCallback onSentence;
    boolean isRunning = false;

    public function init(string apiKey, OpenAISentenceCallback callback) returns error? {
        self.onSentence = callback;
        self.wsClient = check new ("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
            config = {
                customHeaders: {
                    "Authorization": "Bearer " + apiKey,
                    "OpenAI-Beta": "realtime=v1"
                }
            }
        );
        self.isRunning = true;
        // Start listening loop in background
        _ = start self.listen();

        // Send initial session config
        check self.sendSessionUpdate();
    }

    function listen() returns error? {
        while self.isRunning {
            // Read message from OpenAI
            json|error msg = self.wsClient->readMessage();
            if msg is error {
                io:println("Error reading from OpenAI: ", msg);
                break;
            }

            // Handle Event
            check self.handleEvent(msg);
        }
    }

    function handleEvent(json event) returns error? {
        map<json> eventMap = <map<json>>event;
        // eventMap["type"] returns json, so we perform safe casting
        json typeJson = eventMap["type"];
        string eventType = typeJson.toString();

        if eventType == "response.text.done" {
            // Full sentence received!
            string text = (check event.text).toString();
            io:println("OpenAI Full Sentence: ", text);
            // Callback to Service for Redaction
            check self.onSentence(text);
        } else if eventType == "error" {
            io:println("OpenAI Error: ", event);
        }
    }

    public function sendAudio(string base64Audio) returns error? {
        json msg = {
            "type": "input_audio_buffer.append",
            "audio": base64Audio
        };
        return self.wsClient->writeMessage(msg);
    }

    function sendSessionUpdate() returns error? {
        json msg = {
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": "You are a helpful interviewer. Listen to the user and generate text responses. Do not speak audio back immediately, we will handle TTS separately if needed.",
                "voice": "alloy",
                "input_audio_format": "g711_ulaw", // Twilio uses mulaw (g711_ulaw)
                "output_audio_format": "g711_ulaw",
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 500
                }
            }
        };
        return self.wsClient->writeMessage(msg);
    }

    public function close() returns error? {
        self.isRunning = false;
        return self.wsClient->close();
    }
}
