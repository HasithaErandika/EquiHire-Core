import ballerina/test;
import ballerina/http;

http:Client testClient = check new ("http://localhost:9092");

@test:Config {
    groups: ["integration"]
}
function testJobsEndpointBadRequest() returns error? {
    json invalidPayload = {"title": "Test"}; // Bad schema
    http:Response response = check testClient->post("/api/jobs", invalidPayload);
    // Since we expect Ballerina HTTP data binding to fail with 400 Bad Request
    test:assertTrue(response.statusCode >= 400, msg = "Expected Bad Request for invalid schema");
}

@test:Config {
    groups: ["integration"]
}
function testOrganizationsEndpointBadRequest() returns error? {
    json invalidPayload = {"industry": "Tech"}; 
    http:Response response = check testClient->post("/api/organizations", invalidPayload);
    test:assertTrue(response.statusCode >= 400, msg = "Expected Bad Request for invalid org schema");
}
