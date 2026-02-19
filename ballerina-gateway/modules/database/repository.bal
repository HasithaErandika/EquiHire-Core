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
            "r2_object_key": r2ObjectKey,
            "job_id": jobId
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

        string path = string `/rest/v1/jobs?recruiter_id=eq.${recruiterId}&select=id,title,created_at`;
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

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
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

            // Handle keywords conversion from JSONB/Array to string[]
            // Supabase returns JSON array for JSONB column
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
                questionType: qData["type"].toString()
            });
        }
        return questions;
    }

    # Deletes a question.
    #
    # + questionId - Question ID
    # + return - Error if failed
    remote function deleteQuestion(string questionId) returns error? {
        string path = string `/rest/v1/questions?id=eq.${questionId}`;
        http:Response response = check self.httpClient->delete(path, headers = self.headers, targetType = http:Response);

        if response.statusCode >= 300 {
            json errorBody = check response.getJsonPayload();
            return error("Supabase Error: " + errorBody.toString());
        }
        return ();
    }

}

