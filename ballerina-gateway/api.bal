import ballerina/email;
import ballerina/http;
import ballerina/io;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerinax/postgresql;

// Helper to broadcast (needs to be shared or re-implemented if cross-file)
// For now, we keep it simple. If 'webClients' is in `websocket.bal`, we can't access it easily without a shared module.
// So we will just Log for this version.

// --- Data Types ---

type OrganizationRequest record {
    string name;
    string industry;
    string size;
    string userEmail;
    string userId;
};

type OrganizationResponse record {
    string id;
    string name;
    string industry;
    string size;
};

type InvitationRequest record {
    string candidateEmail;
    string candidateName;
    string jobTitle;
    string? interviewDate; // ISO 8601 format
    string organizationId;
    string recruiterId;
};

type InvitationResponse record {
    string id;
    string token;
    string magicLink;
    string candidateEmail;
    string expiresAt;
};

type TokenValidationResponse record {
    boolean valid;
    string? candidateEmail?;
    string? candidateName?;
    string? jobTitle?;
    string? organizationId?;
    string? message?;
};

type EmailConfig record {
    string apiKey;
    string fromEmail;
    string fromName;
};

type DatabaseConfig record {
    string host;
    int port;
    string user;
    string password;
    string name;
};

// --- Configuration ---

configurable DatabaseConfig database = ?;
configurable string frontendUrl = "http://localhost:5173";
configurable string smtpHost = "smtp-relay.brevo.com";
configurable int smtpPort = 587;
configurable string smtpUsername = "";
configurable string smtpPassword = "";
configurable string smtpFromEmail = "wickramasinghe.erandika@gmail.com";

// --- Clients ---

final email:SmtpClient smtpClient = check new (
    host = smtpHost,
    username = smtpUsername,
    password = smtpPassword,
    port = smtpPort,
    security = email:START_TLS_AUTO
);

// --- Clients ---

final postgresql:Client dbClient = check new (
    host = database.host,
    username = database.user,
    password = database.password,
    database = database.name,
    port = database.port
);

// --- HTTP Service for API (Port 9092) ---
listener http:Listener apiListener = new (9092);

@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: true,
        allowHeaders: ["Content-Type", "Authorization"]
    }
}
service /api on apiListener {

    resource function post organizations(@http:Payload OrganizationRequest payload) returns http:Created|error {
        io:println("NEW ORGANIZATION REGISTRATION REQUEST RECEIVED");

        // Transaction to ensure both Organization and Recruiter are created, or neither
        // Transaction to ensure both Organization and Recruiter are created, or neither
        transaction {
            // 1. Insert Organization
            sql:ParameterizedQuery orgQuery = `INSERT INTO organizations (name, industry, size) 
                                             VALUES (${payload.name}, ${payload.industry}, ${payload.size}) 
                                             RETURNING id`;
            // Using check allows automatic rollback on error
            string orgId = check dbClient->queryRow(orgQuery);

            io:println("Organization Created: ", orgId);

            // 2. Insert Recruiter (User) linked to Organization
            sql:ParameterizedQuery recruiterQuery = `INSERT INTO recruiters (user_id, email, organization_id, role) 
                                                   VALUES (${payload.userId}::uuid, ${payload.userEmail}, ${orgId}::uuid, 'admin')`;
            _ = check dbClient->execute(recruiterQuery);

            // Transaction auto-commits at the end of the block if successful
            check commit;
        }

        return http:CREATED;
    }

    resource function get me/organization(string userId) returns OrganizationResponse|http:NotFound|error {
        sql:ParameterizedQuery query = `SELECT o.id, o.name, o.industry, o.size 
                                        FROM organizations o
                                        JOIN recruiters r ON o.id = r.organization_id
                                        WHERE r.user_id = ${userId}::uuid`;

        OrganizationResponse|sql:Error result = dbClient->queryRow(query);

        if result is sql:NoRowsError {
            return http:NOT_FOUND;
        }

        return result;
    }

    resource function put organization(@http:Payload OrganizationResponse payload, string userId) returns http:Ok|http:Forbidden|error {
        // Security check: Ensure the user belongs to this organization
        sql:ParameterizedQuery checkQuery = `SELECT 1 FROM recruiters 
                                              WHERE user_id = ${userId}::uuid AND organization_id = ${payload.id}::uuid`;
        int|sql:Error|sql:NoRowsError checkResult = dbClient->queryRow(checkQuery);

        if checkResult is sql:NoRowsError {
            return http:FORBIDDEN;
        }

        sql:ParameterizedQuery updateQuery = `UPDATE organizations 
                                               SET industry = ${payload.industry}, size = ${payload.size}
                                               WHERE id = ${payload.id}::uuid`;

        sql:ExecutionResult|sql:Error result = dbClient->execute(updateQuery);

        if result is sql:Error {
            return error("Failed to update organization");
        }

        return http:OK;
    }

    // --- Magic Link Invitation Endpoints ---

    resource function post invitations(@http:Payload InvitationRequest payload) returns InvitationResponse|http:InternalServerError|error {
        io:println("NEW INTERVIEW INVITATION REQUEST");

        // 1. Resolve Recruiter ID (PK) from the User ID (Subject ID from payload)
        sql:ParameterizedQuery recruiterQuery = `SELECT id FROM recruiters WHERE user_id = ${payload.recruiterId}::uuid`;
        string|sql:Error|sql:NoRowsError recruiterIdResult = dbClient->queryRow(recruiterQuery);

        if recruiterIdResult is sql:NoRowsError {
            io:println("Recruiter not found for User ID: ", payload.recruiterId);
            return error("Recruiter profile not found. Please log in again.");
        }
        if recruiterIdResult is sql:Error {
            io:println("Database error looking up recruiter: ", recruiterIdResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }

        string realRecruiterId = <string>recruiterIdResult;

        // Generate unique token
        string token = uuid:createType1AsString();

        // Calculate expiration (7 days from now)
        time:Utc currentTime = time:utcNow();
        time:Utc expirationTime = time:utcAddSeconds(currentTime, 7 * 24 * 60 * 60); // 7 days
        string expiresAt = time:utcToString(expirationTime);

        // Parse interview date if provided
        string? interviewDateSql = payload.interviewDate;

        // Insert invitation into database
        sql:ParameterizedQuery insertQuery = `
            INSERT INTO interview_invitations 
            (token, candidate_email, candidate_name, recruiter_id, organization_id, job_title, interview_date, expires_at, status) 
            VALUES (
                ${token}, 
                ${payload.candidateEmail}, 
                ${payload.candidateName}, 
                ${realRecruiterId}::uuid, 
                ${payload.organizationId}::uuid, 
                ${payload.jobTitle}, 
                ${interviewDateSql}::timestamp with time zone, 
                ${expiresAt}::timestamp with time zone, 
                'pending'
            ) 
            RETURNING id`;

        string|sql:Error invitationId = dbClient->queryRow(insertQuery);

        if invitationId is sql:Error {
            io:println("Database error:", invitationId);
            return http:INTERNAL_SERVER_ERROR;
        }

        io:println("Invitation created with ID:", invitationId);

        // Generate magic link
        string magicLink = frontendUrl + "/invite/" + token;

        // Send email (Brevo integration)
        error? emailResult = sendInvitationEmail(
                payload.candidateEmail,
                payload.candidateName,
                payload.jobTitle,
                magicLink
        );

        if emailResult is error {
            io:println("Email sending failed:", emailResult.message());
            // Continue anyway - recruiter can manually share the link
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

    resource function get invitations/validate/[string token]() returns TokenValidationResponse|http:NotFound|error {
        io:println("Validating token:", token);

        // Query invitation by token
        sql:ParameterizedQuery query = `
            SELECT 
                id, candidate_email, candidate_name, job_title, organization_id, 
                expires_at, used_at, status 
            FROM interview_invitations 
            WHERE token = ${token}`;

        record {
            string id;
            string candidate_email;
            string? candidate_name;
            string? job_title;
            string organization_id;
            string expires_at;
            string? used_at;
            string status;
        }|sql:Error result = dbClient->queryRow(query);

        if result is sql:NoRowsError {
            return http:NOT_FOUND;
        }

        if result is sql:Error {
            return error("Database error during token validation");
        }

        // Check if already used
        if result.used_at !is () {
            return {
                valid: false,
                message: "This invitation link has already been used"
            };
        }

        // Check if expired
        // Check if expired
        // Fix: SQL timestamps might use space instead of T, e.g., "2024-02-01 10:00:00+05:30"
        // We replace space with T to satisfy ISO 8601 parser.
        string cleanExpiresAt = re ` `.replace(result.expires_at, "T");

        time:Utc|error expirationTime = time:utcFromString(cleanExpiresAt);
        if expirationTime is error {
            io:println("Error parsing time: ", cleanExpiresAt);
            return error("Invalid expiration time format: " + cleanExpiresAt);
        }

        time:Utc currentTime = time:utcNow();
        decimal timeDiff = time:utcDiffSeconds(currentTime, expirationTime);
        if timeDiff > 0d {
            // Update status to expired
            sql:ParameterizedQuery updateQuery = `UPDATE interview_invitations SET status = 'expired' WHERE id = ${result.id}::uuid`;
            _ = check dbClient->execute(updateQuery);

            return {
                valid: false,
                message: "This invitation link has expired"
            };
        }

        // Mark as used
        time:Utc usedTime = time:utcNow();
        string usedAtStr = time:utcToString(usedTime);
        sql:ParameterizedQuery updateQuery = `
            UPDATE interview_invitations 
            SET used_at = ${usedAtStr}::timestamp with time zone, status = 'accepted' 
            WHERE id = ${result.id}::uuid`;
        _ = check dbClient->execute(updateQuery);

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

// --- Helper Functions ---

function sendInvitationEmail(string toEmail, string candidateName, string jobTitle, string magicLink) returns error? {
    if smtpPassword == "" {
        io:println("[WARNING] SMTP Password not configured. Email not sent.");
        io:println("Magic Link:", magicLink);
        return;
    }

    string htmlBody = string `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #FF7300 0%, #E56700 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .button { display: inline-block; background: #FF7300; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .button:hover { background: #E56700; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .info-box { background: #f9f9f9; border-left: 4px solid #FF7300; padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">🎯 EquiHire</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.95;">Blind Interview Platform</p>
                </div>
                <div class="content">
                    <h2 style="color: #FF7300; margin-top: 0;">Hello ${candidateName},</h2>
                    <p>You have been invited to participate in a <strong>Blind Interview</strong> for the position of:</p>
                    <div class="info-box">
                        <h3 style="margin: 0; color: #FF7300;">${jobTitle}</h3>
                    </div>
                    <p>EquiHire ensures a fair and unbiased interview process. Your identity will be protected to ensure evaluation based purely on technical merit.</p>
                    <p><strong>Click the button below to access your interview:</strong></p>
                    <div style="text-align: center;">
                        <a href="${magicLink}" class="button">Join Interview →</a>
                    </div>
                    <p style="font-size: 13px; color: #666; margin-top: 30px;">
                        <strong>Note:</strong> This link is valid for 7 days and can only be used once. If you did not request this interview, please ignore this email.
                    </p>
                    <p style="font-size: 12px; color: #999; margin-top: 20px;">
                        If the button doesn't work, copy and paste this link:<br>
                        <span style="color: #FF7300; word-break: break-all;">${magicLink}</span>
                    </p>
                </div>
                <div class="footer">
                    <p>Powered by <strong>EquiHire Core</strong> • Privacy Protected</p>
                    <p>Evaluating Code, Not Context.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    email:Message emailMessage = {
        to: toEmail,
        subject: "Your Interview Invitation - " + jobTitle,
        htmlBody: htmlBody,
        'from: smtpFromEmail
    };

    check smtpClient->sendMessage(emailMessage);
    return;
}
