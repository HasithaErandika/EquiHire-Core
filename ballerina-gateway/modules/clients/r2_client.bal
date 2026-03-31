// ===========================================================================
// modules/clients/r2_client.bal — Cloudflare R2 HTTP client initialization.
// ===========================================================================
import ballerina/http;
import equihire/gateway.config;

public final http:Client r2HttpClient = check new (
    string `https://${config:r2AccountId}.r2.cloudflarestorage.com`,
    {
        timeout: 15,
        poolConfig: {
            maxActiveConnections: 3,
            maxIdleConnections: 1,
            waitTime: 5
        }
    }
);
