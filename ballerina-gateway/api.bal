// ===========================================================================
// api.bal — Unified HTTP API resources.
// ===========================================================================
import ballerina/http;
import ballerina/log;
import ballerina/mime;

import equihire/gateway.constants;
import equihire/gateway.repositories;
import equihire/gateway.services;
import equihire/gateway.types;
import equihire/gateway.utils;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
        allowCredentials: false,
        maxAge: 3600
    }
}
service / on apiListener {


    // --- CV Upload ---
    resource function post candidates/upload\-cv(http:Request req)
            returns json|http:BadRequest|http:InternalServerError|error {
        mime:Entity[] bodyParts = check req.getBodyParts();
        byte[]? fileBytes = ();
        string? jobId = ();

        foreach mime:Entity part in bodyParts {
            mime:ContentDisposition cd = part.getContentDisposition();
            if cd.name == "file" {
                fileBytes = check part.getByteArray();
            }
            if cd.name == "jobId" {
                jobId = check part.getText();
            }
        }

        error? validErr = utils:requireUploadParts(fileBytes, jobId);
        if validErr is error {
            return utils:createBadRequest(validErr.message());
        }

        types:UploadCvResponse|error result = services:uploadAndParseCV(
                <byte[]>fileBytes, <string>jobId);
        if result is error {
            log:printError("CV upload failed", 'error = result);
            return utils:createInternalError(result.message());
        }
        return result;
    }

    // --- Start Exam Session ---
    resource function post candidates/[string candidateId]/start\-session(
            @http:Payload json payload)
            returns json|http:InternalServerError|error {
        map<json> d = <map<json>>payload;
        string jobId = d["jobId"].toString();
        string invitationId = d["invitationId"].toString();

        log:printInfo("Starting session", candidateId = candidateId, jobId = jobId);

        types:StartSessionResponse|error result = services:startSession(
                candidateId, invitationId, jobId);
        if result is error {
            log:printError("startSession failed", 'error = result, candidateId = candidateId);
            return utils:createInternalError(result.message());
        }
        return result;
    }

    // --- Submit Assessment ---
    resource function post candidates/[string candidateId]/evaluate(
            @http:Payload json payload)
            returns json|http:InternalServerError|error {
        types:SubmitAssessmentPayload|error parsed = payload.fromJsonWithType();
        if parsed is error {
            log:printError("Invalid assessment payload",
                    'error = parsed, candidateId = candidateId);
            return utils:createInternalError("Invalid payload: " + parsed.message());
        }

        log:printInfo("Assessment submitted", candidateId = candidateId,
                answers = parsed.answers.length());

        json|error result = services:submitAssessment(candidateId, parsed);
        if result is error {
            log:printError("submitAssessment failed",
                    'error = result, candidateId = candidateId);
            return utils:createInternalError(result.message());
        }
        return result;
    }

    // --- Reveal Identity ---
    resource function get candidates/[string candidateId]/reveal()
            returns json|http:InternalServerError|error {
        types:RevealResponse|error result = services:revealCandidate(candidateId);
        if result is error {
            log:printError("revealCandidate failed",
                    'error = result, candidateId = candidateId);
            return utils:createInternalError(result.message());
        }
        return result;
    }

    // --- Organization ---
    resource function post organizations(@http:Payload types:OrganizationRequest payload)
            returns json|http:InternalServerError {
        string|error orgId = repositories:createOrganization(
                payload.name, payload.industry, payload.size);
        if orgId is error {
            return utils:createInternalError(orgId.message());
        }
        error? recErr = repositories:createRecruiter(
                payload.userId, payload.userEmail, <string>orgId);
        if recErr is error {
            log:printWarn("createRecruiter failed", 'error = recErr);
        }
        return {"id": orgId, "name": payload.name};
    }

    resource function get me/organization(string userId)
            returns json|http:InternalServerError {
        types:OrganizationResponse|error org = repositories:getOrganizationByUser(userId);
        if org is error {
            return utils:createInternalError(org.message());
        }
        return org;
    }

    resource function put organization(@http:Payload json payload)
            returns json|http:InternalServerError {
        map<json> d = <map<json>>payload;
        error? err = repositories:updateOrganization(
                d["organizationId"].toString(), d["industry"].toString(), d["size"].toString());
        if err is error {
            return utils:createInternalError(err.message());
        }
        return {"status": "updated"};
    }

    // --- Jobs ---
    resource function get jobs(string userId)
            returns json|http:InternalServerError {
        // jobs.recruiter_id is a FK to recruiters.id (internal UUID), not user_id
        string|error recId = repositories:getRecruiterId(userId);
        if recId is error {
            return utils:createInternalError("Recruiter not found: " + recId.message());
        }
        json[]|error jobs = repositories:getJobsByRecruiter(<string>recId);
        if jobs is error {
            return utils:createInternalError(jobs.message());
        }
        return jobs;
    }

    resource function post jobs(@http:Payload types:JobRequest payload)
            returns json|http:InternalServerError {
        // Resolve internal recruiter UUID (recruiterId from frontend is the Asgardeo userId)
        string|error recId = repositories:getRecruiterId(payload.recruiterId);
        if recId is error {
            return utils:createInternalError("Recruiter not found: " + recId.message());
        }
        string|error id = repositories:createJob(
                payload.title, payload.description, payload.requiredSkills,
                payload.organizationId, <string>recId,
                payload.evaluationTemplateId);
        if id is error {
            return utils:createInternalError(id.message());
        }
        return {"id": id};
    }

    resource function put jobs/[string jobId](@http:Payload types:JobUpdateRequest payload)
            returns json|http:InternalServerError {
        error? err = repositories:updateJob(
                jobId, payload.title, payload.description, payload.requiredSkills, payload.evaluationTemplateId);
        if err is error {
            return utils:createInternalError(err.message());
        }
        return {"status": "updated"};
    }

    resource function delete jobs/[string jobId]()
            returns json|http:InternalServerError {
        error? err = repositories:deleteJob(jobId);
        if err is error {
            return utils:createInternalError(err.message());
        }
        return {"status": "deleted"};
    }

    // --- Questions ---
    resource function post jobs/questions(@http:Payload types:QuestionPayload payload)
            returns json|http:InternalServerError {
        foreach types:QuestionItem q in payload.questions {
            error? err = repositories:createJobQuestion(
                    q.jobId, q.questionText, q.sampleAnswer, q.keywords, q.'type);
            if err is error {
                return utils:createInternalError(err.message());
            }
        }
        return {"status": "created", "count": payload.questions.length()};
    }

    resource function get jobs/[string jobId]/questions()
            returns json|http:InternalServerError {
        types:QuestionItem[]|error qs = repositories:getJobQuestions(jobId);
        if qs is error {
            return utils:createInternalError(qs.message());
        }
        return <json>qs;
    }

    resource function put questions/[string questionId](
            @http:Payload types:QuestionUpdateRequest payload)
            returns json|http:InternalServerError {
        error? err = repositories:updateQuestion(
                questionId, payload.questionText, payload.sampleAnswer,
                payload.keywords, payload.'type);
        if err is error {
            return utils:createInternalError(err.message());
        }
        return {"status": "updated"};
    }

    resource function delete questions/[string questionId]()
            returns json|http:InternalServerError {
        error? err = repositories:deleteQuestion(questionId);
        if err is error {
            return utils:createInternalError(err.message());
        }
        return {"status": "deleted"};
    }

    // --- Invitations ---
    resource function get invitations(string userId)
            returns json|http:InternalServerError {
        string|error recId = repositories:getRecruiterId(userId);
        if recId is error {
            return utils:createInternalError("Recruiter not found: " + recId.message());
        }
        json[]|error result = repositories:getInvitationsByRecruiter(<string>recId);
        if result is error {
            return utils:createInternalError(result.message());
        }
        return result;
    }

    resource function post invitations(@http:Payload types:InvitationRequest payload)
            returns json|http:InternalServerError {
        string|error recId = repositories:getRecruiterId(payload.recruiterId);
        if recId is error {
            return utils:createInternalError(recId.message());
        }

        types:InvitationResponse|error inv = services:createInvitation(
                payload, <string>recId);
        if inv is error {
            return utils:createInternalError(inv.message());
        }

        types:InvitationResponse invVal = <types:InvitationResponse>inv;
        _ = start services:sendInvitationEmail(
                payload.candidateEmail, payload.candidateName,
                payload.jobTitle, invVal.magicLink);
        return inv;
    }

    resource function get invitations/validate/[string token]()
            returns json|http:InternalServerError {
        types:TokenValidationResponse|error result = services:validateToken(token);
        if result is error {
            return utils:createInternalError(result.message());
        }
        return result;
    }

    // --- Candidates Dashboard ---
    resource function get organizations/[string organizationId]/candidates()
            returns json|http:InternalServerError {
        types:CandidateResponse[]|error result = repositories:getCandidates(
                organizationId);
        if result is error {
            return utils:createInternalError(result.message());
        }
        return result;
    }

    // --- Decision ---
    resource function post candidates/[string candidateId]/decide(
            @http:Payload types:DecisionRequest payload)
            returns json|http:InternalServerError {

        // Step 1: Get evaluation scores (graceful — allow manual decisions even without scores)
        var evalResult = repositories:getCandidateEvaluation(candidateId);
        record {|decimal overallScore; decimal cvScore; decimal skillsScore; decimal interviewScore; string summaryFeedback;|} eval;
        if evalResult is error {
            log:printWarn("No evaluation found for candidate, defaulting to 0s",
                    candidateId = candidateId, 'error = evalResult);
            eval = {overallScore: 0d, cvScore: 0d, skillsScore: 0d, interviewScore: 0d, summaryFeedback: ""};
        } else {
            eval = evalResult;
        }

        // Step 2: Determine accept/reject based on explicit decision or threshold
        boolean pass = payload.decision == "accepted" ? true :
                       payload.decision == "rejected" ? false :
                       eval.overallScore >= payload.threshold;
        string newStatus = pass ? "accepted" : "rejected";

        // Step 3: Update database status — this is CRITICAL, fail fast if it errors
        error? updateErr = repositories:updateCandidateStatus(candidateId, newStatus);
        if updateErr is error {
            log:printError("CRITICAL: Status update failed — aborting decision",
                    'error = updateErr, candidateId = candidateId, newStatus = newStatus);
            return <http:InternalServerError>{body: {
                "error": "Failed to update candidate status: " + updateErr.message()
            }};
        }
        log:printInfo("Candidate status updated", candidateId = candidateId, newStatus = newStatus);

        // Step 4: Fetch contact info for email (graceful — email failure does not block the decision)
        boolean emailSent = false;
        var contact = repositories:getCandidateContact(candidateId);
        if contact is error {
            log:printWarn("Could not fetch contact info for email, skipping email",
                    candidateId = candidateId, 'error = contact);
        } else {
            if pass {
                string acceptanceMsg = "<p>We are pleased to inform you that you have successfully passed the technical evaluation for <strong>"
                        + contact.jobTitle + "</strong> and you are hired!</p>"
                        + "<p><strong>Your Evaluation Results:</strong><br>"
                        + "&#8226; CV/Resume Score: " + eval.cvScore.toString() + "/100<br>"
                        + "&#8226; Skills Assessment: " + eval.skillsScore.toString() + "/100<br>"
                        + "&#8226; Technical Interview: " + eval.interviewScore.toString() + "/100<br>"
                        + "&#8226; Overall Score: " + eval.overallScore.toString() + "/100</p>"
                        + "<p>Our recruitment team will be in touch shortly with the next steps.</p>";
                error? emailErr = services:sendAcceptanceEmail(
                        contact.candidateEmail, contact.candidateName, contact.jobTitle, acceptanceMsg);
                if emailErr is error {
                    log:printWarn("Acceptance email failed", 'error = emailErr, candidateId = candidateId);
                } else {
                    emailSent = true;
                    log:printInfo("Acceptance email sent", candidateId = candidateId, toEmail = contact.candidateEmail);
                }
            } else {
                string rejectionMsg = "<p>Thank you for your application and participation in our interview process. "
                        + "While your profile shows promise, we have decided to move forward with other candidates at this time.</p>"
                        + "<p><strong>Your Evaluation Results:</strong><br>"
                        + "&#8226; CV/Resume Score: " + eval.cvScore.toString() + "/100<br>"
                        + "&#8226; Skills Assessment: " + eval.skillsScore.toString() + "/100<br>"
                        + "&#8226; Technical Interview: " + eval.interviewScore.toString() + "/100<br>"
                        + "&#8226; Overall Score: " + eval.overallScore.toString() + "/100</p>"
                        + "<p>We appreciate your time and effort, and we encourage you to apply for future opportunities. "
                        + "Best of luck with your career journey!</p>";
                error? emailErr = services:sendRejectionEmail(
                        contact.candidateEmail, contact.candidateName, contact.jobTitle, rejectionMsg);
                if emailErr is error {
                    log:printWarn("Rejection email failed", 'error = emailErr, candidateId = candidateId);
                } else {
                    emailSent = true;
                    log:printInfo("Rejection email sent", candidateId = candidateId, toEmail = contact.candidateEmail);
                }
            }
        }

        // Step 5: Write audit log (best-effort — do not fail the response on audit errors)
        string auditAction = pass ? constants:AUDIT_CANDIDATE_ACCEPTED : constants:AUDIT_CANDIDATE_REJECTED;
        string|error orgIdResult = repositories:getOrganizationIdForCandidate(candidateId);
        if orgIdResult is string {
            error? auditErr = repositories:createAuditLog(
                    orgIdResult, (),
                    auditAction, "Candidate", candidateId,
                    {"newStatus": newStatus, "emailSent": emailSent, "overallScore": eval.overallScore});
            if auditErr is error {
                log:printWarn("Audit log write failed", 'error = auditErr, candidateId = candidateId);
            }
        } else {
            log:printWarn("Could not resolve org ID for audit log", candidateId = candidateId, 'error = orgIdResult);
        }

        return {
            candidateId: candidateId,
            pass: pass,
            emailSent: emailSent,
            status: newStatus,
            overallScore: eval.overallScore,
            cvScore: eval.cvScore,
            skillsScore: eval.skillsScore,
            interviewScore: eval.interviewScore
        };
    }

    // --- Transcript ---
    resource function get candidates/[string candidateId]/transcript()
            returns types:TranscriptResponse|http:InternalServerError {
        
        var transcriptResult = repositories:getCandidateTranscript(candidateId);
        if transcriptResult is error {
            log:printError("Failed to fetch transcript", 'error = transcriptResult, candidateId = candidateId);
            return utils:createInternalError("Failed to fetch candidate transcript");
        }

        string|error nameResult = repositories:getCandidateDisplayName(candidateId);
        string name = nameResult is error ? "Unknown Candidate" : nameResult;

        return {
            candidateId: candidateId,
            candidateName: name,
            transcript: transcriptResult
        };
    }

    // --- Evaluate CV Match ---
    resource function post candidates/[string candidateId]/evaluate\-cv()
            returns json|http:InternalServerError {
        json|error result = services:evaluateCandidateCv(candidateId);
        if result is error {
            return utils:createInternalError(result.message());
        }
        return {"status": "success"};
    }

    // --- Audit Logs ---
    resource function get organizations/[string organizationId]/audit\-logs()
            returns json|http:InternalServerError {
        json[]|error result = repositories:getAuditLogs(organizationId);
        if result is error {
            return utils:createInternalError(result.message());
        }
        return result;
    }

    // --- Evaluation Templates ---
    resource function get organizations/[string organizationId]/evaluation\-templates()
            returns json|http:InternalServerError {
        json[]|error result = repositories:getEvaluationTemplates(organizationId);
        if result is error {
            return utils:createInternalError(result.message());
        }
        return result;
    }

    resource function post evaluation\-templates(@http:Payload json payload)
            returns json|http:InternalServerError {
        map<json> d = <map<json>>payload;
        // Accept both snake_case (prompt_template) and camelCase (promptTemplate)
        string promptTemplate = d["prompt_template"] is () ? d["promptTemplate"].toString() : d["prompt_template"].toString();
        string templateType = d["type"] is () ? "QUESTIONNAIRE" : d["type"].toString();
        json|error result = repositories:createEvaluationTemplate(
                d["name"].toString(), d["description"].toString(), templateType,
                promptTemplate, d["organizationId"].toString());
        if result is error {
            return utils:createInternalError(result.message());
        }
        return result;
    }

    resource function put evaluation\-templates/[string id](@http:Payload json payload)
            returns json|http:InternalServerError {
        map<json> d = <map<json>>payload;
        string promptTemplate = d["prompt_template"] is () ? d["promptTemplate"].toString() : d["prompt_template"].toString();
        string templateType = d["type"] is () ? "QUESTIONNAIRE" : d["type"].toString();
        error? err = repositories:updateEvaluationTemplate(
                id, d["name"].toString(), d["description"].toString(), templateType,
                promptTemplate, d["organizationId"].toString());
        if err is error {
            return utils:createInternalError(err.message());
        }
        return {"status": "updated"};
    }

    resource function delete evaluation\-templates/[string id](@http:Payload json payload)
            returns json|http:InternalServerError {
        map<json> d = <map<json>>payload;
        error? err = repositories:deleteEvaluationTemplate(
                id, d["organizationId"].toString());
        if err is error {
            return utils:createInternalError(err.message());
        }
        return {"status": "deleted"};
    }

    // --- Legacy Cheat Flagging ---
    resource function post candidates/[string candidateId]/flag\-cheating(
            @http:Payload json payload)
            returns json|http:InternalServerError {
        log:printInfo("Legacy cheat flag received", candidateId = candidateId);
        map<json> d = <map<json>>payload;
        error? err = repositories:createAuditLog(
                d["organizationId"].toString(), (),
                constants:AUDIT_FLAG_LEGACY, "Candidate", candidateId,
                <map<json>>d["violations"]);
        if err is error {
            log:printError("createAuditLog failed for legacy flag",
                    'error = err, candidateId = candidateId);
            return utils:createInternalError(err.message());
        }
        return {"status": "flagged", "candidateId": candidateId};
    }
}
