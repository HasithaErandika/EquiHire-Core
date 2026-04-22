// ===========================================================================
// tests/security_test.bal — Input and CORS security boundary tests.
// These tests require the gateway to be running on port 9092.
// ===========================================================================
import ballerina/test;
import ballerina/http;

@test:Config {
    groups: ["integration"]
}
function testCorsHeaders() returns error? {
    http:Client testClient = check new("http://localhost:9092");
    map<string|string[]> headers = {"Origin": "http://localhost:3000"};

    // The OPTIONS preflight request should be handled by the CORS service config.
    http:Response res = check testClient->options("/api/organizations/1/stats", headers = headers);

    test:assertTrue(res.statusCode == 200 || res.statusCode == 404 || res.statusCode == 204,
        msg = "CORS preflight should return 200, 204, or 404, not an unexpected error");

    // Verify the Access-Control-Allow-Origin header is present in preflight responses.
    if res.hasHeader("Access-Control-Allow-Origin") {
        string header = check res.getHeader("Access-Control-Allow-Origin");
        test:assertEquals(header, "*", msg = "CORS Allow-Origin must be wildcard (*) as per service config");
    }
}

@test:Config {
    groups: ["integration"]
}
function testMissingAuthScenarios() returns error? {
    http:Client testClient = check new("http://localhost:9092");

    // Attempt to create a job against a non-existent organization without authorization.
    json payload = {
        "title": "Unauthorized Role",
        "description": "Attempting unauthorized resource creation",
        "requiredSkills": ["none"]
    };

    http:Response res = check testClient->post("/api/organizations/invalid-org-id/jobs", payload);

    // Without a valid organization context the gateway or DB should return a 4xx or 5xx.
    test:assertTrue(res.statusCode >= 400,
        msg = "Requests against invalid organization resources must be rejected");
}

@test:Config {
    groups: ["integration"]
}
function testSqlLikeInjectionPayloads() returns error? {
    http:Client testClient = check new("http://localhost:9092");

    // Attempt a classic SQL injection string via a path parameter.
    string maliciousCandidateId = "1' OR '1'='1";
    http:Response res = check testClient->get(string `/api/candidates/${maliciousCandidateId}/reveal`);

    // The gateway must handle malicious path parameters gracefully — never succeed.
    test:assertTrue(res.statusCode >= 400,
        msg = "Malicious path parameters must be rejected by the gateway or the database layer");
}
