// ===========================================================================
// modules/services/cv_service.bal — CV upload pipeline.
// ===========================================================================
import ballerina/http;
import ballerina/log;
import ballerina/uuid;
import equihire/gateway.clients;
import equihire/gateway.config;
import equihire/gateway.constants;
import equihire/gateway.repositories;
import equihire/gateway.types;
import equihire/gateway.utils;

public function uploadAndParseCV(byte[] pdfBytes, string jobId) returns types:UploadCvResponse|error {
    string candidateId = uuid:createType1AsString();
    log:printInfo("CV upload started", candidateId = candidateId, jobId = jobId);

    string rawText = check extractPdfText(pdfBytes, candidateId);
    string r2Key   = check storeInR2(pdfBytes, candidateId);
    json   cvJson  = check parseWithGemini(rawText, candidateId, jobId);

    map<json> cvMap = <map<json>>cvJson;
    string redactedText = applyPiiMask(rawText, cvMap);

    _ = start saveCvAsync(cvJson, candidateId, jobId, r2Key, redactedText);

    return buildCvPreview(candidateId, r2Key, cvMap);
}

function extractPdfText(byte[] pdfBytes, string candidateId) returns string|error {
    string|error raw = utils:extractTextFromPdf(pdfBytes);
    if raw is error {
        log:printError("PDF extraction failed", 'error = raw, candidateId = candidateId);
        return error("Could not read PDF content: " + raw.message());
    }
    log:printInfo("PDF extracted", candidateId = candidateId, chars = raw.length());
    return raw;
}

function storeInR2(byte[] pdfBytes, string candidateId) returns string|error {
    string r2Key = string `cvs/${candidateId}.pdf`;
    types:R2Config r2Cfg = {
        accountId: config:r2AccountId, bucketName: config:r2BucketName,
        accessKeyId: config:r2AccessKey, secretAccessKey: config:r2SecretKey,
        region: config:r2Region
    };
    error? r2Err = utils:uploadBytesToR2(r2Cfg, pdfBytes, r2Key, clients:r2HttpClient);
    if r2Err is error {
        log:printWarn("R2 upload failed — continuing without storage", 'error = r2Err, r2Key = r2Key);
    } else {
        log:printInfo("CV stored in R2", r2Key = r2Key);
    }
    return r2Key;
}

function parseWithGemini(string rawText, string candidateId, string jobId) returns json|error {
    string prompt = utils:buildCvParsePrompt(rawText);
    string url    = string `/models/${constants:GEMINI_MODEL}:generateContent?key=${config:geminiApiKey}`;
    http:Response res = check clients:geminiClient->post(url, {"contents": [{"parts": [{"text": prompt}]}]});
    if res.statusCode < 200 || res.statusCode >= 300 {
        log:printError("Gemini CV parse failed", statusCode = res.statusCode, candidateId = candidateId);
        return error("AI could not parse the CV (HTTP " + res.statusCode.toString() + ")");
    }
    json rp  = check res.getJsonPayload();
    string raw = check extractGeminiTextCv(rp);
    return cleanAndParseCv(raw);
}

function applyPiiMask(string rawText, map<json> cvMap) returns string {
    var piiMapVal = cvMap["piiMap"];
    if piiMapVal is map<json> { return utils:maskPii(rawText, piiMapVal); }
    return rawText;
}

function buildCvPreview(string candidateId, string r2Key, map<json> cvMap) returns types:UploadCvResponse {
    map<json> safe = {};
    if cvMap.hasKey("experienceLevel") { safe["experienceLevel"] = cvMap["experienceLevel"]; }
    if cvMap.hasKey("detectedStack")   { safe["detectedStack"]   = cvMap["detectedStack"]; }
    if cvMap.hasKey("sections")        { safe["sections"]        = cvMap["sections"]; }
    return {status: "success", candidateId: candidateId, r2Key: r2Key, parsed: safe};
}

function saveCvAsync(json parsedData, string candidateId, string jobId, string r2Key, string redacted) returns error? {
    map<json> d   = <map<json>>parsedData;
    map<json> sec = d.hasKey("sections") ? <map<json>>d["sections"] : {};
    json edu  = sec.hasKey("education")       ? sec["education"]       : [];
    json work = sec.hasKey("work_experience") ? sec["work_experience"] : [];
    json proj = sec.hasKey("projects")        ? sec["projects"]        : [];
    json achvs = sec.hasKey("achievements")    ? sec["achievements"]    : [];
    json certs = sec.hasKey("certificates")    ? sec["certificates"]    : [];
    json tech = d.hasKey("detectedStack")     ? d["detectedStack"]     : [];
    json piiEntities = d.hasKey("piiEntities") ? d["piiEntities"] : [];
    json piiMap      = d.hasKey("piiMap")      ? d["piiMap"]      : {};
    string expLevel  = d.hasKey("experienceLevel") ? d["experienceLevel"].toString() : "junior";
    float estimatedYears = d.hasKey("estimatedYears") && d["estimatedYears"] is float ? <float>d["estimatedYears"] : 0.0;

    // 1. Create the base profile and identity
    check repositories:createSecureIdentity(candidateId, r2Key, jobId);

    // 2. Save the PII map (used for grading later)
    check repositories:insertPiiEntityMap(candidateId, piiEntities, piiMap);

    // 3. Save Context Tags (experience level and detected skills)
    check repositories:insertContextTags(candidateId, jobId, expLevel, tech, estimatedYears);
    
    // 4. Save parsed sections
    check repositories:insertCvParsedSections(candidateId, jobId, redacted, edu, work, proj, achvs, certs, tech);
    _ = start evaluateCandidateCv(candidateId);
    log:printInfo("CV and profile saved to Supabase", candidateId = candidateId, jobId = jobId);
}

function extractGeminiTextCv(json responsePayload) returns string|error {
    map<json> top = <map<json>>responsePayload;
    if top.hasKey("error") { return error("Gemini error: " + (<map<json>>top["error"])["message"].toString()); }
    var cands = top["candidates"];
    if cands is json[] && cands.length() > 0 {
        var content = (<map<json>>cands[0])["content"];
        if content is map<json> {
            json[] parts = <json[]>content["parts"];
            if parts.length() > 0 {
                var firstPart = parts[0];
                if firstPart is map<json> {
                    var t = firstPart["text"];
                    if t is string { return t; }
                }
            }
        }
    }
    return error("Gemini returned no content");
}

function cleanAndParseCv(string raw) returns json|error {
    string cleaned = raw.trim();
    if cleaned.startsWith("```") {
        int? nl = cleaned.indexOf("\n");
        int? lb = cleaned.lastIndexOf("```");
        if nl is int && lb is int && nl < lb {
            cleaned = cleaned.substring(nl + 1, lb).trim();
        }
    }
    return cleaned.fromJsonString();
}
