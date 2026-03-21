// ===========================================================================
// types/response_types.bal — Outgoing HTTP response record types.
// Only outbound API payload shapes live here.
// ===========================================================================

// Standard API response wrapper — use this for EVERY endpoint response.
public type ApiResponse record {|
    boolean success;
    string message;
    json? data = ();
    string? 'error = ();
|};

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

// Pre-signed R2 URL response (for direct client-side uploads).
public type UploadUrlResponse record {|
    string uploadUrl;
    string candidateId;
    string objectKey;
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

// Direct Gemini evaluation response (for /evaluate endpoint).
public type EvaluationResponse record {|
    string redactedAnswer;
    decimal score;
    string feedback;
    boolean piiDetected;
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

// Pass/fail decision response.
public type DecisionResponse record {|
    string candidateId;
    boolean pass;
    boolean emailSent;
    string message;
|};
