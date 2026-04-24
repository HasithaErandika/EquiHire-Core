// ===========================================================================
// types/response_types.bal — Outgoing HTTP response record types.
// Only outbound API payload shapes live here.
// ===========================================================================

// Organization details.
public type OrganizationResponse record {|
    string id;
    string name;
    string industry;
    string size;
|};

// Job creation response.
public type JobResponse record {|
    string id;
|};

// Invitation creation response.
public type InvitationResponse record {|
    string id;
    string token;
    string magicLink;
    string candidateEmail;
    string expiresAt;
|};

// Token validation response (returned when a candidate clicks their link).
public type TokenValidationResponse record {|
    boolean valid;
    string? candidateEmail = ();
    string? candidateName = ();
    string? jobTitle = ();
    string? organizationId = ();
    string? jobId = ();
    string? invitationId = ();
    string? message = ();
|};

// CV upload response (after PDF extraction and parsing).
public type UploadCvResponse record {|
    string status;
    string candidateId;
    string r2Key;
    json parsed;
|};

// Identity reveal response.
public type RevealResponse record {|
    string? url;
    string status;
|};

// Exam session start response.
public type StartSessionResponse record {|
    string sessionId;
    string status;
|};

// Recruiter dashboard candidate record.
public type CandidateResponse record {|
    string candidateId;
    string jobTitle;
    string candidateName;
    string status;
    decimal score;
    string appliedDate;
    boolean seen = false;
    decimal cvScore = 0d;
    decimal skillsScore = 0d;
    decimal interviewScore = 0d;
    string? summaryFeedback = ();
    string? experienceLevel = ();
    string[] detectedStack = [];
    int hfRelevanceSkipped = 0;
    int cheatEventCount = 0;
    string[] cheatEventTypes = [];
    string? cvText = ();
    json? education = ();
    json? workExperience = ();
    json? projects = ();
|};

// Pass/fail decision response — matches the actual /candidates/{id}/decide response.
public type DecisionResponse record {|
    string candidateId;
    boolean pass;
    boolean emailSent;
    string status;
    decimal overallScore;
    decimal cvScore;
    decimal skillsScore;
    decimal interviewScore;
    string message;
|};
// Transcript item (question + answer details for recruiter review).
public type TranscriptItem record {|
    string questionText;
    string questionType;
    string sampleAnswer;
    string redactedAnswer;
    int score;
    string feedback;
    boolean hfGatePassed;
    boolean wasFlagged;
|};

// Transcript response.
public type TranscriptResponse record {|
    string candidateId;
    string candidateName;
    string candidateEmail;
    string jobTitle;
    string appliedDate;
    float overallScore;
    float cvScore;
    float skillsScore;
    float interviewScore;
    string summaryFeedback;
    TranscriptItem[] transcript;
    json education;
    json workExperience;
    json projects;
    json technicalSkills;
    json achievements;
    json certificates;
    string phone;
|};
