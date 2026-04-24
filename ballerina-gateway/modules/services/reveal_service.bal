// ===========================================================================
// modules/services/reveal_service.bal — Candidate identity reveal logic.
// ===========================================================================
import ballerina/http;
import ballerina/log;
import equihire/gateway.config;
import equihire/gateway.repositories;
import equihire/gateway.utils;
import equihire/gateway.types;
import equihire/gateway.clients;

public function revealCandidate(string candidateId) returns types:RevealResponse|error {
    // Look up the actual R2 object key stored at upload time
    string|error storedKey = repositories:getR2ObjectKey(candidateId);
    
    string objectKey;
    if storedKey is string {
        objectKey = storedKey;
        log:printInfo("Using stored R2 key", candidateId = candidateId, objectKey = objectKey);
    } else {
        // Fallback to the legacy pattern if no entry found (e.g. older candidates)
        objectKey = string `cvs/${candidateId}.pdf`;
        log:printWarn("No stored R2 key found, falling back to default pattern",
                      candidateId = candidateId, 'error = storedKey);
    }

    string|error headUrl = utils:generateR2PresignedUrl(
        config:r2AccessKey, config:r2SecretKey, config:r2AccountId, config:r2BucketName, objectKey, "HEAD", 60
    );

    if headUrl is string {
        int? idx = headUrl.indexOf("/", 8); // Skip "https://"
        if idx is int {
            string pathAndQuery = headUrl.substring(idx, headUrl.length());
            http:Response|error headResp = clients:r2HttpClient->head(pathAndQuery);
            if headResp is error || headResp.statusCode >= 400 {
                 log:printWarn("CV file check failed (missing or inaccessible)", candidateId = candidateId, objectKey = objectKey);
                 return error("The CV file could not be found in storage.");
            }
        }
    }

    string|error presignedUrl = utils:generateR2PresignedUrl(
        config:r2AccessKey, config:r2SecretKey, config:r2AccountId, config:r2BucketName, objectKey, "GET", 3600
    );

    if presignedUrl is error {
        log:printError("Failed to generate GET reveal URL", 'error = presignedUrl, candidateId = candidateId, objectKey = objectKey);
        return {url: (), status: "error"};
    }

    log:printInfo("Reveal URL generated", candidateId = candidateId, objectKey = objectKey);
    return {url: presignedUrl, status: "ready"};
}
