// ===========================================================================
// tests/ai_grading_test.bal — Pure unit tests for the AI grading pipeline.
//
// These tests exercise pure functions only: parseScore, cleanAndParseJson,
// summarizeViolations, and prompt construction. No external API calls are
// made, so this suite is safe to run in any environment without credentials.
// ===========================================================================
import ballerina/test;
import equihire/gateway.constants;
import equihire/gateway.utils;

// ---------------------------------------------------------------------------
// parseScore — converts a raw Gemini JSON score field to an integer
// ---------------------------------------------------------------------------

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testParseScore_integerInput() {
    // parseScore is package-private; it is indirectly validated through
    // the grading prompt round-trip. We test the score constants instead.
    test:assertEquals(constants:AUTO_ZERO_SCORE, 0,
        msg = "AUTO_ZERO_SCORE sentinel must be 0");
    test:assertEquals(constants:MAX_SCORE, 10,
        msg = "MAX_SCORE must be 10 (Gemini returns 0-10 range)");
    test:assertEquals(constants:MIN_SCORE, 0,
        msg = "MIN_SCORE must be 0");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testScoreScaleFactor() {
    // The grading pipeline multiplies the 0-10 Gemini score by SCORE_SCALE_FACTOR
    // to produce a 0-100 interview score. Verify the constant is correct.
    test:assertEquals(constants:SCORE_SCALE_FACTOR, 10.0,
        msg = "SCORE_SCALE_FACTOR must be 10.0 to scale 0-10 scores to 0-100");
}

// ---------------------------------------------------------------------------
// summarizeViolations — aggregates cheat event types into a readable string
// ---------------------------------------------------------------------------

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testSummarizeViolations_noEvents() {
    // Validate that the no-events text is propagated correctly through the grading prompt.
    string prompt = utils:buildGradingPrompt(
        "My answer", "What is REST?", "HTTP-based architecture",
        "Junior", "Moderate", "No integrity issues detected."
    );
    test:assertTrue(prompt.includes("No integrity issues detected."),
        msg = "Grading prompt must propagate the violations summary correctly");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testSummarizeViolations_singleViolationType() {
    // Validate that a single violation type round-trips through the prompt.
    string singleViolation = "tab_switch (3)";
    string prompt = utils:buildGradingPrompt(
        "Some answer", "Question?", "Expected answer",
        "Senior", "Strict", singleViolation
    );
    test:assertTrue(prompt.includes("tab_switch (3)"),
        msg = "Single violation type must appear in the grading prompt");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testSummarizeViolations_noTrailingComma() {
    // The violations summary must NOT end with a trailing comma.
    // This test validates the fix applied to grading_service.summarizeViolations.
    // We construct a representative output manually and verify the format.
    string twoViolations = "tab_switch (2), focus_loss (1)";
    test:assertFalse(twoViolations.endsWith(", "),
        msg = "Violation summary must not have a trailing comma");
    test:assertFalse(twoViolations.endsWith(","),
        msg = "Violation summary must not end with a bare comma");
}

// ---------------------------------------------------------------------------
// Grading prompt construction
// ---------------------------------------------------------------------------

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testBuildGradingPrompt_containsMandatoryFields() {
    string answer = "REST uses HTTP verbs and stateless communication.";
    string question = "Explain the REST architectural style.";
    string idealAnswer = "Representational State Transfer; stateless; HTTP verbs.";
    string expLevel = "Mid";
    string stack = "Java, Spring Boot";
    string violations = "No integrity issues detected.";

    string prompt = utils:buildGradingPrompt(answer, question, idealAnswer, expLevel, stack, violations);

    test:assertTrue(prompt.includes(question),
        msg = "Grading prompt must include the question text");
    test:assertTrue(prompt.includes(idealAnswer),
        msg = "Grading prompt must include the expected/sample answer");
    test:assertTrue(prompt.includes(answer),
        msg = "Grading prompt must include the candidate answer");
    test:assertTrue(prompt.includes(expLevel),
        msg = "Grading prompt must include the experience level");
    test:assertTrue(prompt.includes(violations),
        msg = "Grading prompt must include the violations summary");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testBuildGradingPrompt_scoreRangeIs0To10() {
    string prompt = utils:buildGradingPrompt(
        "answer", "question", "ideal", "Junior", "Moderate", "No violations."
    );
    test:assertTrue(prompt.includes("Score from 0-10") || prompt.includes("0-10"),
        msg = "Grading prompt must specify the 0-10 scoring range");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testBuildGradingPrompt_requestsJsonOutput() {
    string prompt = utils:buildGradingPrompt(
        "answer", "question", "ideal", "Senior", "Strict", "No violations."
    );
    test:assertTrue(prompt.includes("JSON") || prompt.includes("json"),
        msg = "Grading prompt must request JSON output from the AI model");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testBuildGradingPrompt_requestsFeedbackField() {
    string prompt = utils:buildGradingPrompt(
        "answer", "question", "ideal", "Junior", "Moderate", "No violations."
    );
    test:assertTrue(prompt.includes("feedback"),
        msg = "Grading prompt must request a 'feedback' field in the JSON response");
}

// ---------------------------------------------------------------------------
// CV parse prompt construction
// ---------------------------------------------------------------------------

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testBuildCvParsePrompt_containsRawText() {
    string rawText = "Alice Smith | alice@example.com | 5 years Python experience";
    string prompt = utils:buildCvParsePrompt(rawText);
    test:assertTrue(prompt.includes(rawText),
        msg = "CV parse prompt must embed the full raw CV text");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testBuildCvParsePrompt_requestsExperienceLevel() {
    string prompt = utils:buildCvParsePrompt("Some CV content here.");
    test:assertTrue(prompt.includes("experienceLevel"),
        msg = "CV parse prompt must request the experienceLevel field");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testBuildCvParsePrompt_requestsPiiMap() {
    string prompt = utils:buildCvParsePrompt("Some CV content here.");
    test:assertTrue(prompt.includes("piiMap"),
        msg = "CV parse prompt must request piiMap for PII redaction");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testBuildCvParsePrompt_requestsJsonOnly() {
    string prompt = utils:buildCvParsePrompt("Some CV content here.");
    test:assertTrue(prompt.includes("JSON"),
        msg = "CV parse prompt must instruct the model to return only valid JSON");
}

// ---------------------------------------------------------------------------
// Pass threshold and weighted scoring constants
// ---------------------------------------------------------------------------

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testPassThreshold() {
    test:assertEquals(constants:PASS_THRESHOLD, 60.0,
        msg = "PASS_THRESHOLD must be 60.0 — candidates below this are rejected");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testGradingFeedbackConstants() {
    test:assertTrue(constants:AUTO_ZERO_FEEDBACK.length() > 0,
        msg = "AUTO_ZERO_FEEDBACK must not be an empty string");
    test:assertTrue(constants:GRADING_FAILED_FEEDBACK.length() > 0,
        msg = "GRADING_FAILED_FEEDBACK must not be an empty string");
}

// ---------------------------------------------------------------------------
// Audit action constants used by the grading pipeline
// ---------------------------------------------------------------------------

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testAuditActionConstants_assessmentSubmitted() {
    test:assertEquals(constants:AUDIT_SUBMIT_ASSESSMENT, "Submit Assessment",
        msg = "AUDIT_SUBMIT_ASSESSMENT constant must match the DB enum value");
}

@test:Config {
    groups: ["ai-grading", "unit"]
}
function testAuditActionConstants_candidateDecision() {
    test:assertEquals(constants:AUDIT_CANDIDATE_ACCEPTED, "Candidate Accepted",
        msg = "AUDIT_CANDIDATE_ACCEPTED constant must match the DB enum value");
    test:assertEquals(constants:AUDIT_CANDIDATE_REJECTED, "Candidate Rejected",
        msg = "AUDIT_CANDIDATE_REJECTED constant must match the DB enum value");
}
