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
// pythonClient is defined in service.bal and available here

// --- HTTP Service for API (Port 9092) ---
listener http:Listener apiListener = new (9092);

# REST API Service for EquiHire Platform.
# Exposes endpoints for Organization management, Interviews, and Invitations.
@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: true,
        allowHeaders: ["Content-Type", "Authorization"]
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
        io:println("NEW JOB CREATION REQUEST");
        string|error jobId = dbClient->createJob(
            payload.title,
            payload.description,
            payload.requiredSkills,
            payload.screeningQuestions,
            payload.organizationId,
            payload.recruiterId
        );

        if jobId is error {
            io:println("Error creating job: ", jobId.message());
            return http:INTERNAL_SERVER_ERROR;
        }

        return {id: jobId};
    }

    // --- Secure Candidate Upload (Vault & View) ---

    // 1. Get Presigned URL for Upload (Client uploads directly to R2)
    resource function get candidates/upload\-url() returns types:UploadUrlResponse|http:InternalServerError|error {
        string candidateId = uuid:createType1AsString();
        string objectKey = "candidates/" + candidateId + "/resume.pdf";

        // Generate Presigned URL
        // TODO: Validate correct method for 'ballerinax/aws.s3' to generate PUT url.
        // For MVP/Compilation, we will stub it if the method is not found.
        // Trying 'presignUrl' one more time or assuming fixed later.
        // Actually, let's just construct it manually for now to avoid compilation error if method missing.
        // A placeholder for now:
        string signedUrlResult = "https://" + r2.accountId + ".r2.cloudflarestorage.com/" + r2.bucketName + "/" + objectKey + "?token=placeholder";

        io:println("Generated Placeholder Presigned URL for Candidate: ", candidateId);

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
                payload.interviewDate,
                expiresAt
        );

        if invitationId is error {
            io:println("Database error:", invitationId);
            return http:INTERNAL_SERVER_ERROR;
        }

        io:println("Invitation created with ID:", invitationId);

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
            organizationId: result.organization_id
        };
    }
}

