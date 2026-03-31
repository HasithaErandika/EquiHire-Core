// ===========================================================================
// modules/services/invitation_service.bal — Magic link creation and validation.
// ===========================================================================
import ballerina/log;
import ballerina/time;
import ballerina/uuid;
import equihire/gateway.config;
import equihire/gateway.constants;
import equihire/gateway.repositories;
import equihire/gateway.types;

public function createInvitation(types:InvitationRequest payload,
                                 string recruiterId) returns types:InvitationResponse|error {
    string token     = uuid:createType4AsString();
    string expiresAt = buildExpiry();
    string magicLink = config:frontendUrl + "/invite/" + token;

    string invitationId = check repositories:createInvitation(
        token, payload.candidateEmail, payload.candidateName, payload.jobTitle,
        recruiterId, payload.organizationId, payload.jobId,
        payload.interviewDate, expiresAt);

    log:printInfo("Invitation created",
                  invitationId = invitationId,
                  candidateEmail = payload.candidateEmail,
                  jobId = payload.jobId);

    _ = start repositories:createAuditLog(
        payload.organizationId, recruiterId, constants:AUDIT_SEND_INVITATION,
        "Invitation", invitationId,
        {"candidateEmail": payload.candidateEmail, "jobTitle": payload.jobTitle});

    return {
        id: invitationId, token: token,
        magicLink: magicLink, candidateEmail: payload.candidateEmail, expiresAt: expiresAt
    };
}

public function validateToken(string token) returns types:TokenValidationResponse|error {
    types:InvitationRecord|error result = repositories:getInvitationByToken(token);
    if result is error {
        return {valid: false, message: "Invitation not found or already deleted"};
    }

    // Check 1: Token must not have been used already
    if result.used_at !is () {
        return {valid: false, message: "This invitation link has already been used"};
    }

    // Check 2: Status must be 'pending' — prevents replay if already accepted/expired
    if result.status != constants:STATUS_PENDING {
        return {valid: false, message: "This invitation is no longer valid (status: " + result.status + ")"};
    }

    // Check 3: Token must not be expired
    time:Utc|error expiry = parseExpiry(result.expires_at);
    if expiry is error {
        log:printError("Failed to parse invitation expiry", 'error = expiry, token = token);
        return error("Invalid expiration time format");
    }

    if time:utcDiffSeconds(time:utcNow(), expiry) > 0d {
        _ = start repositories:expireInvitation(result.id);
        return {valid: false, message: "This invitation link has expired"};
    }

    // Mark as accepted atomically — prevents replay on refresh
    string usedAt = time:utcToString(time:utcNow());
    check repositories:acceptInvitation(result.id, usedAt);

    log:printInfo("Token validated and accepted", candidateEmail = result.candidate_email, invitationId = result.id);
    return {
        valid: true,
        candidateEmail:  result.candidate_email,
        candidateName:   result.candidate_name,
        jobTitle:        result.job_title,
        organizationId:  result.organization_id,
        jobId:           result.job_id,
        invitationId:    result.id
    };
}

function buildExpiry() returns string {
    time:Utc expiry = time:utcAddSeconds(time:utcNow(), <decimal>constants:INVITATION_TTL_SECONDS);
    return time:utcToString(expiry);
}

function parseExpiry(string raw) returns time:Utc|error {
    string cleaned = re ` `.replace(raw, "T");
    if !cleaned.endsWith("Z") && !cleaned.includes("+") {
        cleaned = cleaned + "Z";
    }
    return time:utcFromString(cleaned);
}
