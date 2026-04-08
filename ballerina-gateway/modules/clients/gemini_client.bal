// ===========================================================================
// modules/clients/gemini_client.bal — Gemini HTTP client initialization.
// ===========================================================================
import ballerina/http;
import equihire/gateway.config;

public final http:Client geminiClient = check new (config:geminiBaseUrl, {
    timeout: 120
});
