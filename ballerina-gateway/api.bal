import ballerina/http;
import ballerina/io;

// Helper to broadcast (needs to be shared or re-implemented if cross-file)
// For now, we keep it simple. If 'webClients' is in `websocket.bal`, we can't access it easily without a shared module.
// So we will just Log for this version.

type OrganizationRequest record {
    string name;
    string industry;
    string size;
    string userEmail;
};

// --- HTTP Service for API (Port 9092) ---
listener http:Listener apiListener = new (9092);

service /api on apiListener {

    resource function post organizations(@http:Payload OrganizationRequest payload) returns http:Created|error {
        io:println("------------------------------------------------");
        io:println("NEW ORGANIZATION REGISTRATION:");
        io:println("Name: ", payload.name);
        io:println("Industry: ", payload.industry);
        io:println("Size: ", payload.size);
        io:println("User: ", payload.userEmail);
        io:println("------------------------------------------------");

        // TODO: Insert into Supabase/Postgres via ballerina/sql
        return http:CREATED;
    }
}
