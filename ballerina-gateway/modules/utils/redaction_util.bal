// ===========================================================================
// modules/utils/redaction_util.bal — PII masking and string replacement.
// ===========================================================================

// Masks PII in text using the redaction map from CV parsing.
// piiMap convention: key = placeholder token (e.g. {{NAME_1}}), value = original PII (e.g. "Alice Bob").
// maskPii replaces occurrences of the original PII value with its placeholder key.
public function maskPii(string text, map<json> piiMap) returns string {
    string result = text;
    foreach [string, json] [placeholder, originalPii] in piiMap.entries() {
        string original = originalPii.toString();
        // Replace original PII with placeholder token
        while result.includes(original) {
            int? idx = result.indexOf(original);
            if idx is int {
                string before = idx > 0 ? result.substring(0, idx) : "";
                string after = result.substring(idx + original.length());
                result = before + placeholder + after;
            }
        }
    }
    return result;
}

// Replaces placeholder tokens back to original PII values (for recruiter reveal).
// piiMap convention: key = placeholder token (e.g. {{NAME_1}}), value = original PII.
// unmaskPii replaces each placeholder key in the text with its original PII value.
public function unmaskPii(string text, map<json> piiMap) returns string {
    string result = text;
    foreach [string, json] [placeholder, originalPii] in piiMap.entries() {
        string original = originalPii.toString();
        // Replace placeholder token with original PII
        while result.includes(placeholder) {
            int? idx = result.indexOf(placeholder);
            if idx is int {
                string before = idx > 0 ? result.substring(0, idx) : "";
                string after = result.substring(idx + placeholder.length());
                result = before + original + after;
            }
        }
    }
    return result;
}
