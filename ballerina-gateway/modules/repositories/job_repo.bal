// ===========================================================================
// modules/repositories/job_repo.bal — Supabase queries for jobs, questions,
// evaluation templates, and candidate answers.
// ===========================================================================
import ballerina/http;
import equihire/gateway.clients;
import equihire/gateway.types;

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

public function createJob(string title, string description, string[] requiredSkills,
                          string organizationId, string recruiterId,
                          string? evaluationTemplateId) returns string|error {
    json payload = {
        "title": title, "description": description,
        "required_skills": requiredSkills,
        "organization_id": organizationId, "recruiter_id": recruiterId
    };
    if evaluationTemplateId is string && evaluationTemplateId != "" {
        map<json> m = <map<json>>payload;
        m["evaluation_template_id"] = evaluationTemplateId;
        payload = m;
    }
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/jobs", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("createJob failed: " + err.toString());
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("createJob: no rows returned"); }
    return (<map<json>>rows[0])["id"].toString();
}

public function getJobsByRecruiter(string recruiterId) returns json[]|error {
    string path = string `/rest/v1/jobs?recruiter_id=eq.${recruiterId}&select=id,title,description,required_skills,organization_id,evaluation_template_id,created_at`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getJobsByRecruiter failed"); }
    json[] rows = <json[]>check response.getJsonPayload();
    json[] result = [];
    foreach json row in rows {
        map<json> r = <map<json>>row;
        string[] requiredSkills = [];
        if r["required_skills"] is json[] {
            foreach json s in <json[]>r["required_skills"] {
                requiredSkills.push(s.toString());
            }
        }
        result.push({
            "id": r["id"].toString(),
            "title": r["title"].toString(),
            "description": r["description"] is () ? "" : r["description"].toString(),
            "requiredSkills": requiredSkills,
            "organizationId": r["organization_id"].toString(),
            "evaluationTemplateId": r["evaluation_template_id"] is () ? () : r["evaluation_template_id"].toString(),
            "createdAt": r["created_at"].toString()
        });
    }
    return result;
}

public function updateJob(string jobId, string title, string description,
                          string[] requiredSkills, string? evaluationTemplateId = ()) returns error? {
    json payload = {"title": title, "description": description, "required_skills": requiredSkills};
    if evaluationTemplateId is string && evaluationTemplateId != "" {
        map<json> m = <map<json>>payload;
        m["evaluation_template_id"] = evaluationTemplateId;
        payload = m;
    }
    string path  = string `/rest/v1/jobs?id=eq.${jobId}`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("updateJob failed: " + err.toString());
    }
}

public function deleteJob(string jobId) returns error? {
    string path = string `/rest/v1/jobs?id=eq.${jobId}`;
    http:Response response = check clients:supabaseHttpClient->delete(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("deleteJob failed: " + response.statusCode.toString()); }
}

public function getOrgIdByJob(string jobId) returns string|error {
    string path = string `/rest/v1/jobs?select=organization_id&id=eq.${jobId}`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getOrgIdByJob failed"); }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("Job not found: " + jobId); }
    return (<map<json>>rows[0])["organization_id"].toString();
}

public function getEvaluationTemplateIdForJob(string jobId) returns string?|error {
    string path = string `/rest/v1/jobs?select=evaluation_template_id&id=eq.${jobId}`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getEvaluationTemplateIdForJob failed"); }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("Job not found: " + jobId); }
    json evalId = (<map<json>>rows[0])["evaluation_template_id"];
    return evalId is () ? () : evalId.toString();
}

public function getJobRequiredSkills(string jobId) returns string[]|error {
    string path = string `/rest/v1/jobs?select=required_skills&id=eq.${jobId}`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getJobRequiredSkills failed"); }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("Job not found: " + jobId); }
    json skills = (<map<json>>rows[0])["required_skills"];
    string[] result = [];
    if skills is json[] {
        foreach json s in skills {
            result.push(s.toString());
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

public function createJobQuestion(string jobId, string questionText, string sampleAnswer,
                                  string[] keywords, string questionType) returns error? {
    json payload = {
        "job_id": jobId, "question_text": questionText,
        "sample_answer": sampleAnswer, "keywords": keywords, "type": questionType
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/questions", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json|error err = response.getJsonPayload();
        return error("createJobQuestion failed: " + (err is json ? err.toString() : "unknown"));
    }
}

public function getJobQuestions(string jobId) returns types:QuestionItem[]|error {
    string path = string `/rest/v1/questions?job_id=eq.${jobId}&select=id,job_id,question_text,sample_answer,keywords,type&order=created_at.asc`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getJobQuestions failed"); }

    json[] results = <json[]>check response.getJsonPayload();
    types:QuestionItem[] questions = [];
    foreach json result in results {
        map<json> q = <map<json>>result;
        string[] keywords = [];
        if q["keywords"] is json[] {
            foreach json k in <json[]>q["keywords"] {
                keywords.push(k.toString());
            }
        }
        questions.push({
            id: q["id"].toString(), jobId: q["job_id"].toString(),
            questionText: q["question_text"].toString(),
            sampleAnswer: q["sample_answer"] is () ? "" : q["sample_answer"].toString(),
            keywords: keywords, 'type: q["type"].toString()
        });
    }
    return questions;
}

public function updateQuestion(string questionId, string questionText, string sampleAnswer,
                               string[] keywords, string questionType) returns error? {
    json payload = {
        "question_text": questionText, "sample_answer": sampleAnswer,
        "keywords": keywords, "type": questionType
    };
    string path = string `/rest/v1/questions?id=eq.${questionId}`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("updateQuestion failed"); }
}

public function deleteQuestion(string questionId) returns error? {
    string path = string `/rest/v1/questions?id=eq.${questionId}`;
    http:Response response = check clients:supabaseHttpClient->delete(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("deleteQuestion failed"); }
}

// ---------------------------------------------------------------------------
// Evaluation Templates
// ---------------------------------------------------------------------------

public function getEvaluationTemplates(string organizationId) returns json[]|error {
    string path = string `/rest/v1/evaluation_templates?or=(is_system_template.eq.true,organization_id.eq.${organizationId})&select=*&order=created_at.desc`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getEvaluationTemplates failed"); }
    return <json[]>check response.getJsonPayload();
}

public function getEvaluationTemplatePrompt(string templateId) returns string|error {
    string path = string `/rest/v1/evaluation_templates?id=eq.${templateId}&select=prompt_template`;
    http:Response response = check clients:supabaseHttpClient->get(
        path, headers = clients:getSupabaseHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("getEvaluationTemplatePrompt failed"); }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("Template not found: " + templateId); }
    json prompt = (<map<json>>rows[0])["prompt_template"];
    return prompt is () ? "" : prompt.toString();
}

public function createEvaluationTemplate(string name, string description, string 'type,
                                         string promptTemplate, string organizationId) returns json|error {
    json payload = {
        "name": name, "description": description, "type": 'type,
        "prompt_template": promptTemplate, "organization_id": organizationId,
        "is_system_template": false
    };
    http:Response response = check clients:supabaseHttpClient->post(
        "/rest/v1/evaluation_templates", payload, headers = clients:getSupabaseServiceHeaders());
    if response.statusCode >= 300 {
        json err = check response.getJsonPayload();
        return error("createEvaluationTemplate failed: " + err.toString());
    }
    json[] rows = <json[]>check response.getJsonPayload();
    if rows.length() == 0 { return error("createEvaluationTemplate: no rows returned"); }
    return rows[0];
}

public function updateEvaluationTemplate(string id, string name, string description,
                                         string 'type, string promptTemplate,
                                         string organizationId) returns error? {
    json payload = {"name": name, "description": description, "type": 'type, "prompt_template": promptTemplate};
    string path  = string `/rest/v1/evaluation_templates?id=eq.${id}&organization_id=eq.${organizationId}&is_system_template=eq.false`;
    http:Response response = check clients:supabaseHttpClient->patch(
        path, payload, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("updateEvaluationTemplate failed"); }
}

public function deleteEvaluationTemplate(string id, string organizationId) returns error? {
    string path = string `/rest/v1/evaluation_templates?id=eq.${id}&organization_id=eq.${organizationId}&is_system_template=eq.false`;
    http:Response response = check clients:supabaseHttpClient->delete(
        path, headers = clients:getSupabaseServiceHeaders(), targetType = http:Response);
    if response.statusCode >= 300 { return error("deleteEvaluationTemplate failed"); }
}

// saveCandidateAnswer removed — was dead code targeting the legacy `candidate_answers` table.
// Candidate answers are stored via insertRawAnswer() into raw_answer_vault.

