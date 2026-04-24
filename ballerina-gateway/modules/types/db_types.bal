// ===========================================================================
// types/db_types.bal — Record types that map to Supabase database tables.
// Only database entity shapes live here. Never mix with API request/response.
// ===========================================================================

// ---------------------------------------------------------------------------
// Infrastructure Configs (passed to clients during init)
// ---------------------------------------------------------------------------

// Supabase REST connection configuration.
public type SupabaseConfig record {|
    string url;
    string key;
|};

// Cloudflare R2 bucket configuration.
public type R2Config record {|
    string accountId;
    string bucketName;
    string accessKeyId;
    string secretAccessKey;
    string region;
|};

// ---------------------------------------------------------------------------
// Database Entity Records
// ---------------------------------------------------------------------------

// Maps to `public.interview_invitations`.
public type InvitationRecord record {|
    string  id;
    string  candidate_email;
    string? candidate_name;
    string? job_title;
    string  organization_id;
    string  job_id;
    string  expires_at;
    string? used_at;
    string  status;
|};

// Maps to `public.exam_sessions`.
public type ExamSession record {|
    string id;
    string candidateId;
    string invitationId;
    string jobId;
    string status;
    string submissionType;
|};

// Maps to `public.grading_results` (per-answer AI evaluation).
public type GradingResult record {|
    string  sessionId;
    string  candidateId;
    string  questionId;
    string  redactedAnswer;
    int     score;
    string  feedback;
    boolean hfGatePassed;
    float?  hfRelevanceScore = ();
    string  geminiModel      = "gemini-flash-latest";
    int     gradingAttempt   = 1;
    boolean wasFlagged       = false;
|};

// Maps to `public.candidate_context_tags`.
public type ContextTags record {|
    string experienceLevel;
    json   detectedStack;
|};
