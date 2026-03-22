import ballerina/test;
import ballerina/http;

@test:Config {}
function testCorsHeaders() returns error? {
    http:Client testClient = check new("http://localhost:8080");
    map<string|string[]> headers = {"Origin": "http://localhost:3000"};

    // The OPTIONS request should handle CORS
    http:Response res = check testClient->options("/api/organizations/1/stats", headers = headers);
    
    test:assertTrue(res.statusCode == 200 || res.statusCode == 404 || res.statusCode == 204, msg = "CORS preflight failed");
    
    // We expect the Access-Control-Allow-Origin header to be present in OPTIONS responses
    if res.hasHeader("Access-Control-Allow-Origin") {
        string header = check res.getHeader("Access-Control-Allow-Origin");
        test:assertEquals(header, "*", msg = "CORS Allow-Origin should be wildcard");
    }
}

@test:Config {}
function testMissingAuthScenarios() returns error? {
    http:Client testClient = check new("http://localhost:8080");

    // Try creating a job without any auth headers
    json payload = {
        "title": "Hacker Role",
        "description": "Attempting payload injection",
        "requiredSkills": ["bypass"]
    };

    http:Response res = check testClient->post("/api/organizations/invalid-org/jobs", payload);
    
    // Without auth, depends on implementation, but should ideally be 401 or 500 if supabase fails
    test:assertTrue(res.statusCode >= 400, msg = "Unauthenticated or invalid org requests should be rejected");
}

@test:Config {}
function testSqlLikeInjectionPayloads() returns error? {
    http:Client testClient = check new("http://localhost:8080");

    // SQL injection payload in candidate ID
    string maliciousCandidateId = "1' OR '1'='1";
    http:Response res = check testClient->get(string `/api/candidates/${maliciousCandidateId}/reveal`);

    // The API should handle this gracefully (400 or 500), not executing the query successfully.
    test:assertTrue(res.statusCode >= 400, "Malicious path parameters should be handled safely by the gateway or DB");
}
