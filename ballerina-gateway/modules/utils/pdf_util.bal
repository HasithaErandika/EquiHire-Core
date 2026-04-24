// ===========================================================================
// modules/utils/pdf_util.bal — PDFBox Java interop for extracting PDF text.
// ===========================================================================
import ballerina/io;
import ballerina/file;
import ballerina/jballerina.java;
import ballerina/log;

// Extracts text from a PDF byte array using Apache PDFBox (Java interop).
// Writes bytes to a temp file, loads via PDFBox Loader, extracts text.
public isolated function extractTextFromPdf(byte[] pdfBytes) returns string|error {
    string tempPath = check file:createTemp("resume", ".pdf");
    check io:fileWriteBytes(tempPath, pdfBytes);

    handle fileHandle = newFile(java:fromString(tempPath));
    handle document = check loadPdfFromFile(fileHandle);

    string result = "";
    do {
        handle stripper = check newPDFTextStripper();
        handle textHandle = check getText(stripper, document);
        string? extracted = java:toString(textHandle);
        if extracted is string {
            result = extracted;
        } else {
            return error("PDF extraction returned null text");
        }
    } on fail error e {
        error? closeErr = closeDocument(document);
        if closeErr is error {
            log:printError("Failed to close PDDocument during error", 'error = closeErr);
        }
        check file:remove(tempPath);
        return e;
    }

    error? closeErr = closeDocument(document);
    if closeErr is error {
        log:printError("Failed to close PDDocument", 'error = closeErr);
    }
    check file:remove(tempPath);
    return result;
}

// ---------------------------------------------------------------------------
// Java interop declarations — match PDFBox 3.x API
// ---------------------------------------------------------------------------

isolated function newFile(handle pathname) returns handle = @java:Constructor {
    'class: "java.io.File",
    paramTypes: ["java.lang.String"]
} external;

isolated function loadPdfFromFile(handle file) returns handle|error = @java:Method {
    name: "loadPDF",
    'class: "org.apache.pdfbox.Loader",
    paramTypes: ["java.io.File"]
} external;

isolated function closeDocument(handle document) returns error? = @java:Method {
    name: "close",
    'class: "org.apache.pdfbox.pdmodel.PDDocument"
} external;

isolated function newPDFTextStripper() returns handle|error = @java:Constructor {
    'class: "org.apache.pdfbox.text.PDFTextStripper"
} external;

isolated function getText(handle stripper, handle document) returns handle|error = @java:Method {
    name: "getText",
    'class: "org.apache.pdfbox.text.PDFTextStripper"
} external;
