// ===========================================================================
// constants/constants.bal — All named constants for the EquiHire platform.
// NEVER use literal strings or numbers inline in service/repository files.
// Always reference a constant from this file instead.
// ===========================================================================

// ---------------------------------------------------------------------------
// Exam Session Statuses
// ---------------------------------------------------------------------------
public const string SESSION_IN_PROGRESS    = "in_progress";
public const string SESSION_SUBMITTED      = "submitted";
public const string SESSION_AUTO_SUBMITTED = "auto_submitted";
public const string SESSION_GRADING        = "grading";
public const string SESSION_GRADED         = "graded";
public const string SESSION_FLAGGED        = "flagged";

// Submission Types
public const string SUBMIT_MANUAL          = "manual";
public const string SUBMIT_TIMER_EXPIRED   = "timer_expired";
public const string SUBMIT_FOCUS_LOSS      = "focus_loss_limit";

// Cheat Event Types
public const string CHEAT_TAB_SWITCH       = "tab_switch";
public const string CHEAT_FOCUS_LOSS       = "focus_loss";
public const string CHEAT_PASTE_ATTEMPT    = "paste_attempt";
public const string CHEAT_RIGHT_CLICK      = "right_click";
public const string CHEAT_FULLSCREEN_EXIT  = "fullscreen_exit";
public const string CHEAT_DEVTOOLS_OPEN    = "devtools_open";
public const string CHEAT_COPY_ATTEMPT     = "copy_attempt";

// Candidate / Invitation Statuses
public const string STATUS_PENDING         = "pending";
public const string STATUS_ACCEPTED        = "accepted";
public const string STATUS_REJECTED        = "rejected";
public const string STATUS_SHORTLISTED     = "shortlisted";
public const string STATUS_EXPIRED         = "expired";
public const string STATUS_SCREENING       = "screening";

// Experience Levels
public const string LEVEL_JUNIOR           = "Junior";
public const string LEVEL_MID              = "Mid-Level";
public const string LEVEL_SENIOR           = "Senior";
public const string LEVEL_LEAD             = "Lead";
public const string LEVEL_UNKNOWN          = "Unknown";

// AI Models
public const string GEMINI_MODEL           = "gemini-flash-latest";
public const string HF_ZERO_SHOT_MODEL     = "facebook/bart-large-mnli";

// HuggingFace Relevance Gate
public const float  HF_RELEVANCE_THRESHOLD = 0.45;
public const string HF_LABEL_RELEVANT      = "relevant";
public const string HF_LABEL_IRRELEVANT    = "irrelevant";

// Grading Score Bounds
public const int    MAX_SCORE              = 10;
public const int    MIN_SCORE              = 0;
public const int    AUTO_ZERO_SCORE        = 0;

// Score Scaling (interview score: 0-10 -> 0-100)
public const float  SCORE_SCALE_FACTOR     = 10.0;
public const float  PASS_THRESHOLD         = 60.0;

// Invitation Expiry
public const int    INVITATION_TTL_SECONDS = 604800; // 7 days

// Auto-zero Feedback
public const string AUTO_ZERO_FEEDBACK     = "Answer was deemed irrelevant to the question context by automated safety checks and received a score of 0.";
public const string GRADING_FAILED_FEEDBACK = "AI automated grading failed format requirements. Flagged for manual review.";

// Audit Log Action Types
public const string AUDIT_CREATE_JOB            = "Create Job";
public const string AUDIT_SEND_INVITATION       = "Send Invitation";
public const string AUDIT_SUBMIT_ASSESSMENT     = "Submit Assessment";
public const string AUDIT_CREATE_TEMPLATE       = "Create Evaluation Template";
public const string AUDIT_FLAG_LEGACY           = "Lockdown Violation (Legacy)";
public const string AUDIT_CANDIDATE_ACCEPTED    = "Candidate Accepted";
public const string AUDIT_CANDIDATE_REJECTED    = "Candidate Rejected";
public const string AUDIT_CANDIDATE_STATUS_CHANGE = "Candidate Status Changed";
public const string AUDIT_TRANSCRIPT_GENERATED = "Transcript Viewed";
public const string AUDIT_CV_ACCESSED          = "CV Accessed";
public const string AUDIT_ASSESSMENT_UPDATED   = "Assessment Updated";
public const string AUDIT_JOB_UPDATED          = "Job Updated";
public const string AUDIT_JOB_DELETED          = "Job Deleted";
public const string AUDIT_TEMPLATE_UPDATED     = "Template Updated";
public const string AUDIT_TEMPLATE_DELETED     = "Template Deleted";
public const string AUDIT_ORGANIZATION_UPDATED = "Organization Updated";
public const string AUDIT_INVITATION_ACCEPTED  = "Invitation Accepted";
public const string AUDIT_CV_UPLOADED          = "CV Uploaded";
public const string AUDIT_SESSION_STARTED      = "Session Started";

