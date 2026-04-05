-- ============================================================
-- EquiHire-Core — Full Database Schema
-- Version: 3.0 (Clean Rebuild)
-- Last Updated: 2026-04-05
--
-- INSTRUCTIONS:
--   This script drops ALL existing EquiHire tables and rebuilds
--   from scratch. Safe to run on a fresh or existing database.
--   Run in Supabase SQL Editor or via psql.
-- ============================================================


-- ============================================================
-- SECTION 0: TEARDOWN — Drop everything in dependency order
-- ============================================================

-- Drop views first (no dependencies on them from tables)
DROP VIEW  IF EXISTS public.recruiter_candidate_view CASCADE;

-- Drop tables will CASCADE and automatically remove these triggers.

-- Drop functions
DROP FUNCTION IF EXISTS public.increment_hf_skipped()    CASCADE;
DROP FUNCTION IF EXISTS public.increment_cheat_count()   CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.expire_old_invitations()  CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.grading_results        CASCADE;
DROP TABLE IF EXISTS public.raw_answer_vault       CASCADE;
DROP TABLE IF EXISTS public.cheat_events           CASCADE;
DROP TABLE IF EXISTS public.exam_sessions          CASCADE;
DROP TABLE IF EXISTS public.candidate_context_tags CASCADE;
DROP TABLE IF EXISTS public.pii_entity_maps        CASCADE;
DROP TABLE IF EXISTS public.cv_parsed_sections     CASCADE;
DROP TABLE IF EXISTS public.candidate_answers      CASCADE;
DROP TABLE IF EXISTS public.evaluation_results     CASCADE;
DROP TABLE IF EXISTS public.audit_logs             CASCADE;
DROP TABLE IF EXISTS public.anonymous_profiles     CASCADE;
DROP TABLE IF EXISTS public.secure_identities      CASCADE;
DROP TABLE IF EXISTS public.questions              CASCADE;
DROP TABLE IF EXISTS public.interview_invitations  CASCADE;
DROP TABLE IF EXISTS public.jobs                   CASCADE;
DROP TABLE IF EXISTS public.evaluation_templates   CASCADE;
DROP TABLE IF EXISTS public.recruiters             CASCADE;
DROP TABLE IF EXISTS public.organizations          CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- SECTION 1: CORE IDENTITY TABLES
-- Organizations → Recruiters
-- ============================================================

CREATE TABLE public.organizations (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    industry    VARCHAR(100),
    size        VARCHAR(50),
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE public.recruiters (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL,           -- Asgardeo subject ID
    email           VARCHAR(255) NOT NULL UNIQUE,
    full_name       VARCHAR(255),
    organization_id UUID         REFERENCES public.organizations(id) ON DELETE SET NULL,
    role            VARCHAR(50)  DEFAULT 'recruiter', -- 'admin' | 'hiring_manager' | 'recruiter'
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiters    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own org"
ON public.organizations FOR SELECT USING (
    id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

CREATE POLICY "Recruiters can view org profiles"
ON public.recruiters FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_recruiters_org ON public.recruiters(organization_id);


-- ============================================================
-- SECTION 2: EVALUATION TEMPLATES
-- Reusable Gemini prompt templates per organization
-- ============================================================

CREATE TABLE public.evaluation_templates (
    id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    type             VARCHAR(50)  DEFAULT 'QUESTIONNAIRE', -- 'CV_SCREENING' | 'QUESTIONNAIRE'
    prompt_template  TEXT         NOT NULL,
    is_system_template BOOLEAN    DEFAULT false,
    organization_id  UUID         REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ  DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system templates"
ON public.evaluation_templates FOR SELECT USING (is_system_template = true);

CREATE POLICY "Recruiters can view org templates"
ON public.evaluation_templates FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

CREATE POLICY "Recruiters can create templates"
ON public.evaluation_templates FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    AND is_system_template = false
);

CREATE POLICY "Recruiters can update org templates"
ON public.evaluation_templates FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    AND is_system_template = false
);

CREATE POLICY "Recruiters can delete org templates"
ON public.evaluation_templates FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    AND is_system_template = false
);


-- ============================================================
-- SECTION 3: JOBS
-- ============================================================

CREATE TABLE public.jobs (
    id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    title                 VARCHAR(255) NOT NULL,
    description           TEXT,
    organization_id       UUID         REFERENCES public.organizations(id) ON DELETE CASCADE,
    recruiter_id          UUID         REFERENCES public.recruiters(id) ON DELETE SET NULL,
    evaluation_template_id UUID        REFERENCES public.evaluation_templates(id) ON DELETE SET NULL,
    required_skills       JSONB,       -- e.g. ["Python", "Django", "REST API"]
    created_at            TIMESTAMPTZ  DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view org jobs"
ON public.jobs FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

CREATE POLICY "Recruiters can create jobs"
ON public.jobs FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

CREATE POLICY "Recruiters can update jobs"
ON public.jobs FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

CREATE POLICY "Recruiters can delete jobs"
ON public.jobs FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_jobs_org      ON public.jobs(organization_id);
CREATE INDEX idx_jobs_recruiter ON public.jobs(recruiter_id);


-- ============================================================
-- SECTION 4: QUESTIONS
-- Per-job interview questions with model answers
-- ============================================================

CREATE TABLE public.questions (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id        UUID         REFERENCES public.jobs(id) ON DELETE CASCADE,
    question_text TEXT         NOT NULL,
    sample_answer TEXT,
    keywords      JSONB,       -- e.g. ["recursion", "Big-O", "memoization"]
    type          VARCHAR(50)  DEFAULT 'paragraph', -- 'paragraph' | 'code'
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Helper subquery used by all question policies
-- Recruiters can manage questions for jobs in their org
CREATE POLICY "Recruiters can view questions"
ON public.questions FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Recruiters can insert questions"
ON public.questions FOR INSERT WITH CHECK (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Recruiters can update questions"
ON public.questions FOR UPDATE USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Recruiters can delete questions"
ON public.questions FOR DELETE USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

-- Candidates need to read questions during their exam session (via service role)
-- No direct candidate RLS needed — Ballerina backend uses service role key

-- Indexes
CREATE INDEX idx_questions_job ON public.questions(job_id);


-- ============================================================
-- SECTION 5: INTERVIEW INVITATIONS
-- Magic-link tokens for candidate auth (UUID v4, cryptographically random)
-- ============================================================

CREATE TABLE public.interview_invitations (
    id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    token            VARCHAR(255) UNIQUE NOT NULL,  -- uuid_generate_v4() via Ballerina
    candidate_email  VARCHAR(255) NOT NULL,
    candidate_name   VARCHAR(255),
    recruiter_id     UUID         REFERENCES public.recruiters(id) ON DELETE SET NULL,
    organization_id  UUID         REFERENCES public.organizations(id) ON DELETE CASCADE,
    job_id           UUID         REFERENCES public.jobs(id) ON DELETE CASCADE,
    job_title        VARCHAR(255),
    interview_date   TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ  NOT NULL,
    used_at          TIMESTAMPTZ,                   -- set atomically at session-start, not link-click
    status           VARCHAR(50)  DEFAULT 'pending', -- 'pending' | 'accepted' | 'expired'
    created_at       TIMESTAMPTZ  DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.interview_invitations ENABLE ROW LEVEL SECURITY;

-- Recruiters manage invitations for their org
CREATE POLICY "Recruiters can view org invitations"
ON public.interview_invitations FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

CREATE POLICY "Recruiters can create invitations"
ON public.interview_invitations FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

CREATE POLICY "Recruiters can update invitations"
ON public.interview_invitations FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

-- NOTE: Token validation is handled by the Ballerina backend via service role key.
-- No public SELECT policy is needed or safe here.

-- Indexes
CREATE INDEX idx_invitations_org     ON public.interview_invitations(organization_id);
CREATE INDEX idx_invitations_job     ON public.interview_invitations(job_id);
CREATE INDEX idx_invitations_email   ON public.interview_invitations(candidate_email);
CREATE INDEX idx_invitations_expires ON public.interview_invitations(expires_at);

-- Partial index on hot path: invitation validation only ever queries pending tokens
CREATE UNIQUE INDEX idx_invitations_token_status
    ON public.interview_invitations(token, status)
    WHERE status = 'pending';


-- ============================================================
-- SECTION 6: ANONYMOUS PROFILES
-- Candidate identity stripped of PII — all recruiter-facing data
-- ============================================================

CREATE TABLE public.anonymous_profiles (
    candidate_id  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID        REFERENCES public.interview_invitations(id) ON DELETE CASCADE,
    job_id        UUID        REFERENCES public.jobs(id) ON DELETE CASCADE,
    skills        JSONB,      -- extracted technical skills from CV
    status        VARCHAR(50) DEFAULT 'applied',
    -- 'applied' | 'categorized' | 'screening' | 'shortlisted' | 'rejected' | 'accepted'
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.anonymous_profiles ENABLE ROW LEVEL SECURITY;

-- INSERT: Ballerina backend (service role) creates candidate profiles during CV upload
CREATE POLICY "System can insert candidate profiles"
ON public.anonymous_profiles FOR INSERT WITH CHECK (true);

-- SELECT: Ballerina backend (service role) reads profiles; USING(true) is safe because
--         the gateway enforces org-scoping before any DB call reaches this table
CREATE POLICY "System can read candidate profiles"
ON public.anonymous_profiles FOR SELECT USING (true);

-- UPDATE: Recruiters update status (shortlist/reject/accept) for their org's candidates only
CREATE POLICY "Recruiters can update org candidate profiles"
ON public.anonymous_profiles FOR UPDATE USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

-- Indexes
CREATE INDEX idx_anon_profiles_job        ON public.anonymous_profiles(job_id);
CREATE INDEX idx_anon_profiles_invitation ON public.anonymous_profiles(invitation_id);


-- ============================================================
-- SECTION 7: SECURE IDENTITIES
-- R2 object keys tied to real candidate name/email (vault)
-- Never exposed to recruiters until explicit reveal
-- ============================================================

CREATE TABLE public.secure_identities (
    candidate_id   UUID          PRIMARY KEY REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    r2_object_key  VARCHAR(1024) NOT NULL,   -- Cloudflare R2 path to candidate's CV PDF
    created_at     TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.secure_identities ENABLE ROW LEVEL SECURITY;

-- INSERT: Service role only (during CV upload pipeline)
CREATE POLICY "System can insert secure identities"
ON public.secure_identities FOR INSERT WITH CHECK (true);

-- SELECT: Org-scoped recruiter read — only after explicit reveal action
CREATE POLICY "Recruiters in org can read secure identities"
ON public.secure_identities FOR SELECT USING (
    candidate_id IN (
        SELECT ap.candidate_id FROM public.anonymous_profiles ap
        JOIN public.jobs j ON j.id = ap.job_id
        WHERE j.organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

-- No UPDATE or DELETE policy — R2 keys are immutable once written


-- ============================================================
-- SECTION 8: CV PARSED SECTIONS
-- Structured output from Gemini CV parse call (one row per candidate)
-- ============================================================

CREATE TABLE public.cv_parsed_sections (
    id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id     UUID          REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    invitation_id    UUID          REFERENCES public.interview_invitations(id) ON DELETE CASCADE,
    job_id           UUID          REFERENCES public.jobs(id) ON DELETE CASCADE,

    -- Raw text extracted by Apache PDFBox before Gemini sees it
    raw_text         TEXT,

    -- Structured sections returned by Gemini in a single JSON call
    education        JSONB,  -- [{ institution, degree, gpa, dates }]
    work_experience  JSONB,  -- [{ role, org, duration, bullets }]
    projects         JSONB,  -- [{ name, tech, outcome, dates }]
    achievements     JSONB,  -- [{ title, issuer, year }]
    technical_skills JSONB,  -- [{ language, framework, tool }]
    certificates     JSONB,  -- [{ name, issuer, year }]

    r2_object_key    VARCHAR(1024),
    parsed_at        TIMESTAMPTZ   DEFAULT NOW(),
    parser_version   VARCHAR(20)   DEFAULT 'v3.0'
);

ALTER TABLE public.cv_parsed_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view cv sections for their org"
ON public.cv_parsed_sections FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "System can insert cv sections"
ON public.cv_parsed_sections FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_cv_sections_candidate ON public.cv_parsed_sections(candidate_id);
CREATE INDEX idx_cv_sections_job       ON public.cv_parsed_sections(job_id);


-- ============================================================
-- SECTION 9: PII ENTITY MAPS
-- Redaction map built by Gemini during CV parse
-- SERVICE ROLE ONLY — never exposed to any recruiter endpoint
-- ============================================================

CREATE TABLE public.pii_entity_maps (
    id            UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id  UUID  UNIQUE REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,

    -- Entity list from Gemini CV parse response
    -- e.g. [{ "token": "Hasitha Erandika", "label": "CANDIDATE_NAME" },
    --        { "token": "SLIIT",            "label": "UNIVERSITY"     }]
    entities      JSONB NOT NULL DEFAULT '[]',

    -- Flat map used by Ballerina string:replaceAll during answer grading
    -- e.g. { "Hasitha Erandika": "[CANDIDATE_NAME]", "SLIIT": "[UNIVERSITY]" }
    redaction_map JSONB NOT NULL DEFAULT '{}',

    created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pii_entity_maps ENABLE ROW LEVEL SECURITY;

-- INSERT only — no SELECT policy means RLS blocks all direct reads
-- Ballerina backend bypasses RLS using the service role key
CREATE POLICY "System can insert pii maps"
ON public.pii_entity_maps FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_pii_map_candidate ON public.pii_entity_maps(candidate_id);


-- ============================================================
-- SECTION 10: CANDIDATE CONTEXT TAGS
-- Experience level and tech stack extracted by Gemini (one row per candidate)
-- ============================================================

CREATE TABLE public.candidate_context_tags (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id         UUID        UNIQUE REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    job_id               UUID        REFERENCES public.jobs(id) ON DELETE CASCADE,

    -- From Gemini CV parse — 'junior' | 'mid-level' | 'senior'
    experience_level     VARCHAR(20) NOT NULL,

    -- Technologies detected from CV text by Gemini
    -- e.g. ["React", "Python", "Ballerina", "Supabase"]
    detected_stack       JSONB       NOT NULL DEFAULT '[]',

    -- Estimated years of experience from CV date ranges
    estimated_years      FLOAT,

    -- Counter: how many exam answers were auto-zeroed by the HF relevance gate
    -- Incremented by trigger trg_increment_hf_skipped; high value = suspicious candidate
    hf_relevance_skipped INTEGER     DEFAULT 0,

    created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.candidate_context_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view context tags for their org"
ON public.candidate_context_tags FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "System can insert context tags"
ON public.candidate_context_tags FOR INSERT WITH CHECK (true);

-- UPDATE needed for the trg_increment_hf_skipped trigger
CREATE POLICY "System can update context tags"
ON public.candidate_context_tags FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_context_tags_candidate ON public.candidate_context_tags(candidate_id);
CREATE INDEX idx_context_tags_job       ON public.candidate_context_tags(job_id);


-- ============================================================
-- SECTION 11: EXAM SESSIONS
-- One row per candidate per job sitting
-- ============================================================

CREATE TABLE public.exam_sessions (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id     UUID        REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    invitation_id    UUID        REFERENCES public.interview_invitations(id) ON DELETE CASCADE,
    job_id           UUID        REFERENCES public.jobs(id) ON DELETE CASCADE,

    status           VARCHAR(30) DEFAULT 'in_progress',
    -- 'in_progress' | 'submitted' | 'auto_submitted' | 'grading' | 'graded' | 'flagged'

    started_at       TIMESTAMPTZ DEFAULT NOW(),
    submitted_at     TIMESTAMPTZ,
    graded_at        TIMESTAMPTZ,

    submission_type  VARCHAR(20) DEFAULT 'manual',
    -- 'manual' | 'timer_expired' | 'focus_loss_limit'

    cheat_event_count    INTEGER DEFAULT 0,
    is_flagged_cheating  BOOLEAN DEFAULT false
);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view sessions for their org"
ON public.exam_sessions FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "System can insert sessions"
ON public.exam_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update sessions"
ON public.exam_sessions FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_exam_sessions_candidate ON public.exam_sessions(candidate_id);
CREATE INDEX idx_exam_sessions_job       ON public.exam_sessions(job_id);
CREATE INDEX idx_exam_sessions_status    ON public.exam_sessions(status);


-- ============================================================
-- SECTION 12: CHEAT EVENTS
-- Individual anti-cheat violation records per session
-- ============================================================

CREATE TABLE public.cheat_events (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id   UUID        REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    candidate_id UUID        REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,

    event_type   VARCHAR(50) NOT NULL,
    -- 'tab_switch' | 'focus_loss' | 'paste_attempt' |
    -- 'right_click' | 'fullscreen_exit' | 'devtools_open'

    occurred_at  TIMESTAMPTZ DEFAULT NOW(),
    details      JSONB       -- optional extra context (e.g. { "tab_url": "..." })
);

ALTER TABLE public.cheat_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view cheat events for their org"
ON public.cheat_events FOR SELECT USING (
    candidate_id IN (
        SELECT ap.candidate_id FROM public.anonymous_profiles ap
        JOIN public.jobs j ON j.id = ap.job_id
        WHERE j.organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "System can insert cheat events"
ON public.cheat_events FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_cheat_events_session   ON public.cheat_events(session_id);
CREATE INDEX idx_cheat_events_candidate ON public.cheat_events(candidate_id);
CREATE INDEX idx_cheat_events_type      ON public.cheat_events(event_type);


-- ============================================================
-- SECTION 13: RAW ANSWER VAULT
-- Unredacted candidate answers — SERVICE ROLE ONLY
-- Must be written BEFORE any AI call to prevent data loss
-- ============================================================

CREATE TABLE public.raw_answer_vault (
    id                 UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id         UUID    REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    candidate_id       UUID    REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    question_id        UUID    REFERENCES public.questions(id) ON DELETE CASCADE,

    -- Original unredacted answer — NEVER returned to any recruiter endpoint
    raw_answer_text    TEXT    NOT NULL,

    -- Did the HuggingFace relevance gate run on this answer?
    -- false = HF returned 503/timeout; gate was skipped; went straight to Gemini
    hf_checked         BOOLEAN DEFAULT false,

    time_spent_seconds INTEGER,
    word_count         INTEGER,

    saved_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.raw_answer_vault ENABLE ROW LEVEL SECURITY;

-- INSERT + UPDATE only — no SELECT policy (service role only)
-- Only redacted answers from grading_results are ever shown to recruiters
CREATE POLICY "System can insert raw answers"
ON public.raw_answer_vault FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update raw answers"
ON public.raw_answer_vault FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_raw_vault_session   ON public.raw_answer_vault(session_id);
CREATE INDEX idx_raw_vault_candidate ON public.raw_answer_vault(candidate_id);
CREATE INDEX idx_raw_vault_question  ON public.raw_answer_vault(question_id);


-- ============================================================
-- SECTION 14: GRADING RESULTS
-- Per-question AI grading output (redacted) — recruiter-visible
-- ============================================================

CREATE TABLE public.grading_results (
    id                 UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id         UUID     REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    candidate_id       UUID     REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    question_id        UUID     REFERENCES public.questions(id) ON DELETE CASCADE,

    -- Redacted answer shown to recruiter — PII stripped via pii_entity_maps
    redacted_answer    TEXT     NOT NULL,

    -- Score from Gemini: 0-10
    score              INTEGER  NOT NULL CHECK (score >= 0 AND score <= 10),
    feedback           TEXT,

    -- HuggingFace relevance gate outcome
    -- hf_gate_passed = false → score forced to 0, Gemini was NOT called
    -- hf_relevance_score = null → gate was skipped (503 fallback)
    hf_gate_passed     BOOLEAN  DEFAULT true,
    hf_relevance_score FLOAT,

    -- Grading metadata
    gemini_model       VARCHAR(50) DEFAULT 'gemini-2.5-flash',
    grading_attempt    INTEGER     DEFAULT 1,  -- 2 = retry after JSON schema validation failure
    was_flagged        BOOLEAN     DEFAULT false,

    graded_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.grading_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view grading results for their org"
ON public.grading_results FOR SELECT USING (
    candidate_id IN (
        SELECT ap.candidate_id FROM public.anonymous_profiles ap
        JOIN public.jobs j ON j.id = ap.job_id
        WHERE j.organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "System can insert grading results"
ON public.grading_results FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update grading results"
ON public.grading_results FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_grading_results_session   ON public.grading_results(session_id);
CREATE INDEX idx_grading_results_candidate ON public.grading_results(candidate_id);
CREATE INDEX idx_grading_results_question  ON public.grading_results(question_id);

-- Composite index for the recruiter candidate view query
CREATE INDEX idx_grading_results_candidate_job ON public.grading_results(candidate_id);


-- ============================================================
-- SECTION 15: CANDIDATE ANSWERS (Legacy Metrics Table)
-- Simple answer store kept for backward compatibility.
-- Primary grading data lives in grading_results.
-- ============================================================

CREATE TABLE public.candidate_answers (
    id                 UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id       UUID  REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    question_id        UUID  REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text        TEXT,
    correctness_score  FLOAT CHECK (correctness_score >= 0 AND correctness_score <= 100),
    difficulty_perceived VARCHAR(50), -- 'easy' | 'medium' | 'hard'
    ai_feedback        TEXT,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.candidate_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view candidate answers for their org"
ON public.candidate_answers FOR SELECT USING (
    question_id IN (
        SELECT q.id FROM public.questions q
        JOIN public.jobs j ON j.id = q.job_id
        WHERE j.organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "System can insert candidate answers"
ON public.candidate_answers FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_candidate_answers_candidate ON public.candidate_answers(candidate_id);
CREATE INDEX idx_candidate_answers_question  ON public.candidate_answers(question_id);


-- ============================================================
-- SECTION 16: EVALUATION RESULTS
-- Aggregate scores per candidate per job (cv + skills + interview)
-- ============================================================

CREATE TABLE public.evaluation_results (
    id                 UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id       UUID  REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    job_id             UUID  REFERENCES public.jobs(id) ON DELETE CASCADE,

    -- Component scores (0-100 scale)
    cv_score           FLOAT CHECK (cv_score       >= 0 AND cv_score       <= 100),
    skills_score       FLOAT CHECK (skills_score   >= 0 AND skills_score   <= 100),
    interview_score    FLOAT CHECK (interview_score >= 0 AND interview_score <= 100),

    -- Weighted overall: cv*0.3 + skills*0.2 + interview*0.5
    overall_score      FLOAT CHECK (overall_score  >= 0 AND overall_score  <= 100),

    summary_feedback   TEXT,
    recommended_status VARCHAR(50), -- 'accepted' | 'rejected' | 'pending'

    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate evaluation rows for the same candidate+job
ALTER TABLE public.evaluation_results
    ADD CONSTRAINT unique_candidate_per_job UNIQUE (candidate_id, job_id);

ALTER TABLE public.evaluation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view evaluation results for their org"
ON public.evaluation_results FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    )
);

CREATE POLICY "System can insert evaluation results"
ON public.evaluation_results FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update evaluation results"
ON public.evaluation_results FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_eval_results_candidate     ON public.evaluation_results(candidate_id);
CREATE INDEX idx_eval_results_job           ON public.evaluation_results(job_id);
CREATE INDEX idx_eval_results_candidate_job ON public.evaluation_results(candidate_id, job_id);


-- ============================================================
-- SECTION 17: AUDIT LOGS
-- Full immutable audit trail of all system and recruiter actions
-- ============================================================

CREATE TABLE public.audit_logs (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID         REFERENCES public.organizations(id) ON DELETE CASCADE,
    recruiter_id    UUID         REFERENCES public.recruiters(id) ON DELETE SET NULL,
    action_type     VARCHAR(100) NOT NULL,
    -- e.g. 'INVITATION_SENT' | 'CV_PARSED' | 'EXAM_SUBMITTED' |
    --      'HIRING_DECISION' | 'IDENTITY_REVEALED' | 'CHEAT_FLAGGED'
    entity_type     VARCHAR(100) NOT NULL,  -- 'candidate' | 'job' | 'invitation'
    entity_id       UUID,
    details         JSONB,       -- full decision record or event metadata
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view audit logs for their org"
ON public.audit_logs FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_audit_logs_org        ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_entity     ON public.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_action     ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);


-- ============================================================
-- SECTION 18: FUNCTIONS AND TRIGGERS
-- ============================================================

-- Auto-update updated_at on any table that has the column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluation_templates_updated_at
    BEFORE UPDATE ON public.evaluation_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interview_invitations_updated_at
    BEFORE UPDATE ON public.interview_invitations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Auto-increment exam_sessions.cheat_event_count on each new cheat event
CREATE OR REPLACE FUNCTION public.increment_cheat_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.exam_sessions
    SET cheat_event_count = cheat_event_count + 1
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_cheat_count
    AFTER INSERT ON public.cheat_events
    FOR EACH ROW EXECUTE FUNCTION public.increment_cheat_count();


-- Auto-increment candidate_context_tags.hf_relevance_skipped
-- when an answer fails the HuggingFace relevance gate (hf_gate_passed = false)
CREATE OR REPLACE FUNCTION public.increment_hf_skipped()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hf_gate_passed = false THEN
        UPDATE public.candidate_context_tags
        SET hf_relevance_skipped = hf_relevance_skipped + 1
        WHERE candidate_id = NEW.candidate_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_hf_skipped
    AFTER INSERT ON public.grading_results
    FOR EACH ROW EXECUTE FUNCTION public.increment_hf_skipped();


-- Utility function to expire stale pending invitations
-- Call from a Supabase cron job: SELECT public.expire_old_invitations();
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE public.interview_invitations
    SET status = 'expired'
    WHERE expires_at < NOW()
      AND status = 'pending';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- SECTION 19: RECRUITER VIEW
-- Denormalized view for the recruiter dashboard candidate list.
-- Joins grading results with session, context, and evaluation data.
-- ============================================================

CREATE OR REPLACE VIEW public.recruiter_candidate_view AS
SELECT
    gr.candidate_id,
    gr.session_id,
    gr.question_id,
    gr.redacted_answer,
    gr.score,
    gr.feedback,
    gr.hf_gate_passed,
    gr.hf_relevance_score,
    gr.was_flagged,
    gr.graded_at,
    cct.experience_level,
    cct.detected_stack,
    cct.estimated_years,
    cct.hf_relevance_skipped,
    es.status              AS session_status,
    es.submission_type,
    es.cheat_event_count,
    es.is_flagged_cheating,
    es.started_at,
    es.submitted_at,
    er.cv_score,
    er.skills_score,
    er.interview_score,
    er.overall_score,
    er.recommended_status,
    ap.status              AS candidate_status,
    ap.skills              AS candidate_skills
FROM public.grading_results gr
JOIN  public.exam_sessions          es  ON es.id           = gr.session_id
JOIN  public.candidate_context_tags cct ON cct.candidate_id = gr.candidate_id
JOIN  public.anonymous_profiles     ap  ON ap.candidate_id  = gr.candidate_id
LEFT JOIN public.evaluation_results er  ON er.candidate_id  = gr.candidate_id
                                       AND er.job_id        = es.job_id;


-- ============================================================
-- SECTION 20: SEED DATA — System Evaluation Templates
-- ============================================================

INSERT INTO public.evaluation_templates
    (id, name, description, type, prompt_template, is_system_template)
VALUES
(
    uuid_generate_v4(),
    'Standard Software Engineer Evaluation',
    'Default rigorous technical grading for mid-level engineers.',
    'QUESTIONNAIRE',
    'You are an expert technical interviewer. Evaluate the candidate answer based on: '
    '1. Technical Accuracy (40%) — is the approach correct and complete? '
    '2. Code Quality & Best Practices (30%) — naming, structure, readability. '
    '3. Problem Solving & Logic (30%) — does the reasoning handle edge cases? '
    'Return JSON: { "score": <0-10>, "feedback": "<constructive text>", "redacted_answer": "<answer with PII replaced>" }',
    true
),
(
    uuid_generate_v4(),
    'Lenient Junior Developer Evaluation',
    'Softer grading focused on potential and foundational understanding.',
    'QUESTIONNAIRE',
    'You are an empathetic senior developer evaluating a junior candidate. Focus on: '
    '1. Core Understanding (50%) — do they grasp the concept even if imperfectly? '
    '2. Learning Potential (30%) — is the approach sensible and improvable? '
    '3. Syntax & Structure (20%) — minor bugs are acceptable. '
    'Acknowledge good attempts. '
    'Return JSON: { "score": <0-10>, "feedback": "<constructive text>", "redacted_answer": "<answer with PII replaced>" }',
    true
),
(
    uuid_generate_v4(),
    'Strict Senior Architecture Evaluation',
    'High-bar grading focused on scalability, security, and design patterns.',
    'QUESTIONNAIRE',
    'You are a strict Staff Engineer reviewing a senior candidate. Evaluate with rigor on: '
    '1. System Design & Scalability (40%) — does the solution scale? What is the Big-O? '
    '2. Security & Edge Cases (30%) — are failure modes and injection risks handled? '
    '3. Code Quality & Patterns (30%) — appropriate abstractions, no brute-force. '
    'Penalize heavily for naive solutions that ignore constraints. '
    'Return JSON: { "score": <0-10>, "feedback": "<constructive text>", "redacted_answer": "<answer with PII replaced>" }',
    true
);


-- ============================================================
-- END OF SCHEMA
-- ============================================================