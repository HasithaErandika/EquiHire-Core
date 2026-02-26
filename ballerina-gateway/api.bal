import ballerina/email;
import ballerina/http;
import ballerina/io;
import ballerina/time;
import ballerina/uuid;
import ballerinax/aws.s3;

import equihire/gateway.database;
import equihire/gateway.email as emailUtils;

// Imports from modules
import equihire/gateway.types;

// --- Configuration ---

configurable types:SupabaseConfig supabase = ?;
configurable types:R2Config r2 = ?;
configurable string frontendUrl = ?;
configurable string pythonServiceUrl = ?;

// Asgardeo Configuration
configurable string asgardeoOrgUrl = ?;
configurable string asgardeoTokenAudience = ?;
configurable string asgardeoJwksUrl = ?;

// SMTP Configuration
configurable string smtpHost = ?;
configurable int smtpPort = ?;
configurable string smtpUsername = ?;
configurable string smtpPassword = ?;
configurable string smtpFromEmail = ?;

// --- Clients ---

final email:SmtpClient smtpClient = check new (
    host = smtpHost,
    username = smtpUsername,
    password = smtpPassword,
    port = smtpPort,
    security = email:START_TLS_AUTO
);

// Initialization of S3 Client for Cloudflare R2
// Note: R2 is S3 compatible. We point the endpoint to Cloudflare.
final s3:Client r2Client = check new (
    {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
        region: r2.region,
        "endpoint": "https://" + r2.accountId + ".r2.cloudflarestorage.com"
    }
);

final database:Repository dbClient = check new (supabase);
// Python AI Engine Client
final http:Client pythonClient = check new (pythonServiceUrl);

// --- HTTP Service for API (Port 9092) ---
listener http:Listener apiListener = new (9092);

# REST API Service for EquiHire Platform.
# Exposes endpoints for Organization management, Interviews, and Invitations.
@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: false,
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    }
}
service /api on apiListener {

    resource function post organizations(@http:Payload types:OrganizationRequest payload) returns http:Created|error {
        io:println("NEW ORGANIZATION REGISTRATION REQUEST RECEIVED");

        // 1. Insert Organization
        string orgId = check dbClient->createOrganization(payload.name, payload.industry, payload.size);

        io:println("Organization Created: ", orgId);

        // 2. Insert Recruiter (User) linked to Organization
        check dbClient->createRecruiter(payload.userId, payload.userEmail, orgId);

        return http:CREATED;
    }

    resource function get me/organization(string userId) returns types:OrganizationResponse|http:NotFound|error {
        types:OrganizationResponse|error org = dbClient->getOrganizationByUser(userId);
        if org is error {
            return http:NOT_FOUND;
        }
        return org;
    }

    resource function put organization(@http:Payload types:OrganizationResponse payload, string userId) returns http:Ok|http:Forbidden|error {
        // Security check: Ensure the user belongs to this organization
        boolean|error belongs = dbClient->checkUserInOrganization(userId, payload.id);
        if belongs is error {
            return belongs;
        }
        if !belongs {
            return http:FORBIDDEN;
        }

        error? updateResult = dbClient->updateOrganization(payload.id, payload.industry, payload.size);
        if updateResult is error {
            return error("Failed to update organization");
        }

        return http:OK;
    }

    resource function post jobs(@http:Payload types:JobRequest payload) returns types:JobResponse|http:InternalServerError|error {
        string|error recruiterIdResult = dbClient->getRecruiterId(payload.recruiterId);
        if recruiterIdResult is error {
            return error("Recruiter profile not found");
        }

        string realRecruiterId = <string>recruiterIdResult;

        // Correct call: title, description, requiredSkills (string[]), organizationId, recruiterId
        string|error jobId = dbClient->createJob(
            payload.title,
            payload.description,
            payload.requiredSkills,
            payload.organizationId,
            realRecruiterId
        );

        if jobId is error {
            return http:INTERNAL_SERVER_ERROR;
        }

        _ = start dbClient->createAuditLog(payload.organizationId, realRecruiterId, "Create Job", "Job", <string>jobId, {"jobTitle": payload.title});

        return {id: jobId};
    }

    resource function post jobs/questions(@http:Payload types:QuestionPayload payload) returns http:Created|http:BadRequest|http:InternalServerError|error {
        foreach var q in payload.questions {

            error? result = dbClient->createJobQuestion(
            q.jobId,
            q.questionText,
            q.sampleAnswer,
            q.keywords,
            q.'type
            );

            if result is error {
                io:println("Error creating question: ", result.message());
                return <http:InternalServerError>{
                    body: {"error": result.message()}
                };
            }
        }
        return http:CREATED;
    }

    resource function get jobs/[string jobId]/questions() returns types:QuestionItem[]|http:InternalServerError|error {
        types:QuestionItem[]|error questions = dbClient->getJobQuestions(jobId);
        if questions is error {
            io:println("Error fetching questions: ", questions.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        return questions;
    }

    resource function delete questions/[string questionId]() returns http:NoContent|http:InternalServerError|error {
        error? result = dbClient->deleteQuestion(questionId);
        if result is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        return http:NO_CONTENT;
    }

    resource function put jobs/[string jobId](@http:Payload types:JobUpdateRequest payload) returns http:Ok|http:InternalServerError|error {
        error? result = dbClient->updateJob(jobId, payload.title, payload.description, payload.requiredSkills);
        if result is error {
            io:println("Error updating job: ", result.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        return http:OK;
    }

    resource function delete jobs/[string jobId]() returns http:NoContent|http:InternalServerError|error {
        error? result = dbClient->deleteJob(jobId);
        if result is error {
            io:println("Error deleting job: ", result.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        return http:NO_CONTENT;
    }

    resource function put questions/[string questionId](@http:Payload types:QuestionUpdateRequest payload) returns http:Ok|http:InternalServerError|error {
        error? result = dbClient->updateQuestion(questionId, payload.questionText, payload.sampleAnswer, payload.keywords, payload.'type);
        if result is error {
            io:println("Error updating question: ", result.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        return http:OK;
    }

    # Retrieves all jobs for the authenticated recruiter.
    #
    # + userId - User ID
    # + return - List of jobs
    resource function get jobs(string userId) returns json[]|http:InternalServerError|error {
        string|error recruiterId = dbClient->getRecruiterId(userId);
        if recruiterId is error {
            return error("Recruiter not found");
        }

        json[]|error jobs = dbClient->getJobsByRecruiter(recruiterId);
        if jobs is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        return jobs;
    }

    # Retrieves invitation history for the authenticated recruiter.
    #
    # + userId - User ID
    # + return - List of invitations
    resource function get invitations(string userId) returns json[]|http:InternalServerError|error {
        string|error recruiterId = dbClient->getRecruiterId(userId);
        if recruiterId is error {
            return error("Recruiter not found");
        }

        json[]|error invitations = dbClient->getInvitationsByRecruiter(recruiterId);
        if invitations is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        return invitations;
    }

    // --- Secure Candidate Upload (Vault & View) ---

    // 1. Get Presigned URL for Upload (Client uploads directly to R2)
    resource function get candidates/upload\-url() returns types:UploadUrlResponse|http:InternalServerError|error {
        string candidateId = uuid:createType1AsString();
        string objectKey = "candidates/" + candidateId + "/resume.pdf";

        // Generate Presigned URL
        // Using manual V4 signing (utils.bal) because S3 client presignUrl is not available or version mismatch.
        string|error signedUrlResult = generateR2PresignedUrl(
                r2.accessKeyId,
                r2.secretAccessKey,
                r2.accountId,
                r2.bucketName,
                objectKey,
                "PUT",
                3600
        );

        if signedUrlResult is error {
            io:println("Error generating presigned URL: ", signedUrlResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }

        io:println("Generated Presigned URL for Candidate: ", candidateId);

        return {
            uploadUrl: signedUrlResult,
            candidateId: candidateId,
            objectKey: objectKey
        };
    }

    // 2. Complete Upload & Trigger AI Parsing
    resource function post candidates/complete\-upload(@http:Payload types:CompleteUploadRequest payload) returns http:Created|http:InternalServerError|error {
        io:println("Upload completion signal received for: ", payload.candidateId);

        // 1. Secure Layer: Save Identity Link (Identity -> R2 Key)
        error? dbResult = dbClient->createSecureIdentity(payload.candidateId, payload.objectKey, payload.jobId);

        if dbResult is error {
            io:println("DB Error: ", dbResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }

        // 2. Fetch Job Requirements
        string[]|error requirements = dbClient->getJobRequirements(payload.jobId);
        string[] skills = [];
        if requirements is string[] {
            skills = requirements;
        }

        // 3. Trigger Python AI Service (Fire & Forget or Async)
        // We send the payload to the Python service to start parsing
        // Python service will update 'skills' in 'anonymous_profiles'

        // In real world, use a message queue. specific to this project, HTTP call:
        json aiPayload = {
            "candidate_id": payload.candidateId,
            "r2_object_key": payload.objectKey,
            "job_id": payload.jobId,
            "required_skills": skills
        };

        // We do strictly fire and forget here to not block UI
        _ = start pythonClient->post("/parse/cv", aiPayload, targetType = http:Response);

        return http:CREATED;
    }

    // 3. Reveal Candidate (Get Secure Link from Python Vault)
    resource function get candidates/[string candidateId]/reveal() returns types:RevealResponse|http:InternalServerError|error {
        io:println("Reveal request for: ", candidateId);

        // Proxy to Python Service
        // Python service checks permissions (TODO) and generates link
        types:RevealResponse|error response = pythonClient->get("/reveal/" + candidateId);

        if response is error {
            io:println("Error calling Python Reveal: ", response.message());
            return http:INTERNAL_SERVER_ERROR;
        }

        return response;
    }

    // 4. Evaluate Answer (Gemini Proxy)
    resource function post evaluate(@http:Payload types:EvaluationRequest payload) returns types:EvaluationResponse|http:InternalServerError|error {
        io:println("Evaluation request received");

        // Proxy to Python Service
        // Note: Field names match because we used camelCase in Ballerina and snake_case in Python is handled by standard mapping or Manual.
        // Actually, Ballerina -> Python JSON keeps keys as is. Python expects snake_case.
        // We need to map camelCase (Ballerina) -> snake_case (Python) manually.

        json pythonPayload = {
            "candidate_answer": payload.candidateAnswer,
            "question": payload.question,
            "model_answer": payload.modelAnswer,
            "experience_level": payload.experienceLevel,
            "strictness": payload.strictness
        };

        json|error response = pythonClient->post("/evaluate", pythonPayload);

        if response is error {
            io:println("Error calling Python Evaluate: ", response.message());
            return http:INTERNAL_SERVER_ERROR;
        }

        // Map snake_case (Python) -> camelCase (Ballerina Response)
        // Python: { redacted_answer, score, feedback, pii_detected }
        // Ballerina: { redactedAnswer, score, feedback, piiDetected }

        map<json> respMap = <map<json>>response;

        return {
            redactedAnswer: <string>respMap["redacted_answer"],
            score: <decimal>respMap["score"],
            feedback: <string>respMap["feedback"],
            piiDetected: <boolean>respMap["pii_detected"]
        };
    }

    // --- Magic Link Invitation Endpoints ---

    resource function post invitations(@http:Payload types:InvitationRequest payload) returns types:InvitationResponse|http:InternalServerError|error {
        io:println("NEW INTERVIEW INVITATION REQUEST");

        // 1. Resolve Recruiter ID
        string|error recruiterIdResult = dbClient->getRecruiterId(payload.recruiterId);

        if recruiterIdResult is error {
            io:println("Database error looking up recruiter: ", recruiterIdResult.message());
            return error("Recruiter profile not found. Please log in again.");
        }

        string realRecruiterId = <string>recruiterIdResult;

        // Generate unique token
        string token = uuid:createType1AsString();

        // Calculate expiration (7 days from now)
        time:Utc currentTime = time:utcNow();
        time:Utc expirationTime = time:utcAddSeconds(currentTime, 7 * 24 * 60 * 60); // 7 days
        string expiresAt = time:utcToString(expirationTime);

        // Insert invitation
        string|error invitationId = dbClient->createInvitation(
                token,
                payload.candidateEmail,
                payload.candidateName,
                payload.jobTitle,
                realRecruiterId,
                payload.organizationId,
                payload.jobId,
                payload.interviewDate,
                expiresAt
        );

        if invitationId is error {
            io:println("Database error:", invitationId);
            return http:INTERNAL_SERVER_ERROR;
        }

        io:println("Invitation created with ID:", invitationId);

        _ = start dbClient->createAuditLog(payload.organizationId, realRecruiterId, "Send Invitation", "Invitation", <string>invitationId, {"candidateEmail": payload.candidateEmail, "jobTitle": payload.jobTitle});

        // Generate magic link
        string magicLink = frontendUrl + "/invite/" + token;

        // Send email (SMTP)
        error? emailResult = emailUtils:sendInvitationEmail(
                smtpClient,
                smtpFromEmail,
                payload.candidateEmail,
                payload.candidateName,
                payload.jobTitle,
                magicLink
        );

        if emailResult is error {
            io:println("Email sending failed:", emailResult.message());
        } else {
            io:println("Invitation email sent to:", payload.candidateEmail);
        }

        return {
            id: invitationId,
            token: token,
            magicLink: magicLink,
            candidateEmail: payload.candidateEmail,
            expiresAt: expiresAt
        };
    }

    resource function get invitations/validate/[string token]() returns types:TokenValidationResponse|http:NotFound|error {
        io:println("Validating token:", token);

        // Query invitation by token
        database:InvitationRecord|error result = dbClient->getInvitationByToken(token);

        if result is error {
            return http:NOT_FOUND;
        }

        // Check if already used
        if result.used_at !is () {
            return {
                valid: false,
                message: "This invitation link has already been used"
            };
        }

        // Check if expired
        string cleanExpiresAt = re ` `.replace(result.expires_at, "T");
        if !cleanExpiresAt.endsWith("Z") && !cleanExpiresAt.includes("+") {
            cleanExpiresAt = cleanExpiresAt + "Z";
        }

        time:Utc|error expirationTime = time:utcFromString(cleanExpiresAt);
        if expirationTime is error {
            io:println("Error parsing time: ", cleanExpiresAt);
            return error("Invalid expiration time format: " + cleanExpiresAt);
        }

        time:Utc currentTime = time:utcNow();
        decimal timeDiff = time:utcDiffSeconds(currentTime, expirationTime);
        if timeDiff > 0d {
            // Update status to expired
            _ = check dbClient->expireInvitation(result.id);

            return {
                valid: false,
                message: "This invitation link has expired"
            };
        }

        // Mark as used
        time:Utc usedTime = time:utcNow();
        string usedAtStr = time:utcToString(usedTime);
        _ = check dbClient->acceptInvitation(result.id, usedAtStr);

        io:println("Token validated successfully for:", result.candidate_email);

        return {
            valid: true,
            candidateEmail: result.candidate_email,
            candidateName: result.candidate_name,
            jobTitle: result.job_title,
            organizationId: result.organization_id,
            jobId: result.job_id
        };
    }

    resource function get organizations/[string organizationId]/audit\-logs() returns json[]|http:InternalServerError|error {
        json[]|error logs = dbClient->getAuditLogs(organizationId);
        if logs is error {
            return http:INTERNAL_SERVER_ERROR;
        }

        json[] formattedLogs = [];
        foreach json log in logs {
            map<json> l = <map<json>>log;

            string actor = "System";
            var recruitersObj = l["recruiters"];
            if recruitersObj is map<json> {
                var email = recruitersObj["email"];
                if email is string {
                    actor = email;
                }
            }

            // stringify details logic (frontend expects a string, so we'll just format it)
            string detailsStr = l["details"].toString();

            formattedLogs.push({
                "id": l["id"].toString(),
                "action": l["action_type"].toString(),
                "actor": actor,
                "target": l["entity_type"].toString(),
                "details": detailsStr,
                "created_at": l["created_at"].toString()
            });
        }

        return formattedLogs;
    }

    resource function get organizations/[string organizationId]/evaluation\-templates() returns json[]|http:InternalServerError|error {
        json[]|error templates = dbClient->getEvaluationTemplates(organizationId);
        if templates is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        return templates;
    }

    resource function post evaluation\-templates(@http:Payload json payload) returns json|http:InternalServerError|error {
        map<json> data = <map<json>>payload;
        string name = data["name"].toString();
        string description = data["description"].toString();
        string 'type = data["type"].toString();
        string promptTemplate = data["prompt_template"].toString();
        string organizationId = data["organization_id"].toString();

        json|error result = dbClient->createEvaluationTemplate(name, description, 'type, promptTemplate, organizationId);
        if result is error {
            return http:INTERNAL_SERVER_ERROR;
        }

        _ = start dbClient->createAuditLog(organizationId, (), "Create Evaluation Template", "EvaluationTemplate", (), {"templateName": name});

        return result;
    }

    resource function put evaluation\-templates/[string id](@http:Payload json payload) returns http:Ok|http:InternalServerError|error {
        map<json> data = <map<json>>payload;
        string name = data["name"].toString();
        string description = data["description"].toString();
        string 'type = data["type"].toString();
        string promptTemplate = data["prompt_template"].toString();
        string organizationId = data["organization_id"].toString();

        error? result = dbClient->updateEvaluationTemplate(id, name, description, 'type, promptTemplate, organizationId);
        if result is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        return http:OK;
    }

    resource function delete evaluation\-templates/[string id](string organizationId) returns http:NoContent|http:InternalServerError|error {
        error? result = dbClient->deleteEvaluationTemplate(id, organizationId);
        if result is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        return http:NO_CONTENT;
    }

    resource function get organizations/[string organizationId]/candidates() returns types:CandidateResponse[]|http:InternalServerError|error {
        types:CandidateResponse[]|error candidates = dbClient->getCandidates(organizationId);
        if candidates is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        return candidates;
    }

    resource function post candidates/[string candidateId]/decide(@http:Payload types:DecisionRequest payload) returns types:DecisionResponse|http:InternalServerError|error {
        // 1. Get Candidate Evaluation Score
        record {|decimal overallScore; string summaryFeedback;|}|error eval = dbClient->getCandidateEvaluation(candidateId);
        if eval is error {
            io:println("Error getting evaluation: ", eval);
            return http:INTERNAL_SERVER_ERROR;
        }

        // 2. Get Candidate Contact Info
        record {|string candidateName; string candidateEmail; string jobTitle;|}|error contact = dbClient->getCandidateContact(candidateId);
        if contact is error {
            io:println("Error getting contact info: ", contact);
            return http:INTERNAL_SERVER_ERROR;
        }

        // 3. Determine Pass/Fail based on Threshold
        boolean isPass = eval.overallScore >= payload.threshold;
        string newStatus = isPass ? "accepted" : "rejected";

        // 4. Update Status in DB
        error? updateErr = dbClient->updateCandidateStatus(candidateId, newStatus);
        if updateErr is error {
            io:println("Error updating status: ", updateErr);
            return http:INTERNAL_SERVER_ERROR;
        }

        // 5. Build and Send Email
        boolean emailSent = false;
        string msg = "Decision processed successfully.";

        if isPass {
            error? emailErr = emailUtils:sendAcceptanceEmail(smtpClient, smtpFromEmail, contact.candidateEmail, contact.candidateName, contact.jobTitle);
            if emailErr is error {
                io:println("Failed to send acceptance email: ", emailErr);
                msg = "Decision processed, but failed to send email.";
            } else {
                emailSent = true;
                msg = "Decision processed and acceptance email sent.";
            }
        } else {
            // Generate rejection email via Python AI Engine
            json emailPayload = {
                "candidate_name": contact.candidateName,
                "job_title": contact.jobTitle,
                "summary_feedback": eval.summaryFeedback
            };

            http:Response|error aiResp = pythonClient->post("/generate/rejection-email", emailPayload);
            if aiResp is error {
                io:println("Failed to reach Python AI Engine: ", aiResp);
                msg = "Decision processed, but AI email generation failed.";
            } else {
                json|error responsePayload = aiResp.getJsonPayload();
                if responsePayload is map<json> {
                    var emailBody = responsePayload["email_body"];
                    if emailBody is string {
                        error? emailErr = emailUtils:sendRejectionEmail(smtpClient, smtpFromEmail, contact.candidateEmail, contact.candidateName, contact.jobTitle, emailBody);
                        if emailErr is error {
                            io:println("Failed to send rejection email: ", emailErr);
                            msg = "Decision processed, AI generated email, but sending failed.";
                        } else {
                            emailSent = true;
                            msg = "Decision processed and explainable rejection email sent.";
                        }
                    } else {
                        io:println("Failed to parse email_body as string");
                        msg = "Decision processed, but AI response format invalid.";
                    }
                } else {
                    io:println("Failed to parse AI response: ", responsePayload);
                    msg = "Decision processed, but AI response parsing failed.";
                }
            }
        }

        return {
            candidateId: candidateId,
            pass: isPass,
            emailSent: emailSent,
            message: msg
        };
    }

    // --- Candidate Assessment Submission ---
    resource function post candidates/[string candidateId]/evaluate(@http:Payload json payload) returns json|http:InternalServerError|error {
        io:println("Assessment submission received for candidate: ", candidateId);

        map<json> data = <map<json>>payload;
        string jobId = data["jobId"].toString();
        json answersJson = data["answers"];
        json[] answersArr = <json[]>answersJson;

        // Save each answer to DB
        foreach json ans in answersArr {
            map<json> a = <map<json>>ans;
            string questionId = a["questionId"].toString();
            string answerText = a["answerText"].toString();

            error? saveResult = dbClient->saveCandidateAnswer(candidateId, questionId, answerText);
            if saveResult is error {
                io:println("Error saving answer: ", saveResult.message());
            }
        }

        // Fire-and-forget AI evaluation per answer
        types:QuestionItem[]|error questions = dbClient->getJobQuestions(jobId);
        if questions is types:QuestionItem[] {
            foreach json ans in answersArr {
                map<json> a = <map<json>>ans;
                string questionId = a["questionId"].toString();
                string answerText = a["answerText"].toString();

                foreach types:QuestionItem q in questions {
                    string qId = q.id ?: "";
                    if qId == questionId {
                        json evalPayload = {
                            "candidate_answer": answerText,
                            "question": q.questionText,
                            "model_answer": q.sampleAnswer,
                            "experience_level": "Junior",
                            "strictness": "Moderate"
                        };
                        _ = start pythonClient->post("/evaluate", evalPayload, targetType = http:Response);
                        break;
                    }
                }
            }
        }

        // Log to audit
        string|error orgId = dbClient->getOrgIdByJob(jobId);
        if orgId is string {
            _ = start dbClient->createAuditLog(orgId, (), "Submit Assessment", "Candidate", candidateId, {"jobId": jobId, "answerCount": answersArr.length()});
        }

        return {"status": "submitted", "candidateId": candidateId, "answersReceived": answersArr.length()};
    }

    // --- Lockdown Cheat Flag ---
    resource function post candidates/[string candidateId]/flag\-cheating(@http:Payload json payload) returns json|http:InternalServerError|error {
        io:println("Cheat flag received for candidate: ", candidateId);

        map<json> data = <map<json>>payload;
        string organizationId = data["organizationId"].toString();
        json violations = data["violations"];

        error? auditResult = dbClient->createAuditLog(
            organizationId,
            (),
            "Lockdown Violation",
            "Candidate",
            candidateId,
            <map<json>>violations
        );

        if auditResult is error {
            io:println("Error logging cheat flag: ", auditResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }

        return {"status": "flagged", "candidateId": candidateId};
    }
}

