import ballerina/test;
import equihire/gateway.utils;

@test:Config {
    groups: ["unit"]
}
function testBuildCvParsePrompt() {
    string rawText = "Experience: 5 years Java. Education: BSc Computer Science.";
    string prompt = utils:buildCvParsePrompt(rawText);
    
    test:assertTrue(prompt.includes("Experience: 5 years Java"), "Prompt should contain the raw text");
    test:assertTrue(prompt.includes("JSON object"), "Prompt should ask for JSON format");
}

@test:Config {
    groups: ["unit"]
}
function testBuildGradingPrompt() {
    string candidateAns = "It is Object oriented programming.";
    string question = "What is OOP?";
    string idealAns = "Object Oriented Programming paradigm.";
    string expLevel = "Junior";
    string stack = "Java, Spring";
    string violations = "No violations detected.";

    string prompt = utils:buildGradingPrompt(candidateAns, question, idealAns, expLevel, stack, violations);

    test:assertTrue(prompt.includes("What is OOP?"), "Prompt must include the question");
    test:assertTrue(prompt.includes("Junior"), "Prompt must include experience level");
    test:assertTrue(prompt.includes("Java"), "Prompt must include the tech stack");
    test:assertTrue(prompt.includes("Score from 0-10"), "Prompt must request a numerical score in the 0-10 range");
}

@test:Config {
    groups: ["unit"]
}
function testJoinStrings() {
    string[] parts = ["Java", "Spring", "AWS"];
    string joined = utils:joinStrings(parts, ", ");
    test:assertEquals(joined, "Java, Spring, AWS", "Strings should be joined with the separator");
    
    string[] emptyParts = [];
    test:assertEquals(utils:joinStrings(emptyParts, ", "), "", "Empty string array should return empty string");
}

@test:Config {
    groups: ["unit"]
}
function testPiiMaskingRoundTrip() {
    map<json> piiMap = {
        "{{NAME_1}}": "Alice Bob",
        "{{EMAIL_1}}": "alice@example.com"
    };

    string rawStr = "Hello Alice Bob, your email is alice@example.com.";
    string masked = utils:maskPii(rawStr, piiMap);
    
    test:assertTrue(masked.includes("{{NAME_1}}"), "Should contain the mask placeholder");
    test:assertFalse(masked.includes("Alice Bob"), "Should not contain the original name");

    string unmasked = utils:unmaskPii(masked, piiMap);
    test:assertEquals(unmasked, rawStr, "Unmasking should perfectly restore the original string");
}
