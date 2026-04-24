// ===========================================================================
// health_api.bal — Health check endpoint.
// ===========================================================================
import ballerina/http;

service /health on new http:Listener(9093) {
    resource function get .() returns json {
        return {"status": "ok", "version": "2.0.0", "platform": "EquiHire"};
    }
}
