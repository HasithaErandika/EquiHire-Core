import ballerina/test;
import equihire/gateway.utils;

@test:Config {
    groups: ["unit"]
}
function testRequireUploadPartsBothMissing() {
    error? err = utils:requireUploadParts((), ());
    test:assertTrue(err is error, msg = "Expected error when both parts missing");
    if err is error {
        test:assertEquals(err.message(), "Missing 'file' part in multipart upload");
    }
}

@test:Config {
    groups: ["unit"]
}
function testRequireUploadPartsJobIdMissing() {
    byte[] mockFile = [1, 2, 3];
    error? err = utils:requireUploadParts(mockFile, ());
    test:assertTrue(err is error, msg = "Expected error when jobId is missing");
    if err is error {
        test:assertEquals(err.message(), "Missing 'jobId' part in multipart upload");
    }
}

@test:Config {
    groups: ["unit"]
}
function testRequireUploadPartsJobIdEmpty() {
    byte[] mockFile = [1, 2, 3];
    error? err = utils:requireUploadParts(mockFile, "");
    test:assertTrue(err is error, msg = "Expected error when jobId is empty");
    if err is error {
        test:assertEquals(err.message(), "Missing 'jobId' part in multipart upload");
    }
}

@test:Config {
    groups: ["unit"]
}
function testRequireUploadPartsSuccess() {
    byte[] mockFile = [1, 2, 3];
    string jobId = "valid-job-id";
    error? err = utils:requireUploadParts(mockFile, jobId);
    test:assertFalse(err is error, msg = "Expected no error with valid inputs");
}

@test:Config {
    groups: ["unit"]
}
function testRequireFieldMissing() {
    string|error res = utils:requireField((), "testField");
    test:assertTrue(res is error, msg = "Expected error when field is missing");
}

@test:Config {
    groups: ["unit"]
}
function testRequireFieldSuccess() {
    string|error res = utils:requireField("value", "testField");
    test:assertTrue(res is string, msg = "Expected successful string return");
    if res is string {
        test:assertEquals(res, "value");
    }
}
