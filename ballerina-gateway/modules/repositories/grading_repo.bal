// ===========================================================================
// modules/repositories/grading_repo.bal — Supabase queries for grading
// results, evaluation aggregates, audit logs, and invitations.
// ===========================================================================
import ballerina/http;
import equihire/gateway.clients;
import equihire/gateway.types;

// ---------------------------------------------------------------------------
// Grading Results
// ---------------------------------------------------------------------------

public function insertGradingResult(types:GradingResult result) returns error? {
    json payload = {
        "session_id":         result.sessionId,
        "candidate_id":       result.candidateId,
        "question_id":        result.questionId,
        "redacted_answer":    result.redactedAnswer,
        "score":              result.score,
        "feedback":           result.feedback,
        "hf_gate_passed":     result.hfGatePassed,
        "hf_relevance_score": result.hfRelevanceScore is () ? <json>() : result.hfRelevanceScore,
        "gemini_model":       result.geminiModel,
        "grading_attempt":    result.gradingAttempt,
        "was_flagged":        result.wasFlagged
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/grading_results", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("insertGradingResult failed for candidate " + result.candidateId +
                     ", question " + result.questionId + ": " + err.toString());
    }
}

// ---------------------------------------------------------------------------
// Evaluation Aggregates
// ---------------------------------------------------------------------------

public function insertEvaluationResult(string candidateId, string jobId, float cvScore, float skillsScore,
                                       float interviewScore, float overallScore,
                                       string summaryFeedback, string recommendedStatus) returns error? {
    json payload = {
        "candidate_id":       candidateId,
        "job_id":             jobId,
        "cv_score":           cvScore,
        "skills_score":       skillsScore,
        "interview_score":    interviewScore,
        "overall_score":      overallScore,
        "summary_feedback":   summaryFeedback,
        "recommended_status": recommendedStatus
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/evaluation_results?on_conflict=candidate_id,job_id", payload, headers = clients:getSupabaseUpsertHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("insertEvaluationResult failed for candidate " + candidateId + ": " + err.toString());
    }
}

public function upsertCvEvaluationResult(string candidateId, string jobId, float cvScore, float skillsScore,
                                         string summaryFeedback, string recommendedStatus) returns error? {
    json payload = {
        "candidate_id":       candidateId,
        "job_id":             jobId,
        "cv_score":           cvScore,
        "skills_score":       skillsScore,
        "overall_score":      (cvScore * 0.6) + (skillsScore * 0.4), // Initial weighted score
        "summary_feedback":   summaryFeedback,
        "recommended_status": recommendedStatus
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/evaluation_results?on_conflict=candidate_id,job_id", payload, headers = clients:getSupabaseUpsertHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("upsertCvEvaluationResult failed for candidate " + candidateId + ": " + err.toString());
    }
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

public function getAuditLogs(string organizationId) returns json[]|error {
    string path = string `/rest/v1/audit_logs?organization_id=eq.${organizationId}&select=id,action_type,entity_type,entity_id,details,created_at,recruiter_id,recruiters(email,full_name)&order=created_at.desc`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getAuditLogs failed"); }
    json[] rows = <json[]>check response.getJsonPayload();
    json[] result = [];
    foreach json row in rows {
        map<json> r = <map<json>>row;
        // Resolve actor: prefer recruiter email, fall back to recruiter_id
        string actor = "System";
        json recruiterJson = r["recruiters"];
        if recruiterJson is map<json> {
            actor = recruiterJson["email"] is () ? actor : recruiterJson["email"].toString();
        } else if r["recruiter_id"] !is () {
            actor = r["recruiter_id"].toString();
        }
        string target = r["entity_id"] is () ? r["entity_type"].toString() : r["entity_id"].toString();
        string details = r["details"] is () ? "" : r["details"].toString();
        result.push({
            "id": r["id"].toString(),
            "action": r["action_type"].toString(),
            "actor": actor,
            "target": target,
            "details": details,
            "created_at": r["created_at"].toString()
        });
    }
    return result;
}

public function createAuditLog(string organizationId, string? recruiterId, string actionType,
                               string entityType, string? entityId,
                               map<json> details) returns error? {
    map<json> payload = {
        "organization_id": organizationId,
        "action_type":     actionType,
        "entity_type":     entityType,
        "details":         details
    };
    if recruiterId is string && recruiterId != "" { payload["recruiter_id"] = recruiterId; }
    if entityId is string && entityId != ""       { payload["entity_id"]    = entityId; }

    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/audit_logs", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("createAuditLog failed: " + err.toString());
    }
}

public function getCandidateTranscript(string candidateId) returns types:TranscriptItem[]|error {
    // We join grading_results with questions using PostgREST join syntax.
    string path = string `/rest/v1/grading_results?candidate_id=eq.${candidateId}&select=redacted_answer,score,feedback,hf_gate_passed,was_flagged,questions(question_text,type,sample_answer)`;
    
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    
    if response.statusCode >= 300 {
        return error("getCandidateTranscript failed for candidate " + candidateId);
    }
    
    json[] rows = <json[]>check response.getJsonPayload();
    types:TranscriptItem[] transcript = [];
    
    foreach json row in rows {
        map<json> r = <map<json>>row;
        // PostgREST embeds joined records as a nested object/array.
        json qObj = r["questions"];
        if qObj is map<json> {
            transcript.push({
                questionText: qObj["question_text"].toString(),
                questionType: qObj["type"].toString(),
                sampleAnswer: qObj["sample_answer"] is () ? "" : qObj["sample_answer"].toString(),
                redactedAnswer: r["redacted_answer"].toString(),
                score: check r["score"].ensureType(int),
                feedback: r["feedback"].toString(),
                hfGatePassed: check r["hf_gate_passed"].ensureType(boolean),
                wasFlagged: check r["was_flagged"].ensureType(boolean)
            });
        }
    }
    
    return transcript;
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

public function createInvitation(string token, string candidateEmail, string candidateName,
                                 string jobTitle, string recruiterId, string organizationId,
                                 string jobId, string? interviewDate,
                                 string expiresAt) returns string|error {
    json payload = {
        "token": token, "candidate_email": candidateEmail, "candidate_name": candidateName,
        "recruiter_id": recruiterId, "organization_id": organizationId, "job_id": jobId,
        "job_title": jobTitle, "interview_date": interviewDate,
        "expires_at": expiresAt, "status": "pending"
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/interview_invitations", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("createInvitation failed: " + err.toString());
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("createInvitation: no rows returned"); }
    return (<map<json>>rows[0])["id"].toString();
}

public function getInvitationByToken(string token) returns types:InvitationRecord|error {
    string path = string `/rest/v1/interview_invitations?token=eq.${token}`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getInvitationByToken failed"); }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("Invitation not found for token"); }
    map<json> d = <map<json>>rows[0];
    return {
        id:               d["id"].toString(),
        candidate_email:  d["candidate_email"].toString(),
        candidate_name:   d["candidate_name"] is () ? () : d["candidate_name"].toString(),
        job_title:        d["job_title"] is () ? () : d["job_title"].toString(),
        organization_id:  d["organization_id"].toString(),
        job_id:           d["job_id"] is () ? "" : d["job_id"].toString(),
        expires_at:       d["expires_at"].toString(),
        used_at:          d["used_at"] is () ? () : d["used_at"].toString(),
        status:           d["status"].toString()
    };
}

public function expireInvitation(string id) returns error? {
    json payload = {"status": "expired"};
    string path  = string `/rest/v1/interview_invitations?id=eq.${id}`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("expireInvitation failed for id " + id); }
}

public function acceptInvitation(string id, string usedAt) returns error? {
    json payload = {"used_at": usedAt, "status": "accepted"};
    string path  = string `/rest/v1/interview_invitations?id=eq.${id}`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("acceptInvitation failed for id " + id); }
}

public function getInvitationsByRecruiter(string recruiterId) returns json[]|error {
    string path = string `/rest/v1/interview_invitations?recruiter_id=eq.${recruiterId}&select=id,candidate_email,candidate_name,job_title,status,created_at&order=created_at.desc`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getInvitationsByRecruiter failed"); }
    return <json[]>check response.getJsonPayload();
}
