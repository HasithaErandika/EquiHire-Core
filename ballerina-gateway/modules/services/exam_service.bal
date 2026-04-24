// ===========================================================================
// modules/services/exam_service.bal — Exam session lifecycle management.
// ===========================================================================
import ballerina/log;
import equihire/gateway.constants;
import equihire/gateway.repositories;
import equihire/gateway.types;

public function startSession(string candidateId, string invitationId,
                             string jobId) returns types:StartSessionResponse|error {
    string sessionId = check repositories:createExamSession(candidateId, invitationId, jobId);

    // Link the anonymous profile to the invitation to ensure PII mapping
    error? linkErr = repositories:linkCandidateToInvitation(candidateId, invitationId);
    if linkErr is error {
        log:printWarn("Failed to link candidate to invitation", 'error = linkErr, candidateId = candidateId);
    }

    log:printInfo("Exam session started",
                  sessionId  = sessionId,
                  candidateId = candidateId,
                  jobId       = jobId);

    return {sessionId: sessionId, status: constants:SESSION_IN_PROGRESS};
}
