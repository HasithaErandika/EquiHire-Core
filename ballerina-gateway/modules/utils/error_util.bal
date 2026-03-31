import ballerina/http;
import ballerina/time;

public function createBadRequest(string message) returns http:BadRequest {
    return {
        body: {
            "error": message,
            "code": 400,
            "timestamp": time:utcToString(time:utcNow())
        }
    };
}

public function createInternalError(string message) returns http:InternalServerError {
    return {
        body: {
            "error": message,
            "code": 500,
            "timestamp": time:utcToString(time:utcNow())
        }
    };
}
