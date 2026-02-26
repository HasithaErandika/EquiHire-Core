import ballerina/http;

import equihire/gateway.types;

public type InvitationRecord record {
    string id;
    string candidate_email;
    string? candidate_name;
    string? job_title;
    string organization_id;
    string job_id;
    string expires_at;
    string? used_at;
    string status;
};

# Client to interact with Supabase Database via REST API.
public client class Repository {
    final http:Client httpClient;
    final string apiKey;
    final map<string|string[]> headers;

    # Initializes the repository client.
    #
    # + config - Supabase configuration
    # + return - Error if initialization fails
    public function init(types:SupabaseConfig config) returns error? {
        self.httpClient = check new (config.url);
        self.apiKey = config.key;
        self.headers = {
            "apikey": config.key,
            "Authorization": "Bearer " + config.key,
            "Prefer": "return=representation"
        };
    }

    # Creates a new organization.
    #
    # + name - Organization name
    # + industry - Industry
    # + size - Organization size
    # + return - The ID of the created organization or an error
    remote function createOrganization(string name, string industry, string size) returns string|error {
        json payload = {
            "name": name,
            "industry": industry,
            "size": size
        };

        http:Response response = check self.httpClient->post("/rest/v1/organizations", payload, headers = self.headers);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }

        json body = check response.getJsonPayload();
        json[] organizations = <json[]>body;
        if organizations.length() > 0 {
            map<json> org = <map<json>>organizations[0];
            return org["id"].toString();
        }
        return error("Failed to create organization: No data returned");
    }

    # Creates a new recruiter (admin) for an organization.
    #
    # + userId - User ID (UUID)
    # + email - User email
    # + organizationId - Organization ID (UUID)
    # + return - Error if failed, else nil
    remote function createRecruiter(string userId, string email, string organizationId) returns error? {
        json payload = {
            "user_id": userId,
            "email": email,
            "organization_id": organizationId,
            "role": "admin"
        };

        http:Response response = check self.httpClient->post("/rest/v1/recruiters", payload, headers = self.headers);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }
        return;
    }

    # Retrieves organization details for a given user.
    #
    # + userId - The user ID
    # + return - Organization details or Error
    remote function getOrganizationByUser(string userId) returns types:OrganizationResponse|error {
        // Step 1: Get Organization ID from Recruiter table
        string pathSub = string `/rest/v1/recruiters?select=organization_id&user_id=eq.${userId}`;
        http:Response responseSub = check self.httpClient->get(pathSub, headers = self.headers, targetType = http:Response);

        if responseSub.statusCode >= 300 {
            return error("Supabase check failed: " + responseSub.statusCode.toString());
        }

        json bodySub = check responseSub.getJsonPayload();
        json[] resultsSub = <json[]>bodySub;

        if resultsSub.length() == 0 {
            return error("Organization not found for user: " + userId);
        }

        map<json> recruiterData = <map<json>>resultsSub[0];
        string orgId = recruiterData["organization_id"].toString();

        // Step 2: Get Organization Details
        string pathOrg = string `/rest/v1/organizations?id=eq.${orgId}`;
        http:Response responseOrg = check self.httpClient->get(pathOrg, headers = self.headers, targetType = http:Response);

        if responseOrg.statusCode >= 300 {
            return error("Supabase check failed: " + responseOrg.statusCode.toString());
        }

        json bodyOrg = check responseOrg.getJsonPayload();
        json[] resultsOrg = <json[]>bodyOrg;

        if resultsOrg.length() == 0 {
            return error("Organization record missing for ID: " + orgId);
        }

        map<json> orgData = <map<json>>resultsOrg[0];

        return {
            id: orgData["id"].toString(),
            name: orgData["name"].toString(),
            industry: orgData["industry"].toString(),
            size: orgData["size"].toString()
        };
    }

    # Checks if a user belongs to an organization.
    #
    # + userId - User ID
    # + organizationId - Organization ID
    # + return - True if belongs, false otherwise (or error)
    remote function checkUserInOrganization(string userId, string organizationId) returns boolean|error {
        string path = string `/rest/v1/recruiters?user_id=eq.${userId}&organization_id=eq.${organizationId}&select=user_id`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase check failed: " + response.statusCode.toString());
        }

        json body = check response.getJsonPayload();
        json[] results = <json[]>body;
        return results.length() > 0;
    }

    # Updates an organization's details.
    #
    # + organizationId - Organization ID
    # + industry - New industry
    # + size - New size
    # + return - Error if failed
    remote function updateOrganization(string organizationId, string industry, string size) returns error? {
        json payload = {
            "industry": industry,
            "size": size
        };
        string path = string `/rest/v1/organizations?id=eq.${organizationId}`;
        http:Response response = check self.httpClient->patch(path, payload, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }
        return;
    }

    # Gets recruiter ID by User ID.
    #
    # + userId - User ID
    # + return - Recruiter ID or Error
    remote function getRecruiterId(string userId) returns string|error {
        string path = string `/rest/v1/recruiters?select=id&user_id=eq.${userId}`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }

        json body = check response.getJsonPayload();
        json[] results = <json[]>body;

        if results.length() == 0 {
            return error("Recruiter not found");
        }
        map<json> recruiter = <map<json>>results[0];
        return recruiter["id"].toString();
    }

    # Creates an interview invitation.
    #
    # + token - Unique token
    # + candidateEmail - Candidate email
    # + candidateName - Candidate name
    # + jobTitle - Job title
    # + recruiterId - Recruiter ID (UUID)
    # + organizationId - Organization ID (UUID)
    # + jobId - Job ID (UUID)
    # + interviewDate - Interview date (or null)
    # + expiresAt - Expiration timestamp
    # + return - Invitation ID or error
    remote function createInvitation(string token, string candidateEmail, string candidateName, string jobTitle, string recruiterId, string organizationId, string jobId, string? interviewDate, string expiresAt) returns string|error {
        json payload = {
            "token": token,
            "candidate_email": candidateEmail,
            "candidate_name": candidateName,
            "recruiter_id": recruiterId,
            "organization_id": organizationId,
            "job_id": jobId,
            "job_title": jobTitle,
            "interview_date": interviewDate,
            "expires_at": expiresAt,
            "status": "pending"
        };

        http:Response response = check self.httpClient->post("/rest/v1/interview_invitations", payload, headers = self.headers);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }

        json body = check response.getJsonPayload();
        json[] invitations = <json[]>body;
        if invitations.length() > 0 {
            map<json> inv = <map<json>>invitations[0];
            return inv["id"].toString();
        }
        return error("Failed to create invitation");
    }

    # Gets invitation details by token.
    #
    # + token - Invitation token
    # + return - Invitation details or error
    remote function getInvitationByToken(string token) returns InvitationRecord|error {
        string path = string `/rest/v1/interview_invitations?token=eq.${token}`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }

        json body = check response.getJsonPayload();
        json[] results = <json[]>body;

        if results.length() == 0 {
            return error("Invitation not found");
        }

        map<json> data = <map<json>>results[0];
        InvitationRecord inv = {
            id: data["id"].toString(),
            candidate_email: data["candidate_email"].toString(),
            candidate_name: data["candidate_name"] is () ? () : data["candidate_name"].toString(),
            job_title: data["job_title"] is () ? () : data["job_title"].toString(),
            organization_id: data["organization_id"].toString(),
            job_id: data["job_id"] is () ? "" : data["job_id"].toString(),
            expires_at: data["expires_at"].toString(),
            used_at: data["used_at"] is () ? () : data["used_at"].toString(),
            status: data["status"].toString()
        };
        return inv;
    }

    # Marks invitation as expired.
    #
    # + id - Invitation ID
    # + return - Error if failed
    remote function expireInvitation(string id) returns error? {
        json payload = {"status": "expired"};
        string path = string `/rest/v1/interview_invitations?id=eq.${id}`;
        http:Response response = check self.httpClient->patch(path, payload, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }
        return;
    }

    # Marks invitation as accepted/used.
    #
    # + id - Invitation ID
    # + usedAt - Used At timestamp string
    # + return - Error if failed
    remote function acceptInvitation(string id, string usedAt) returns error? {
        json payload = {
            "used_at": usedAt,
            "status": "accepted"
        };
        string path = string `/rest/v1/interview_invitations?id=eq.${id}`;
        http:Response response = check self.httpClient->patch(path, payload, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }
        return;
    }

    # Creates a secure identity record (R2 Key mapping).
    #
    # + candidateId - Candidate UUID
    # + r2ObjectKey - S3 Object Key
    # + jobId - The Job ID associated with this application
    # + return - Error if failed
    remote function createSecureIdentity(string candidateId, string r2ObjectKey, string jobId) returns error? {
        // We first need to create the anonymous profile (since it's the parent key)
        json anonPayload = {
            "candidate_id": candidateId,
            "skills": {}, // Empty initially, pending AI
            "job_id": jobId
        };

        http:Response anonError = check self.httpClient->post("/rest/v1/anonymous_profiles", anonPayload, headers = self.headers);
        if anonError.statusCode >= 300 {
            json errorBody = check anonError.getJsonPayload();
            return error("Failed to create anonymous profile: " + errorBody.toString());
        }

        // Then create the secure identity
        json payload = {
            "candidate_id": candidateId,
            "r2_object_key": r2ObjectKey
        };

        http:Response response = check self.httpClient->post("/rest/v1/secure_identities", payload, headers = self.headers);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }
        return;
    }

    # Creates a new Job.
    #
    # + title - Job title
    # + description - Job description
    # + requiredSkills - Skills
    # + organizationId - Org ID
    # + recruiterId - Recruiter ID
    # + return - Job ID or Error
    remote function createJob(string title, string description, string[] requiredSkills, string organizationId, string recruiterId) returns string|error {
        json payload = {
            "title": title,
            "description": description,
            "required_skills": requiredSkills,
            "organization_id": organizationId,
            "recruiter_id": recruiterId
        };

        http:Response response = check self.httpClient->post("/rest/v1/jobs", payload, headers = self.headers);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }

        json body = check response.getJsonPayload();
        json[] jobs = <json[]>body;
        if jobs.length() > 0 {
            map<json> job = <map<json>>jobs[0];
            return job["id"].toString();
        }
        return error("Job creation failed");
    }

    # Retrieves job requirements (skills).
    #
    # + jobId - Job ID
    # + return - List of required skills or Error
    remote function getJobRequirements(string jobId) returns string[]|error {
        string path = string `/rest/v1/jobs?select=required_skills&id=eq.${jobId}`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }

        json body = check response.getJsonPayload();
        json[] results = <json[]>body;

        if results.length() == 0 {
            return error("Job not found: " + jobId);
        }

        map<json> job = <map<json>>results[0];
        json skillsJson = job["required_skills"];
        return <string[]>skillsJson;
    }

    # Retrieves all jobs for a specific recruiter's organization.
    #
    # + recruiterId - Recruiter ID
    # + return - List of Jobs or Error
    remote function getJobsByRecruiter(string recruiterId) returns json[]|error {
        // First get Org ID
        // Note: For efficiency, one might store OrgID in JWT or session, but here we look it up.
        // Assuming we pass OrgId or lookup. For now, let's filter by recruiter_id or organization_id.

        string path = string `/rest/v1/jobs?recruiter_id=eq.${recruiterId}&select=id,title,description,required_skills,organization_id,created_at`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }

        json body = check response.getJsonPayload();
        return <json[]>body;
    }

    # Retrieves invitation history for a recruiter.
    #
    # + recruiterId - Recruiter ID
    # + return - List of Invitations or Error
    remote function getInvitationsByRecruiter(string recruiterId) returns json[]|error {
        string path = string `/rest/v1/interview_invitations?recruiter_id=eq.${recruiterId}&select=id,candidate_email,candidate_name,job_title,status,created_at&order=created_at.desc`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }

        json body = check response.getJsonPayload();
        return <json[]>body;
    }

    remote function createJobQuestion(string jobId, string questionText, string sampleAnswer, string[] keywords, string questionType) returns error? {
        json payload = {
            "job_id": jobId,
            "question_text": questionText,
            "sample_answer": sampleAnswer,
            "keywords": keywords,
            "type": questionType
        };

        http:Response response = check self.httpClient->post("/rest/v1/questions", payload, headers = self.headers);
        if response.statusCode == 201 || response.statusCode == 200 {
            return ();
        }
        if response.statusCode >= 300 {
            json|error errorBody = response.getJsonPayload();
            string message = errorBody is json ? errorBody.toString() : "Database insertion failed";
            return error("Supabase Error: " + message);
        }
        return ();
    }

    # Retrieves questions for a specific job.
    #
    # + jobId - Job ID
    # + return - List of questions or Error
    remote function getJobQuestions(string jobId) returns types:QuestionItem[]|error {

        string path = string `/rest/v1/questions?job_id=eq.${jobId}&select=*&order=created_at.asc`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }

        json body = check response.getJsonPayload();
        json[] results = <json[]>body;

        types:QuestionItem[] questions = [];
        foreach json result in results {
            map<json> qData = <map<json>>result;

            string[] keywords = [];
            if qData["keywords"] is json[] {
                json[] kArray = <json[]>qData["keywords"];
                foreach json k in kArray {
                    keywords.push(k.toString());
                }
            }

            questions.push({
                id: qData["id"].toString(),
                jobId: qData["job_id"].toString(),
                questionText: qData["question_text"].toString(),
                sampleAnswer: qData["sample_answer"] is () ? "" : qData["sample_answer"].toString(),
                keywords: keywords,
                'type: qData["type"].toString()
            });
        }
        return questions;
    }

    # Deletes a question.
    # + questionId - Question ID
    # + return - Error if failed
    remote function deleteQuestion(string questionId) returns error? {

        string path = string `/rest/v1/questions?id=eq.${questionId}`;

        http:Response response = check self.httpClient->delete(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {

            json|error errorBody = response.getJsonPayload();
            string message = errorBody is json ? errorBody.toString() : "Delete failed";
            return error("Supabase Error: " + message);
        }
        return ();
    }

    # Retrieves audit logs for an organization.
    # + organizationId - The organization ID
    # + return - An array of audit logs or an error
    remote function getAuditLogs(string organizationId) returns json[]|error {
        string path = string `/rest/v1/audit_logs?organization_id=eq.${organizationId}&select=*,recruiters(email,full_name)&order=created_at.desc`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }

        json body = check response.getJsonPayload();
        return <json[]>body;
    }

    # Creates an audit log entry.
    # + organizationId - Organization ID
    # + recruiterId - Recruiter ID (can be null/empty string)
    # + actionType - Type of action
    # + entityType - Type of entity
    # + entityId - ID of entity
    # + details - Additional details
    # + return - Error if failed
    remote function createAuditLog(string organizationId, string? recruiterId, string actionType, string entityType, string? entityId, map<json> details) returns error? {
        json payload = {
            "organization_id": organizationId,
            "action_type": actionType,
            "entity_type": entityType,
            "details": details
        };

        map<json> payloadMap = <map<json>>payload;
        if recruiterId is string && recruiterId != "" {
            payloadMap["recruiter_id"] = recruiterId;
        }
        if entityId is string && entityId != "" {
            payloadMap["entity_id"] = entityId;
        }

        http:Response response = check self.httpClient->post("/rest/v1/audit_logs", payloadMap, headers = self.headers);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error saving audit log: " + errorBody.toString());
        }
        return;
    }

    # Retrieves evaluation templates for an organization.
    # + organizationId - The organization ID
    # + return - An array of evaluation templates or an error
    remote function getEvaluationTemplates(string organizationId) returns json[]|error {
        string path = string `/rest/v1/evaluation_templates?or=(is_system_template.eq.true,organization_id.eq.${organizationId})&select=*&order=created_at.desc`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }

        json body = check response.getJsonPayload();
        return <json[]>body;
    }

    # Creates an evaluation template.
    # + name - The name of the template
    # + description - The description of the template
    # + 'type - The type of evaluation (e.g., QUESTIONNAIRE, RESUME_SCREENING)
    # + promptTemplate - The prompt template text
    # + organizationId - The organization ID
    # + return - The created template or an error
    remote function createEvaluationTemplate(string name, string description, string 'type, string promptTemplate, string organizationId) returns json|error {
        json payload = {
            "name": name,
            "description": description,
            "type": 'type,
            "prompt_template": promptTemplate,
            "organization_id": organizationId,
            "is_system_template": false
        };

        http:Response response = check self.httpClient->post("/rest/v1/evaluation_templates", payload, headers = self.headers);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }

        json body = check response.getJsonPayload();
        json[] templates = <json[]>body;
        if templates.length() > 0 {
            return templates[0];
        }
        return error("Failed to create evaluation template: No data returned");
    }

    # Updates an evaluation template.
    # + id - The ID of the template
    # + name - The new name of the template
    # + description - The new description
    # + 'type - The new type of evaluation
    # + promptTemplate - The new prompt template text
    # + organizationId - The organization ID to verify ownership
    # + return - Error if failed
    remote function updateEvaluationTemplate(string id, string name, string description, string 'type, string promptTemplate, string organizationId) returns error? {
        json payload = {
            "name": name,
            "description": description,
            "type": 'type,
            "prompt_template": promptTemplate
        };

        string path = string `/rest/v1/evaluation_templates?id=eq.${id}&organization_id=eq.${organizationId}&is_system_template=eq.false`;
        http:Response response = check self.httpClient->patch(path, payload, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }
        return;
    }

    # Deletes an evaluation template.
    # + id - The evaluation template ID
    # + organizationId - The organization ID to ensure only org's templates are deleted
    # + return - Error if failed
    remote function deleteEvaluationTemplate(string id, string organizationId) returns error? {
        string path = string `/rest/v1/evaluation_templates?id=eq.${id}&organization_id=eq.${organizationId}&is_system_template=eq.false`;
        http:Response response = check self.httpClient->delete(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }
        return;
    }

    # Fetches candidate contact details from interview_invitations via anonymous_profiles
    # + candidateId - The ID of the candidate
    # + return - Candidate's real name, email, and job title, or an error if not found
    remote function getCandidateContact(string candidateId) returns record {|string candidateName; string candidateEmail; string jobTitle;|}|error {
        string profPath = string `/rest/v1/anonymous_profiles?candidate_id=eq.${candidateId}&select=invitation_id`;
        http:Response profResp = check self.httpClient->get(profPath, headers = self.headers, targetType = http:Response);
        if profResp.statusCode >= 300 {
            return error("Failed to fetch profile");
        }
        json[] profs = <json[]>check profResp.getJsonPayload();
        if profs.length() == 0 {
            return error("Profile not found");
        }
        string invId = (<map<json>>profs[0])["invitation_id"].toString();

        string invPath = string `/rest/v1/interview_invitations?id=eq.${invId}&select=candidate_name,candidate_email,job_title`;
        http:Response invResp = check self.httpClient->get(invPath, headers = self.headers, targetType = http:Response);
        if invResp.statusCode >= 300 {
            return error("Failed to fetch invitation");
        }
        json[] invs = <json[]>check invResp.getJsonPayload();
        if invs.length() == 0 {
            return error("Invitation not found");
        }

        map<json> inv = <map<json>>invs[0];
        return {
            candidateName: inv["candidate_name"].toString(),
            candidateEmail: inv["candidate_email"].toString(),
            jobTitle: inv["job_title"].toString()
        };
    }

    # Fetches candidate evaluation result
    # + candidateId - The ID of the candidate
    # + return - Overall score and summary feedback of the candidate, or an error if not found
    remote function getCandidateEvaluation(string candidateId) returns record {|decimal overallScore; string summaryFeedback;|}|error {
        string path = string `/rest/v1/evaluation_results?candidate_id=eq.${candidateId}&select=overall_score,summary_feedback`;
        http:Response resp = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);
        if resp.statusCode >= 300 {
            return error("Failed to fetch evaluation");
        }
        json[] evals = <json[]>check resp.getJsonPayload();
        if evals.length() == 0 {
            return error("Evaluation not found");
        }
        map<json> eval = <map<json>>evals[0];

        decimal score = 0d;
        var sVal = eval["overall_score"];
        if sVal != () {
            decimal|error parsedScore = decimal:fromString(sVal.toString());
            if parsedScore is decimal {
                score = parsedScore;
            }
        }

        string feedback = "";
        var f = eval["summary_feedback"];
        if f != () {
            feedback = f.toString();
        }

        return {
            overallScore: score,
            summaryFeedback: feedback
        };
    }

    # Fetches candidates for a specific organization's jobs.
    # Joins anonymous_profiles, interview_invitations, jobs, and evaluation_results.
    #
    # + organizationId - The ID of the organization
    # + return - List of json candidate records
    remote function getCandidates(string organizationId) returns types:CandidateResponse[]|error {
        // Since Supabase REST API doesn't easily do deep joins across 4 tables with custom business logic in one simple GET,
        // we'll fetch profiles linked to the organization's jobs and assemble them here.
        // In a production app, a PostgreSQL View or RPC function would be cleaner.

        // 1. Get Jobs for the Org
        string jobsPath = string `/rest/v1/jobs?organization_id=eq.${organizationId}&select=id,title`;
        http:Response jobsResp = check self.httpClient->get(jobsPath, headers = self.headers, targetType = http:Response);
        if jobsResp.statusCode >= 300 {
            return error("Failed to fetch jobs");
        }
        json[] jobsList = <json[]>check jobsResp.getJsonPayload();

        if jobsList.length() == 0 {
            return []; // No jobs, no candidates
        }

        string jobIdsFilter = "in.(";
        map<string> jobTitleMap = {};
        foreach int i in 0 ..< jobsList.length() {
            map<json> j = <map<json>>jobsList[i];
            string jid = j["id"].toString();
            jobIdsFilter += jid + (i == jobsList.length() - 1 ? ")" : ",");
            jobTitleMap[jid] = j["title"].toString();
        }

        // 2. Get Profiles
        string profilesPath = string `/rest/v1/anonymous_profiles?job_id=${jobIdsFilter}&select=candidate_id,job_id,status,created_at,invitation_id`;
        http:Response profResp = check self.httpClient->get(profilesPath, headers = self.headers, targetType = http:Response);
        if profResp.statusCode >= 300 {
            return error("Failed to fetch profiles");
        }
        json[] profiles = <json[]>check profResp.getJsonPayload();

        // 3. Get Evaluations
        string evalPath = string `/rest/v1/evaluation_results?job_id=${jobIdsFilter}&select=candidate_id,overall_score,cv_score,skills_score,interview_score,summary_feedback`;
        http:Response evalResp = check self.httpClient->get(evalPath, headers = self.headers, targetType = http:Response);
        map<map<json>> evalMap = {};
        if evalResp.statusCode < 300 {
            json[] evals = <json[]>check evalResp.getJsonPayload();
            foreach json e in evals {
                map<json> em = <map<json>>e;
                evalMap[em["candidate_id"].toString()] = em;
            }
        }

        // 4. Get Invitations (for Names)
        string invPath = string `/rest/v1/interview_invitations?organization_id=eq.${organizationId}&select=id,candidate_name`;
        http:Response invResp = check self.httpClient->get(invPath, headers = self.headers, targetType = http:Response);
        map<string> invMap = {};
        if invResp.statusCode < 300 {
            json[] invs = <json[]>check invResp.getJsonPayload();
            foreach json iv in invs {
                map<json> ivm = <map<json>>iv;
                invMap[ivm["id"].toString()] = ivm["candidate_name"] is () ? "Unknown" : ivm["candidate_name"].toString();
            }
        }

        types:CandidateResponse[] results = [];

        foreach json p in profiles {
            map<json> pm = <map<json>>p;
            string cId = pm["candidate_id"].toString();
            string jId = pm["job_id"].toString();
            string status = pm["status"] is () ? "pending" : pm["status"].toString();
            string invId = pm["invitation_id"] is () ? "" : pm["invitation_id"].toString();

            map<json>? eData = evalMap[cId];

            decimal score = 0d;
            decimal cvScore = 0d;
            decimal skillsScore = 0d;
            decimal interviewScore = 0d;
            string? feedback = ();

            if eData is map<json> {
                score = eData["overall_score"] is () ? 0d : <decimal>eData["overall_score"];
                cvScore = eData["cv_score"] is () ? 0d : <decimal>eData["cv_score"];
                skillsScore = eData["skills_score"] is () ? 0d : <decimal>eData["skills_score"];
                interviewScore = eData["interview_score"] is () ? 0d : <decimal>eData["interview_score"];
                feedback = eData["summary_feedback"] is () ? () : eData["summary_feedback"].toString();
            }

            string rawName = "Unknown Candidate";
            if invId != "" && invMap.hasKey(invId) {
                rawName = invMap.get(invId);
            }

            // PII Masking: If pending/screening/rejected, hide the name. Only accepted shows real name.
            string displayName = (status == "accepted") ? rawName : string `Candidate #${cId.substring(0, 8)}`;

            results.push({
                candidateId: cId,
                jobTitle: jobTitleMap.hasKey(jId) ? jobTitleMap.get(jId) : "Unknown Role",
                candidateName: displayName,
                status: status,
                score: score,
                appliedDate: pm["created_at"].toString(),
                seen: true, // simplified for now
                cvScore: cvScore,
                skillsScore: skillsScore,
                interviewScore: interviewScore,
                summaryFeedback: feedback
            });
        }

        return results;
    }

    # Updates a candidate's status in the anonymous_profiles table.
    #
    # + candidateId - The ID of the candidate
    # + newStatus - The new status ('accepted', 'rejected', etc.)
    # + return - Error if failed
    remote function updateCandidateStatus(string candidateId, string newStatus) returns error? {
        json payload = {
            "status": newStatus
        };
        string path = string `/rest/v1/anonymous_profiles?candidate_id=eq.${candidateId}`;
        http:Response response = check self.httpClient->patch(path, payload, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error updating status: " + response.statusCode.toString());
        }
        return;
    }

    # Updates a job's details.
    #
    # + jobId - Job ID
    # + title - New title
    # + description - New description
    # + requiredSkills - New required skills
    # + return - Error if failed
    remote function updateJob(string jobId, string title, string description, string[] requiredSkills) returns error? {
        json payload = {
            "title": title,
            "description": description,
            "required_skills": requiredSkills
        };

        string path = string `/rest/v1/jobs?id=eq.${jobId}`;
        http:Response response = check self.httpClient->patch(path, payload, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }
        return;
    }

    # Deletes a job.
    #
    # + jobId - Job ID
    # + return - Error if failed
    remote function deleteJob(string jobId) returns error? {
        string path = string `/rest/v1/jobs?id=eq.${jobId}`;
        http:Response response = check self.httpClient->delete(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            json|error errorBody = response.getJsonPayload();
            string message = errorBody is json ? errorBody.toString() : "Delete failed";
            return error("Supabase Error: " + message);
        }
        return;
    }

    # Updates a question.
    #
    # + questionId - Question ID
    # + questionText - New question text
    # + sampleAnswer - New sample answer
    # + keywords - New keywords
    # + questionType - New question type
    # + return - Error if failed
    remote function updateQuestion(string questionId, string questionText, string sampleAnswer, string[] keywords, string questionType) returns error? {
        json payload = {
            "question_text": questionText,
            "sample_answer": sampleAnswer,
            "keywords": keywords,
            "type": questionType
        };

        string path = string `/rest/v1/questions?id=eq.${questionId}`;
        http:Response response = check self.httpClient->patch(path, payload, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            json|error errorBody = response.getJsonPayload();
            string message = errorBody is json ? errorBody.toString() : "Update failed";
            return error("Supabase Error: " + message);
        }
        return;
    }

    # Saves a single candidate answer into the candidate_answers table.
    # + candidateId - The candidate UUID
    # + questionId - The question UUID
    # + answerText - The candidate's answer text
    # + return - Error if failed
    remote function saveCandidateAnswer(string candidateId, string questionId, string answerText) returns error? {
        json payload = {
            "candidate_id": candidateId,
            "question_id": questionId,
            "answer_text": answerText
        };

        http:Response response = check self.httpClient->post("/rest/v1/candidate_answers", payload, headers = self.headers);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error saving answer: " + errorBody.toString());
        }
        return;
    }

    # Retrieves the organization_id for a given job.
    # + jobId - The Job ID
    # + return - The organization_id or error
    remote function getOrgIdByJob(string jobId) returns string|error {
        string path = string `/rest/v1/jobs?select=organization_id&id=eq.${jobId}`;
        http:Response response = check self.httpClient->get(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            return error("Supabase Error: " + response.statusCode.toString());
        }

        json body = check response.getJsonPayload();
        json[] results = <json[]>body;
        if results.length() == 0 {
            return error("Job not found: " + jobId);
        }
        map<json> job = <map<json>>results[0];
        return job["organization_id"].toString();
    }

}
