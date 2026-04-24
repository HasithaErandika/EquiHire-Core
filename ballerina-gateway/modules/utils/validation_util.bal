// ===========================================================================
// modules/utils/validation_util.bal — Shared input validation helpers.
// ===========================================================================

// Validates that both file bytes and jobId are present for CV upload.
public function requireUploadParts(byte[]? fileBytes, string? jobId) returns error? {
    if fileBytes is () {
        return error("Missing 'file' part in multipart upload");
    }
    if jobId is () || jobId == "" {
        return error("Missing 'jobId' part in multipart upload");
    }
}

// Validates that a required string field is present and non-empty.
public function requireField(string? value, string fieldName) returns string|error {
    if value is () || value == "" {
        return error("Missing required field: " + fieldName);
    }
    return value;
}
