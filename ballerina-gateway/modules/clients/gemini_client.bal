// ===========================================================================
// modules/clients/gemini_client.bal — Gemini HTTP client initialization.
// ===========================================================================
import ballerina/http;
import equihire/gateway.config;

public final http:Client geminiClient = check new (config:geminiBaseUrl, {
    timeout: 30,
    poolConfig: {
        maxActiveConnections: 5,
        maxIdleConnections: 2,
        waitTime: 5
    },
    retryConfig: {
        count: 1,
        interval: 2
    }
});
