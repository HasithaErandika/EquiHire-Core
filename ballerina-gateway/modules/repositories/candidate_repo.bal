// ===========================================================================
// modules/repositories/candidate_repo.bal — Supabase queries for candidates,
// organizations, PII maps, context tags, and secure identities.
// ===========================================================================
import ballerina/http;
import ballerina/log;

import equihire/gateway.clients;
import equihire/gateway.constants;
import equihire/gateway.types;

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

public function createOrganization(string name, string industry, string size) returns string|error {
    json payload = {"name": name, "industry": industry, "size": size};
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/organizations", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("createOrganization failed: " + err.toString());
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 {
        return error("createOrganization: no rows returned");
    }
    return (<map<json>>rows[0])["id"].toString();
}

public function createRecruiter(string userId, string email, string organizationId) returns error? {
    json payload = {"user_id": userId, "email": email, "organization_id": organizationId, "role": "admin"};
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/recruiters", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("createRecruiter failed: " + err.toString());
    }
}

public function getOrganizationByUser(string userId) returns types:OrganizationResponse|error {
    string pathSub = string `/rest/v1/recruiters?select=organization_id&user_id=eq.${userId}`;
    http:Response rSub = check clients:supabaseHttpClient->get(
        pathSub, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if rSub.statusCode >= 300 {
        return error("getOrganizationByUser: recruiter lookup failed");
    }
    json[] subRows = <json[]>check rSub.getJsonPayload();
    if subRows.length() == 0 {
        return error("Organization not found for user " + userId);
    }
    string orgId = (<map<json>>subRows[0])["organization_id"].toString();

    string pathOrg = string `/rest/v1/organizations?id=eq.${orgId}`;
    http:Response rOrg = check clients:supabaseHttpClient->get(
        pathOrg, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if rOrg.statusCode >= 300 {
        return error("getOrganizationByUser: org lookup failed");
    }
    json[] orgRows = <json[]>check rOrg.getJsonPayload();
    if orgRows.length() == 0 {
        return error("Organization record missing for id " + orgId);
    }
    map<json> o = <map<json>>orgRows[0];
    return {id: o["id"].toString(), name: o["name"].toString(), industry: o["industry"].toString(), size: o["size"].toString()};
}

public function checkUserInOrganization(string userId, string organizationId) returns boolean|error {
    string path = string `/rest/v1/recruiters?user_id=eq.${userId}&organization_id=eq.${organizationId}&select=user_id`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("checkUserInOrganization failed");
    }
    json[] rows = <json[]>check response.getJsonPayload();
    return rows.length() > 0;
}

public function updateOrganization(string organizationId, string industry, string size) returns error? {
    json payload = {"industry": industry, "size": size};
    string path = string `/rest/v1/organizations?id=eq.${organizationId}`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("updateOrganization failed: " + err.toString());
    }
}

public function getRecruiterId(string userId) returns string|error {
    string path = string `/rest/v1/recruiters?select=id&user_id=eq.${userId}`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("getRecruiterId failed for userId " + userId);
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 {
        return error("Recruiter not found for userId " + userId);
    }
    return (<map<json>>rows[0])["id"].toString();
}

// ---------------------------------------------------------------------------
// CV Parsing Storage
// ---------------------------------------------------------------------------

public function insertCvParsedSections(string candidateId, string jobId, string rawText,
        json education, json workExperience, json projects,
        json achievements, json certificates,
        json technicalSkills) returns error? {
    json payload = {
        "candidate_id": candidateId,
        "job_id": jobId,
        "raw_text": rawText,
        "education": education,
        "work_experience": workExperience,
        "projects": projects,
        "achievements": achievements,
        "certificates": certificates,
        "technical_skills": technicalSkills,
        "parser_version": "v2.0"
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/cv_parsed_sections", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("insertCvParsedSections failed for candidate " + candidateId + ": " + err.toString());
    }
    log:printInfo("CV sections saved", candidateId = candidateId, jobId = jobId);
}

public function createSecureIdentity(string candidateId, string r2ObjectKey, string jobId) returns error? {
    json anonPayload = {"candidate_id": candidateId, "skills": {}, "job_id": jobId};
    http:Response anonResp = check clients:supabaseHttpClient->post(
        "/rest/v1/anonymous_profiles", anonPayload, headers = clients:getSupabaseServiceHeaders());
    if anonResp.statusCode >= 300 {
        json err = check anonResp.getJsonPayload();
        return error("createSecureIdentity: anonymous_profiles insert failed: " + err.toString());
    }
    json idPayload = {"candidate_id": candidateId, "r2_object_key": r2ObjectKey};
    http:Response idResp = check clients:supabaseHttpClient->post(
        "/rest/v1/secure_identities", idPayload, headers = clients:getSupabaseServiceHeaders());
    if idResp.statusCode >= 300 {
        json err = check idResp.getJsonPayload();
        return error("createSecureIdentity: secure_identities insert failed: " + err.toString());
    }
}

// insertSecureIdentity removed — was a dead duplicate of createSecureIdentity.

public function getR2ObjectKey(string candidateId) returns string|error {
    string path = string `/rest/v1/secure_identities?candidate_id=eq.${candidateId}&select=r2_object_key`;
    http:Response resp = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if resp.statusCode >= 300 {
        return error("getR2ObjectKey: lookup failed for " + candidateId);
    }
    json[] rows = <json[]>check resp.getJsonPayload();
    if rows.length() == 0 {
        return error("getR2ObjectKey: no secure identity entry for " + candidateId);
    }
    json key = (<map<json>>rows[0])["r2_object_key"];
    if key is () {
        return error("getR2ObjectKey: r2_object_key is null for " + candidateId);
    }
    return key.toString();
}

// ---------------------------------------------------------------------------
// Candidate Decision Support & Evaluation
// ---------------------------------------------------------------------------

public function getJobIdForCandidate(string candidateId) returns string|error {
    string path = string `/rest/v1/anonymous_profiles?candidate_id=eq.${candidateId}&select=job_id`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("getJobIdForCandidate failed");
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 {
        return error("Candidate not found: " + candidateId);
    }
    return (<map<json>>rows[0])["job_id"].toString();
}

public function getOrganizationIdForCandidate(string candidateId) returns string|error {
    string jobId = check getJobIdForCandidate(candidateId);
    string path = string `/rest/v1/jobs?id=eq.${jobId}&select=organization_id`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("getOrganizationIdForCandidate: job lookup failed");
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 {
        return error("Job not found for candidate: " + candidateId);
    }
    return (<map<json>>rows[0])["organization_id"].toString();
}

public function getCandidateDisplayName(string candidateId) returns string|error {
    string path = string `/rest/v1/anonymous_profiles?candidate_id=eq.${candidateId}&select=status,invitation_id`;
    http:Response resp = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if resp.statusCode >= 300 { return error("getCandidateDisplayName: profile not found"); }
    json[] profiles = <json[]>check resp.getJsonPayload();
    if profiles.length() == 0 { return error("Candidate not found: " + candidateId); }
    
    map<json> p = <map<json>>profiles[0];
    string status = p["status"].toString();
    string invId = p["invitation_id"] is () ? "" : p["invitation_id"].toString();
    
    if status == constants:STATUS_ACCEPTED && invId != "" {
        string invPath = string `/rest/v1/interview_invitations?id=eq.${invId}&select=candidate_name`;
        http:Response iResp = check clients:supabaseHttpClient->get(
            invPath, headers = clients:getSupabaseHeaders(), targetType = http:Response);
        if iResp.statusCode < 300 {
            json[] invs = <json[]>check iResp.getJsonPayload();
            if invs.length() > 0 {
                return (<map<json>>invs[0])["candidate_name"].toString();
            }
        }
    }
    
    return string `Candidate #${candidateId.substring(0, 8)}`;
}

public function getCandidateName(string candidateId) returns record {|string candidateName; string candidateEmail; string jobTitle;|}|error {
    string path = string `/rest/v1/anonymous_profiles?candidate_id=eq.${candidateId}&select=invitation_id,job_id`;
    http:Response resp = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if resp.statusCode >= 300 { return error("getCandidateName: profile not found for " + candidateId); }
    json[] profiles = <json[]>check resp.getJsonPayload();
    if profiles.length() == 0 { return error("Candidate not found: " + candidateId); }
    map<json> profile = <map<json>>profiles[0];
    string invId = profile["invitation_id"] is () ? "" : profile["invitation_id"].toString();
    string jobId = profile["job_id"] is () ? "" : profile["job_id"].toString();

    string candidateEmail = "";
    string nameFallback = string `Candidate #${candidateId.substring(0, 8)}`;
    string candidateNameVal = nameFallback;
    string jobTitleVal = "the applied role";

    if invId != "" {
        string invPath = string `/rest/v1/interview_invitations?id=eq.${invId}&select=candidate_name,candidate_email`;
        http:Response iResp = check clients:supabaseHttpClient->get(
            invPath, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
        if iResp.statusCode < 300 {
            json[] invs = <json[]>check iResp.getJsonPayload();
            if invs.length() > 0 {
                map<json> inv = <map<json>>invs[0];
                candidateNameVal = inv["candidate_name"] is () ? nameFallback : inv["candidate_name"].toString();
                candidateEmail = inv["candidate_email"] is () ? "" : inv["candidate_email"].toString();
            }
        }
    }
    if jobId != "" {
        string jobPath = string `/rest/v1/jobs?id=eq.${jobId}&select=title`;
        http:Response jResp = check clients:supabaseHttpClient->get(
            jobPath, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
        if jResp.statusCode < 300 {
            json[] jobs = <json[]>check jResp.getJsonPayload();
            if jobs.length() > 0 {
                json t = (<map<json>>jobs[0])["title"];
                jobTitleVal = t is () ? jobTitleVal : t.toString();
            }
        }
    }
    return {candidateName: candidateNameVal, candidateEmail: candidateEmail, jobTitle: jobTitleVal};
}

public function getCvRawText(string candidateId) returns string|error {
    string path = string `/rest/v1/cv_parsed_sections?candidate_id=eq.${candidateId}&select=raw_text`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("getCvRawText failed");
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 {
        return error("CV not found for candidate: " + candidateId);
    }
    json rawText = (<map<json>>rows[0])["raw_text"];
    return rawText is () ? "" : rawText.toString();
}

public function getCandidateTranscriptMetadata(string candidateId) returns record {|string name; string email; string role; string appliedDate; string jobId;|}|error {
    string profPath = string `/rest/v1/anonymous_profiles?candidate_id=eq.${candidateId}&select=invitation_id,created_at,job_id`;
    http:Response profResp = check clients:supabaseHttpClient->get(
        profPath, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if profResp.statusCode >= 300 {
        return error("getCandidateTranscriptMetadata: profile lookup failed for " + candidateId);
    }
    json[] profs = <json[]>check profResp.getJsonPayload();
    if profs.length() == 0 {
        return error("getCandidateTranscriptMetadata: no profile for " + candidateId);
    }
    map<json> prof = <map<json>>profs[0];
    json createdAtJson = prof["created_at"];
    string appliedDate = createdAtJson is () ? "" : createdAtJson.toString();
    json invIdJson = prof["invitation_id"];
    
    if invIdJson is () {
        return {name: string `Candidate #${candidateId.substring(0, 8)}`, email: "Not Available", role: "Unknown Role", appliedDate: appliedDate, jobId: ""};
    }
    string invId = invIdJson.toString();

    string invPath = string `/rest/v1/interview_invitations?id=eq.${invId}&select=candidate_name,candidate_email,job_title`;
    http:Response invResp = check clients:supabaseHttpClient->get(
        invPath, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if invResp.statusCode >= 300 {
        return error("getCandidateTranscriptMetadata: invitation lookup failed for " + invId);
    }
    json[] invs = <json[]>check invResp.getJsonPayload();
    if invs.length() == 0 {
        return {name: string `Candidate #${candidateId.substring(0, 8)}`, email: "Not Available", role: "Unknown Role", appliedDate: appliedDate, jobId: ""};
    }
    map<json> inv = <map<json>>invs[0];
    return {
        name: inv["candidate_name"].toString(), 
        email: inv["candidate_email"].toString(), 
        role: inv["job_title"].toString(),
        appliedDate: appliedDate,
        jobId: prof["job_id"].toString()
    };
}

public function getCandidateEvaluation(string candidateId) returns record {|decimal overallScore; decimal cvScore; decimal skillsScore; decimal interviewScore; string summaryFeedback;|}|error {
    string path = string `/rest/v1/evaluation_results?candidate_id=eq.${candidateId}&select=overall_score,cv_score,skills_score,interview_score,summary_feedback`;
    http:Response resp = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if resp.statusCode >= 300 {
        return error("getCandidateEvaluation failed for " + candidateId);
    }
    json[] evals = <json[]>check resp.getJsonPayload();
    if evals.length() == 0 {
        // Log the failure to find
        return error("No evaluation results found for candidate " + candidateId);
    }
    map<json> e = <map<json>>evals[0];

    decimal overall = 0d;
    decimal cv = 0d;
    decimal skills = 0d;
    decimal interview = 0d;

    overall = e["overall_score"] is () ? 0d : <decimal>e["overall_score"];
    cv = e["cv_score"] is () ? 0d : <decimal>e["cv_score"];
    skills = e["skills_score"] is () ? 0d : <decimal>e["skills_score"];
    interview = e["interview_score"] is () ? 0d : <decimal>e["interview_score"];

    string feedback = e["summary_feedback"] is () ? "" : e["summary_feedback"].toString();
    return {overallScore: overall, cvScore: cv, skillsScore: skills, interviewScore: interview, summaryFeedback: feedback};
}

public function getRawEvaluation(string candidateId) returns json|error {
    string path = string `/rest/v1/evaluation_results?candidate_id=eq.${candidateId}&select=*`;
    http:Response resp = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    return resp.getJsonPayload();
}

public function updateCandidateStatus(string candidateId, string newStatus) returns error? {
    json payload = {"status": newStatus};
    string path = string `/rest/v1/anonymous_profiles?candidate_id=eq.${candidateId}`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("updateCandidateStatus failed for candidate " + candidateId + " → " + newStatus);
    }
}

// ---------------------------------------------------------------------------
// PII & Context Tags
// ---------------------------------------------------------------------------

public function getPiiRedactionMap(string candidateId) returns map<json>|error {
    string path = string `/rest/v1/pii_entity_maps?candidate_id=eq.${candidateId}&select=redaction_map`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("getPiiRedactionMap failed for " + candidateId);
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 {
        return {};
    }
    var mapVal = (<map<json>>rows[0])["redaction_map"];
    return mapVal is map<json> ? mapVal : {};
}

public function insertPiiEntityMap(string candidateId, json entities, json redactionMap) returns error? {
    json payload = {"candidate_id": candidateId, "entities": entities, "redaction_map": redactionMap};
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/pii_entity_maps", payload, headers = clients:getSupabaseUpsertHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("insertPiiEntityMap failed for " + candidateId + ": " + err.toString());
    }
}

public function getContextTags(string candidateId) returns types:ContextTags|error {
    string path = string `/rest/v1/candidate_context_tags?candidate_id=eq.${candidateId}&select=experience_level,detected_stack`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        return error("getContextTags failed for " + candidateId);
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 {
        return {experienceLevel: constants:LEVEL_UNKNOWN, detectedStack: []};
    }
    map<json> row = <map<json>>rows[0];
    return {experienceLevel: row["experience_level"].toString(), detectedStack: row["detected_stack"]};
}

public function insertContextTags(string candidateId, string jobId, string expLevel,
        json detectedStack, float? estimatedYears) returns error? {
    json payload = {
        "candidate_id": candidateId,
        "job_id": jobId,
        "experience_level": expLevel,
        "detected_stack": detectedStack,
        "estimated_years": estimatedYears is () ? <json>() : estimatedYears
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/candidate_context_tags", payload, headers = clients:getSupabaseUpsertHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("insertContextTags failed for " + candidateId + ": " + err.toString());
    }
}

// ---------------------------------------------------------------------------
// Candidate Dashboard — getCandidates
// ---------------------------------------------------------------------------

public function getCandidates(string organizationId) returns types:CandidateResponse[]|error {
    [json[], map<string>] [jobsList, jobTitleMap] = check fetchOrgJobs(organizationId);
    if jobsList.length() == 0 {
        return [];
    }

    string jobIdsFilter = buildJobIdsFilter(jobsList);
    json[] profiles = check fetchCandidateProfiles(jobIdsFilter);
    map<map<json>> evalMap = check fetchEvalMap(jobIdsFilter);
    map<string> invMap = check fetchInvitationNameMap(organizationId);
    map<map<json>> ctxMap = check fetchContextMap(jobIdsFilter);
    map<map<json>> cvMap = check fetchCvParsedMap(jobIdsFilter);
    map<record {|int count; string[] types;|}> cheatMap = check fetchCheatMap(jobIdsFilter);

    return assembleCandidateList(profiles, jobTitleMap, evalMap, invMap, ctxMap, cvMap, cheatMap);
}

function fetchOrgJobs(string organizationId) returns [json[], map<string>]|error {
    string path = string `/rest/v1/jobs?organization_id=eq.${organizationId}&select=id,title`;
    http:Response r = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if r.statusCode >= 300 {
        return error("getCandidates: job fetch failed");
    }
    json[] jobs = <json[]>check r.getJsonPayload();
    map<string> titleMap = {};
    foreach json j in jobs {
        map<json> jm = <map<json>>j;
        titleMap[jm["id"].toString()] = jm["title"].toString();
    }
    return [jobs, titleMap];
}

function buildJobIdsFilter(json[] jobs) returns string {
    string filter = "in.(";
    foreach int i in 0 ..< jobs.length() {
        filter += (<map<json>>jobs[i])["id"].toString();
        if i < jobs.length() - 1 {
            filter += ",";
        }
    }
    filter += ")";
    return filter;
}

function fetchCandidateProfiles(string jobIdsFilter) returns json[]|error {
    string path = string `/rest/v1/anonymous_profiles?job_id=${jobIdsFilter}&select=candidate_id,job_id,status,created_at,invitation_id`;
    http:Response r = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if r.statusCode >= 300 {
        return error("getCandidates: profile fetch failed");
    }
    return <json[]>check r.getJsonPayload();
}

function fetchEvalMap(string jobIdsFilter) returns map<map<json>>|error {
    string path = string `/rest/v1/evaluation_results?job_id=${jobIdsFilter}&select=candidate_id,overall_score,cv_score,skills_score,interview_score,summary_feedback`;
    http:Response r = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    map<map<json>> evalMap = {};
    if r.statusCode < 300 {
        json[] evals = <json[]>check r.getJsonPayload();
        foreach json e in evals {
            map<json> em = <map<json>>e;
            evalMap[em["candidate_id"].toString()] = em;
        }
    }
    return evalMap;
}

function fetchInvitationNameMap(string organizationId) returns map<string>|error {
    string path = string `/rest/v1/interview_invitations?organization_id=eq.${organizationId}&select=id,candidate_name`;
    http:Response r = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    map<string> invMap = {};
    if r.statusCode < 300 {
        json[] invs = <json[]>check r.getJsonPayload();
        foreach json iv in invs {
            map<json> m = <map<json>>iv;
            invMap[m["id"].toString()] = m["candidate_name"] is () ? "Unknown" : m["candidate_name"].toString();
        }
    }
    return invMap;
}

function fetchContextMap(string jobIdsFilter) returns map<map<json>>|error {
    string path = string `/rest/v1/candidate_context_tags?job_id=${jobIdsFilter}&select=candidate_id,experience_level,detected_stack,hf_relevance_skipped`;
    http:Response r = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    map<map<json>> ctxMap = {};
    if r.statusCode < 300 {
        json[] ctxs = <json[]>check r.getJsonPayload();
        foreach json c in ctxs {
            map<json> cm = <map<json>>c;
            ctxMap[cm["candidate_id"].toString()] = cm;
        }
    }
    return ctxMap;
}

function fetchCvParsedMap(string jobIdsFilter) returns map<map<json>>|error {
    string path = string `/rest/v1/cv_parsed_sections?job_id=${jobIdsFilter}&select=candidate_id,raw_text,education,work_experience,projects`;
    http:Response r = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    map<map<json>> cvMap = {};
    if r.statusCode < 300 {
        json[] cvs = <json[]>check r.getJsonPayload();
        foreach json c in cvs {
            map<json> cm = <map<json>>c;
            cvMap[cm["candidate_id"].toString()] = cm;
        }
    }
    return cvMap;
}

function fetchCheatMap(string jobIdsFilter) returns map<record {|int count; string[] types;|}>|error {
    // Scope cheat events to candidates belonging to this org's jobs via exam_sessions.
    string sessionPath = string `/rest/v1/exam_sessions?job_id=${jobIdsFilter}&select=candidate_id`;
    http:Response sResp = check clients:supabaseHttpClient->get(
        sessionPath, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    map<record {|int count; string[] types;|}> cheatMap = {};
    if sResp.statusCode >= 300 {
        return cheatMap;
    }
    json[] sessions = <json[]>check sResp.getJsonPayload();
    if sessions.length() == 0 {
        return cheatMap;
    }

    // Build a comma-separated list of candidate IDs scoped to this org
    string candidateIdFilter = "in.(";
    foreach int i in 0 ..< sessions.length() {
        candidateIdFilter += (<map<json>>sessions[i])["candidate_id"].toString();
        if i < sessions.length() - 1 {
            candidateIdFilter += ",";
        }
    }
    candidateIdFilter += ")";

    string cheatPath = string `/rest/v1/cheat_events?candidate_id=${candidateIdFilter}&select=candidate_id,event_type`;
    http:Response r = check clients:supabaseHttpClient->get(
        cheatPath, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if r.statusCode < 300 {
        json[] events = <json[]>check r.getJsonPayload();
        foreach json e in events {
            string cId = (<map<json>>e)["candidate_id"].toString();
            string eventType = (<map<json>>e)["event_type"].toString();
            record {|int count; string[] types;|} entry = cheatMap.hasKey(cId) ? cheatMap.get(cId) : {count: 0, types: []};
            entry.count += 1;
            boolean hasType = false;
            foreach string t in entry.types {
                if t == eventType {
                    hasType = true;
                    break;
                }
            }
            if !hasType {
                entry.types.push(eventType);
            }
            cheatMap[cId] = entry;
        }
    }
    return cheatMap;
}

function assembleCandidateList(json[] profiles, map<string> jobTitleMap,
        map<map<json>> evalMap, map<string> invMap,
        map<map<json>> ctxMap, map<map<json>> cvMap,
        map<record {|int count; string[] types;|}> cheatMap) returns types:CandidateResponse[] {
    types:CandidateResponse[] results = [];
    foreach json p in profiles {
        map<json> pm = <map<json>>p;
        string cId = pm["candidate_id"].toString();
        string jId = pm["job_id"].toString();
        string status = pm["status"] is () ? constants:STATUS_PENDING : pm["status"].toString();
        string invId = pm["invitation_id"] is () ? "" : pm["invitation_id"].toString();
        map<json>? eData = evalMap[cId];
        map<json>? ctx = ctxMap[cId];

        decimal score = 0d;
        decimal cvS = 0d;
        decimal skS = 0d;
        decimal intS = 0d;
        string? fb = ();
        if eData is map<json> {
            score = eData["overall_score"] is () ? 0d : <decimal>eData["overall_score"];
            cvS = eData["cv_score"] is () ? 0d : <decimal>eData["cv_score"];
            skS = eData["skills_score"] is () ? 0d : <decimal>eData["skills_score"];
            intS = eData["interview_score"] is () ? 0d : <decimal>eData["interview_score"];
            fb = eData["summary_feedback"] is () ? () : eData["summary_feedback"].toString();
        }

        string? expLevel = ();
        string[] stack = [];
        int hfSkipped = 0;
        if ctx is map<json> {
            expLevel = ctx["experience_level"] is () ? () : ctx["experience_level"].toString();
            if ctx["detected_stack"] is json[] {
                foreach json t in <json[]>ctx["detected_stack"] {
                    stack.push(t.toString());
                }
            }
            if ctx["hf_relevance_skipped"] is int {
                hfSkipped = <int>ctx["hf_relevance_skipped"];
            }
        }

        map<json>? cv = cvMap[cId];

        string? rawText = ();
        json? edu = ();
        json? work = ();
        json? proj = ();

        if cv is map<json> {
            rawText = cv["raw_text"] is () ? () : cv["raw_text"].toString();
            edu = cv["education"];
            work = cv["work_experience"];
            proj = cv["projects"];
        }

        string rawName = invId != "" && invMap.hasKey(invId) ? invMap.get(invId) : "Unknown Candidate";
        string dispName = status == constants:STATUS_ACCEPTED ? rawName : string `Candidate #${cId.substring(0, 8)}`;

        results.push({
            candidateId: cId,
            jobTitle: jobTitleMap.hasKey(jId) ? jobTitleMap.get(jId) : "Unknown Role",
            candidateName: dispName,
            status: status,
            score: score,
            appliedDate: pm["created_at"].toString(),
            cvScore: cvS,
            skillsScore: skS,
            interviewScore: intS,
            summaryFeedback: fb,
            experienceLevel: expLevel,
            detectedStack: stack,
            hfRelevanceSkipped: hfSkipped,
            cheatEventCount: cheatMap.hasKey(cId) ? cheatMap.get(cId).count : 0,
            cheatEventTypes: cheatMap.hasKey(cId) ? cheatMap.get(cId).types : [],
            cvText: rawText,
            education: edu,
            workExperience: work,
            projects: proj
        });
    }
    return results;
}
