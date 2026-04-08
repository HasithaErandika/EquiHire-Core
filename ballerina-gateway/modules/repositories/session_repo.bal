// ===========================================================================
// modules/repositories/session_repo.bal — Supabase queries for exam sessions,
// cheat events, and raw answer vault.
// ===========================================================================
import ballerina/http;
import equihire/gateway.clients;
import equihire/gateway.constants;

// ---------------------------------------------------------------------------
// Exam Sessions
// ---------------------------------------------------------------------------

public function createExamSession(string candidateId, string invitationId,
                                  string jobId) returns string|error {
    
    // Check for an existing active session
    string checkPath = string `/rest/v1/exam_sessions?candidate_id=eq.${candidateId}&job_id=eq.${jobId}&select=id&order=created_at.desc&limit=1`;
    http:Response checkResp = check clients:supabaseHttpClient->get(
        checkPath, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if checkResp.statusCode < 300 {
        json[] existing = <json[]>check checkResp.getJsonPayload();
        if existing.length() > 0 {
            return (<map<json>>existing[0])["id"].toString();
        }
    }
    json payload = {
        "candidate_id":   candidateId,
        "invitation_id":  invitationId,
        "job_id":         jobId,
        "status":         constants:SESSION_IN_PROGRESS,
        "submission_type": constants:SUBMIT_MANUAL
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/exam_sessions", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("createExamSession failed for candidate " + candidateId + ": " + err.toString());
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("createExamSession: no rows returned"); }
    return (<map<json>>rows[0])["id"].toString();
}

public function updateExamSession(string sessionId, string status,
                                  string? submissionType) returns error? {
    json payload = submissionType is string
        ? {"status": status, "submission_type": submissionType}
        : {"status": status};

    string path = string `/rest/v1/exam_sessions?id=eq.${sessionId}`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("updateExamSession failed for session " + sessionId + ": " + err.toString());
    }
}

public function flagExamSession(string sessionId) returns error? {
    json payload = {"is_flagged_cheating": true, "status": constants:SESSION_FLAGGED};
    string path  = string `/rest/v1/exam_sessions?id=eq.${sessionId}`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("flagExamSession failed for session " + sessionId);
    }
}

// ---------------------------------------------------------------------------
// Cheat Events
// ---------------------------------------------------------------------------

public function insertCheatEvent(string sessionId, string candidateId, string eventType,
                                 string occurredAt, json? details) returns error? {
    json payload = {
        "session_id":   sessionId,
        "candidate_id": candidateId,
        "event_type":   eventType,
        "occurred_at":  occurredAt,
        "details":      details is () ? <json>{} : details
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/cheat_events", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("insertCheatEvent failed for session " + sessionId + ": " + err.toString());
    }
}

// ---------------------------------------------------------------------------
// Raw Answer Vault
// ---------------------------------------------------------------------------

public function insertRawAnswer(string sessionId, string candidateId, string questionId,
                                string rawAnswerText, int? timeSpentSeconds,
                                int wordCount) returns string|error {
    json payload = {
        "session_id":        sessionId,
        "candidate_id":      candidateId,
        "question_id":       questionId,
        "raw_answer_text":   rawAnswerText,
        "hf_checked":        false,
        "time_spent_seconds": timeSpentSeconds is () ? <json>() : timeSpentSeconds,
        "word_count":        wordCount
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/raw_answer_vault", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("insertRawAnswer failed for candidate " + candidateId + ", question " + questionId + ": " + err.toString());
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("insertRawAnswer: no rows returned"); }
    return (<map<json>>rows[0])["id"].toString();
}

public function markRawAnswerHfChecked(string rawAnswerVaultId) returns error? {
    json payload = {"hf_checked": true};
    string path  = string `/rest/v1/raw_answer_vault?id=eq.${rawAnswerVaultId}`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("markRawAnswerHfChecked failed for vault row " + rawAnswerVaultId);
    }
}
