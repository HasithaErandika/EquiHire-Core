// ===========================================================================
// types/request_types.bal — Incoming HTTP payload record types.
// Only inbound API payload shapes live here.
// ===========================================================================

// Registers a new organization and an admin user.
public type OrganizationRequest record {|
    string name;
    string industry;
    string size;
    string userEmail;
    string userId;
|};

// Creates a new job posting.
public type JobRequest record {
    string title;
    string description;
    string[] requiredSkills;
    string organizationId;
    string recruiterId;
    string? evaluationTemplateId = ();
};

// Updates an existing job posting.
public type JobUpdateRequest record {
    string title;
    string description;
    string[] requiredSkills;
    string? evaluationTemplateId = ();
    string? organizationId = ();   // Optional: used for audit logging
    string? recruiterId = ();      // Optional: used for audit logging
};

// Bulk-creates questions for a job.
public type QuestionPayload record {
    QuestionItem[] questions;
};

// A single interview question.
public type QuestionItem record {
    string? id = ();
    string jobId;
    string questionText;
    string sampleAnswer;
    string[] keywords;
    string 'type = "paragraph";
};

// Updates an existing question.
public type QuestionUpdateRequest record {
    string questionText;
    string sampleAnswer;
    string[] keywords;
    string 'type = "paragraph";
};

// Invites a candidate to a blind interview.
public type InvitationRequest record {
    string candidateEmail;
    string candidateName;
    string jobTitle;
    string? interviewDate;
    string organizationId;
    string recruiterId;
    string jobId;
};
    
public type StartSessionRequest record {
    string jobId;
    string invitationId;
};

// Full assessment submission payload.
public type SubmitAssessmentPayload record {
    string jobId;
    string sessionId;
    string invitationId;
    string submissionType = "manual";
    AnswerSubmission[] answers;
    CheatEventItem[] cheatEvents;
};

// A single candidate answer.
public type AnswerSubmission record {|
    string questionId;
    string answerText;
    int? timeSpentSeconds = ();
|};

// A single browser lockdown violation event.
public type CheatEventItem record {|
    string eventType;
    string occurredAt;
    json? details = ();
|};

// Pass/fail decision by recruiter.
public type DecisionRequest record {|
    string decision; // 'accepted' or 'rejected'
|};
