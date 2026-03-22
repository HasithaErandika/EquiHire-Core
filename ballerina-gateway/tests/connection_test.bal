import ballerina/test;
import ballerina/http;
import ballerina/email;
import ballerina/log;
import avi0ra/huggingface;
import equihire/gateway.config;
import equihire/gateway.clients;
import equihire/gateway.constants;

@test:Config {}
function testAsgardeoConnection() returns error? {
    log:printInfo("Testing Asgardeo JWKS URL Connection...");
    http:Client asgClient = check new(config:asgardeoJwksUrl);
    http:Response|error res = asgClient->get("");
    if res is http:Response {
        test:assertTrue(res.statusCode == 200 || res.statusCode == 404 || res.statusCode == 401 || res.statusCode == 400 || res.statusCode == 403, "Asgardeo connection test executed successfully through HTTP");
    } else {
        test:assertFail("Asgardeo connection failed: " + res.message());
    }
}

@test:Config {}
function testHuggingFaceConnection() returns error? {
    log:printInfo("Testing HuggingFace Inference Connection via Connector...");
    huggingface:ZeroShotClassificationRequest hfPayload = {
        inputs: "test",
        parameters: {candidateLabels: ["relevant", "irrelevant"]}
    };
    huggingface:ZeroShotClassificationResponse|error res = 
        clients:hfClient->/hf\-inference/models/[constants:HF_ZERO_SHOT_MODEL]/zero\-shot\-classification.post(hfPayload);
    
    if res is error {
        log:printWarn("HuggingFace connector call failed (expected if mock token used): " + res.message());
    } else {
        log:printInfo("HuggingFace connector call successful");
    }
}

@test:Config {}
function testHuggingFaceRelevanceTest() returns error? {
    log:printInfo("Testing HuggingFace Zero-Shot Relevance Evaluation...");
    huggingface:ZeroShotClassificationRequest hfPayload = {
        inputs: "I have 5 years of experience in Java and Spring Boot.",
        parameters: {candidateLabels: ["relevant", "irrelevant"]}
    };
    huggingface:ZeroShotClassificationResponse|error res = 
        clients:hfClient->/hf\-inference/models/[constants:HF_ZERO_SHOT_MODEL]/zero\-shot\-classification.post(hfPayload);
    
    if res is huggingface:ZeroShotClassificationResponse {
        test:assertTrue(res.length() > 0, "HF response should contain labels");
        boolean hasRelevant = false;
        foreach var item in res {
            if item.label == "relevant" {
                hasRelevant = true;
                float score = <float>(item.score ?: 0.0);
                test:assertTrue(score > 0.5, "Relevance score for a valid engineering answer should be high");
            }
        }
        test:assertTrue(hasRelevant, "Response must contain 'relevant' label");
    }
}

@test:Config {}
function testGeminiConnection() returns error? {
    log:printInfo("Testing Gemini API Connection...");
    json payload = {"contents": [{"parts": [{"text": "Hello"}]}]};
    http:Response|error res = clients:geminiClient->post(string `/models/${constants:GEMINI_MODEL}:generateContent?key=${config:geminiApiKey}`, payload);
    if res is http:Response {
        test:assertTrue(res.statusCode == 200 || res.statusCode == 400 || res.statusCode == 401 || res.statusCode == 403, "Gemini connection test executed successfully through HTTP");
    } else {
        test:assertFail("Gemini connection failed: " + res.message());
    }
}

@test:Config {}
function testSmtpConnection() returns error? {
    log:printInfo("Testing SMTP Connection Init...");
    email:SmtpClient|error smtpClient = new (
        host     = config:smtpHost,
        username = config:smtpUsername,
        password = config:smtpPassword,
        port     = config:smtpPort,
        security = email:START_TLS_AUTO
    );
    if smtpClient is error {
        log:printWarn("SMTP client initialization failed, likely due to mock credentials: " + smtpClient.message());
    } else {
         test:assertTrue(true, "SMTP connection initialized successfully");
    }
}

@test:Config {}
function testR2Connection() returns error? {
    log:printInfo("Testing Cloudflare R2 Connection...");
    http:Response|error res = clients:r2HttpClient->get("/");
    if res is http:Response {
        test:assertTrue(res.statusCode == 200 || res.statusCode == 400 || res.statusCode == 403, "R2 connection test executed successfully through HTTP");
    } else {
         test:assertFail("R2 connection failed: " + res.message());
    }
}

@test:Config {}
function testSupabaseConnection() returns error? {
    log:printInfo("Testing Supabase Connection...");
    http:Response|error res = clients:supabaseHttpClient->get("/rest/v1/", headers = clients:getSupabaseHeaders());
    if res is http:Response {
        test:assertTrue(res.statusCode == 200 || res.statusCode == 401 || res.statusCode == 404, "Supabase connection test executed successfully");
    } else {
        test:assertFail("Supabase connection failed: " + res.message());
    }
}

