-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (Linking Supabase Auth with our Organizations)
CREATE TABLE public.recruiters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Reference to Supabase Auth User ID (or Asgardeo Subject ID)
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'recruiter', -- 'admin', 'hiring_manager', 'recruiter'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

-- Policy: Recruiters can view their own organization
CREATE POLICY "Recruiters can view own org" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    );

-- Policy: Recruiters can view their own profile and others in their org
CREATE POLICY "Recruiters can view org profiles" ON public.recruiters
    FOR SELECT USING (
        user_id = auth.uid() OR organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    );

-- Evaluation Templates Table
CREATE TABLE public.evaluation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'QUESTIONNAIRE', -- 'CV_SCREENING', 'QUESTIONNAIRE', etc.
    prompt_template TEXT NOT NULL,
    is_system_template BOOLEAN DEFAULT false,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Evaluation Templates
ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone (or authenticated) can view system templates
CREATE POLICY "Anyone can view system templates" ON public.evaluation_templates
    FOR SELECT USING (is_system_template = true);

-- Policy: Recruiters can view their org's templates
CREATE POLICY "Recruiters can view org templates" ON public.evaluation_templates
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    );

-- Policy: Recruiters can create templates for their org
CREATE POLICY "Recruiters can create templates" ON public.evaluation_templates
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
        AND is_system_template = false -- Recruiters cannot create system templates
    );

-- Policy: Recruiters can update their org's templates
CREATE POLICY "Recruiters can update org templates" ON public.evaluation_templates
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
        AND is_system_template = false
    );

-- Policy: Recruiters can delete their org's templates
CREATE POLICY "Recruiters can delete org templates" ON public.evaluation_templates
    FOR DELETE USING (
        organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
        AND is_system_template = false
    );


-- Jobs Table (For Hiring Funnel)
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.recruiters(id) ON DELETE SET NULL,
    evaluation_template_id UUID REFERENCES public.evaluation_templates(id) ON DELETE SET NULL,
    required_skills JSONB, -- ["Python", "Django", "RestAPI"]
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own jobs" ON public.jobs
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    );

CREATE POLICY "Recruiters can create jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    );

-- Interview Invitations Table for Magic Link Authentication
CREATE TABLE IF NOT EXISTS public.interview_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255),
    recruiter_id UUID REFERENCES public.recruiters(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    job_title VARCHAR(255),
    interview_date TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.interview_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Recruiters can view invitations from their organization
CREATE POLICY "Recruiters can view invitations from their org" 
ON public.interview_invitations
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
    )
);

-- Policy: Recruiters can create invitations for their organization
CREATE POLICY "Recruiters can create invitations for their org" 
ON public.interview_invitations
FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
    )
);

-- Policy: Recruiters can update invitations from their organization
CREATE POLICY "Recruiters can update invitations from their org" 
ON public.interview_invitations
FOR UPDATE USING (
    organization_id IN (
        SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
    )
);

-- Policy: Allow public read for token validation (magic link access)
CREATE POLICY "Public can validate tokens" 
ON public.interview_invitations
FOR SELECT USING (true);


-- Anonymous Profiles (Extracted Skills)
CREATE TABLE public.anonymous_profiles (
    candidate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES public.interview_invitations(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    skills JSONB,
    status VARCHAR(50) DEFAULT 'applied', -- 'applied', 'categorized', 'screening', 'shortlisted', 'rejected', 'accepted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.anonymous_profiles ENABLE ROW LEVEL SECURITY;

-- For MVP, we'll allow Authenticated/Anon read/insert/update access to anonymous_profiles
CREATE POLICY "Public read anonymous profiles" 
ON public.anonymous_profiles
FOR SELECT USING (true);

CREATE POLICY "Public insert anonymous profiles" 
ON public.anonymous_profiles
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update anonymous profiles" 
ON public.anonymous_profiles
FOR UPDATE USING (true);


-- Secure Identities (Vault for R2 Keys)
CREATE TABLE public.secure_identities (
    candidate_id UUID PRIMARY KEY REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    r2_object_key VARCHAR(1024) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.secure_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert secure identities" 
ON public.secure_identities
FOR INSERT WITH CHECK (true);

CREATE POLICY "Recruiters can read secure identities" 
ON public.secure_identities
FOR SELECT USING (true); -- In prod, limit to org recruiters


-- Create Questions Table
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    sample_answer TEXT,
    keywords JSONB, -- Stored as an array of strings ["keyword1", "keyword2"]
    type VARCHAR(50) DEFAULT 'paragraph', -- 'paragraph', 'code'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view questions for their jobs" ON public.questions
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM public.jobs 
            WHERE organization_id IN (
                SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Recruiters can insert questions for their jobs" ON public.questions
    FOR INSERT WITH CHECK (
        job_id IN (
            SELECT id FROM public.jobs 
            WHERE organization_id IN (
                SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Recruiters can delete questions for their jobs" ON public.questions
    FOR DELETE USING (
        job_id IN (
            SELECT id FROM public.jobs 
            WHERE organization_id IN (
                SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Recruiters can update questions for their jobs" ON public.questions
    FOR UPDATE USING (
        job_id IN (
            SELECT id FROM public.jobs 
            WHERE organization_id IN (
                SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
            )
        )
    );


-- Candidate Answers Table (for Interview Metrics)
CREATE TABLE public.candidate_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    correctness_score FLOAT CHECK (correctness_score >= 0 AND correctness_score <= 100),
    difficulty_perceived VARCHAR(50), -- 'easy', 'medium', 'hard'
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Candidate Answers
ALTER TABLE public.candidate_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view candidate answers for their jobs" ON public.candidate_answers
    FOR SELECT USING (
        question_id IN (
            SELECT id FROM public.questions 
            WHERE job_id IN (
                SELECT id FROM public.jobs 
                WHERE organization_id IN (
                    SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Candidates can insert answers" ON public.candidate_answers
    FOR INSERT WITH CHECK (true); 

CREATE POLICY "Candidates can read answers" ON public.candidate_answers
    FOR SELECT USING (true);


-- Evaluation Results Table (Final Gemini Output)
CREATE TABLE public.evaluation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    cv_score FLOAT CHECK (cv_score >= 0 AND cv_score <= 100),
    skills_score FLOAT CHECK (skills_score >= 0 AND skills_score <= 100),
    interview_score FLOAT CHECK (interview_score >= 0 AND interview_score <= 100),
    overall_score FLOAT CHECK (overall_score >= 0 AND overall_score <= 100),
    summary_feedback TEXT,
    recommended_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Evaluation Results
ALTER TABLE public.evaluation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view evaluation results" ON public.evaluation_results
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM public.jobs 
            WHERE organization_id IN (
                SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can insert evaluation results" ON public.evaluation_results
    FOR INSERT WITH CHECK (true);

-- Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.recruiters(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view audit logs for their org" ON public.audit_logs
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid())
    );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);


-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.interview_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.interview_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.interview_invitations(candidate_email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON public.interview_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_recruiters_org ON public.recruiters(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org ON public.jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.interview_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_job ON public.interview_invitations(job_id);

CREATE INDEX IF NOT EXISTS idx_anon_profiles_job ON public.anonymous_profiles(job_id);
CREATE INDEX IF NOT EXISTS idx_anon_profiles_invitation ON public.anonymous_profiles(invitation_id);

CREATE INDEX IF NOT EXISTS idx_questions_job ON public.questions(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_answers_candidate ON public.candidate_answers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_answers_question ON public.candidate_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_eval_results_candidate ON public.evaluation_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_eval_results_job ON public.evaluation_results(job_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);


-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for organizations
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for interview_invitations
CREATE TRIGGER update_interview_invitations_updated_at
    BEFORE UPDATE ON public.interview_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for evaluation_templates
CREATE TRIGGER update_evaluation_templates_updated_at
    BEFORE UPDATE ON public.evaluation_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-expire old tokens (optional - can be called by a cron job)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE public.interview_invitations
    SET status = 'expired'
    WHERE expires_at < NOW() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Insert Pre-built System Templates
INSERT INTO public.evaluation_templates (id, name, description, type, prompt_template, is_system_template)
VALUES 
    (uuid_generate_v4(), 'Standard Software Engineer Evaluation', 'Default rigorous technical grading criteria.', 'QUESTIONNAIRE', 'You are an expert technical interviewer. Evaluate the candidate''s answer based on: 1. Technical Accuracy (40%), 2. Code Quality & Best Practices (30%), 3. Problem Solving & Logic (30%). Provide constructive feedback.', true),
    (uuid_generate_v4(), 'Lenient Junior Developer Evaluation', 'Softer grading focused on potential and basic understanding.', 'QUESTIONNAIRE', 'You are an empathetic senior developer evaluating a junior. Focus on: 1. Core Understanding (50%), 2. Willingness to Learn (30%), 3. Syntax (20%). Point out good attempts even if the final code has minor bugs.', true),
    (uuid_generate_v4(), 'Strict Senior Architecture Evaluation', 'Harsh grading focusing on scalability and design patterns.', 'QUESTIONNAIRE', 'You are a strict Staff Engineer. Evaluate the candidate with extreme rigor on: 1. System Design & Scalability (40%), 2. Security (30%), 3. Edge Cases (30%). Reject answers that brute force the solution without considering big-O constraints.', true);

-- ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-- ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-- ============================================================
-- EquiHire — Missing Tables Migration v2
-- CHANGES FROM v1:
--   1. pii_entity_maps         — removed ner_model (Gemini does PII now)
--   2. candidate_context_tags  — removed zero_shot_model (Gemini does level+stack)
--                                added hf_relevance_skipped counter
--   3. raw_answer_vault        — added hf_checked BOOLEAN
--   4. grading_results         — added hf_gate_passed + hf_relevance_score
--                                updated gemini_model default to gemini-2.5-flash
--   5. New trigger             — trg_increment_hf_skipped
--   6. recruiter_candidate_view — updated with new columns
-- Run this AFTER your existing schema is applied.
-- ============================================================


-- ─────────────────────────────────────────────
-- 1. CV PARSED SECTIONS
--    Gemini returns all sections in one JSON blob.
--    No changes from v1 except parser_version bump.
-- ─────────────────────────────────────────────
CREATE TABLE public.cv_parsed_sections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id        UUID REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    invitation_id       UUID REFERENCES public.interview_invitations(id) ON DELETE CASCADE,
    job_id              UUID REFERENCES public.jobs(id) ON DELETE CASCADE,

    -- Full raw text extracted by PDFBox before Gemini
    raw_text            TEXT,

    -- Section buckets returned by Gemini CV parse call
    education           JSONB,   -- [{ institution, degree, gpa, dates }]
    work_experience     JSONB,   -- [{ role, org, duration, bullets }]
    projects            JSONB,   -- [{ name, tech, outcome, dates }]
    achievements        JSONB,   -- [{ title, issuer, year }]
    technical_skills    JSONB,   -- [{ language, framework, tool }]
    certificates        JSONB,   -- [{ name, issuer, year }]

    r2_object_key       VARCHAR(1024),

    parsed_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parser_version      VARCHAR(20) DEFAULT 'v2.0'
);

ALTER TABLE public.cv_parsed_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view cv sections for their org"
ON public.cv_parsed_sections FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (
            SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "System can insert cv sections"
ON public.cv_parsed_sections FOR INSERT WITH CHECK (true);

CREATE INDEX idx_cv_sections_candidate ON public.cv_parsed_sections(candidate_id);
CREATE INDEX idx_cv_sections_job       ON public.cv_parsed_sections(job_id);


-- ─────────────────────────────────────────────
-- 2. PII ENTITY MAP
--    v2 CHANGE: removed ner_model column.
--    PII is now extracted by Gemini during CV parse,
--    not by HuggingFace bert-base-NER.
-- ─────────────────────────────────────────────
CREATE TABLE public.pii_entity_maps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id    UUID UNIQUE REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,

    -- Entity array from Gemini CV parse response
    -- e.g. [{ "token": "Hasitha Erandika", "label": "CANDIDATE_NAME" },
    --        { "token": "SLIIT",            "label": "UNIVERSITY"     },
    --        { "token": "Malabe",           "label": "CITY"           }]
    entities        JSONB NOT NULL DEFAULT '[]',

    -- Flat map used by lang.regexp.replaceAll in Ballerina
    -- e.g. { "Hasitha Erandika": "[CANDIDATE_NAME]", "SLIIT": "[UNIVERSITY]" }
    redaction_map   JSONB NOT NULL DEFAULT '{}',

    -- v2: no ner_model column — source is always Gemini Flash
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pii_entity_maps ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for recruiters — service role key only
CREATE POLICY "System only insert pii map"
ON public.pii_entity_maps FOR INSERT WITH CHECK (true);

CREATE INDEX idx_pii_map_candidate ON public.pii_entity_maps(candidate_id);


-- ─────────────────────────────────────────────
-- 3. CANDIDATE CONTEXT TAGS
--    v2 CHANGES:
--    REMOVED zero_shot_model — level+stack now from Gemini
--    ADDED   hf_relevance_skipped — counts auto-zeroed answers
--    ADDED   UPDATE policy for trigger to work
-- ─────────────────────────────────────────────
CREATE TABLE public.candidate_context_tags (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id            UUID UNIQUE REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    job_id                  UUID REFERENCES public.jobs(id) ON DELETE CASCADE,

    -- From Gemini CV parse — "junior" | "mid-level" | "senior"
    experience_level        VARCHAR(20) NOT NULL,

    -- Tech stack detected by Gemini from CV text
    -- e.g. ["React", "Python", "Ballerina", "Supabase"]
    detected_stack          JSONB NOT NULL DEFAULT '[]',

    -- Estimated years parsed from CV date ranges
    estimated_years         FLOAT,

    -- v2 NEW: how many of this candidate's exam answers were
    -- auto-zeroed by the HF relevance gate (high = suspicious)
    hf_relevance_skipped    INTEGER DEFAULT 0,

    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.candidate_context_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view context tags for their org"
ON public.candidate_context_tags FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (
            SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "System can insert context tags"
ON public.candidate_context_tags FOR INSERT WITH CHECK (true);

-- v2 NEW: needed for hf_relevance_skipped trigger
CREATE POLICY "System can update context tags"
ON public.candidate_context_tags FOR UPDATE USING (true);

CREATE INDEX idx_context_tags_candidate ON public.candidate_context_tags(candidate_id);
CREATE INDEX idx_context_tags_job       ON public.candidate_context_tags(job_id);


-- ─────────────────────────────────────────────
-- 4. EXAM SESSIONS
--    No changes from v1.
-- ─────────────────────────────────────────────
CREATE TABLE public.exam_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id    UUID REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    invitation_id   UUID REFERENCES public.interview_invitations(id) ON DELETE CASCADE,
    job_id          UUID REFERENCES public.jobs(id) ON DELETE CASCADE,

    status          VARCHAR(30) DEFAULT 'in_progress',
    -- 'in_progress' | 'submitted' | 'auto_submitted' | 'grading' | 'graded' | 'flagged'

    started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at    TIMESTAMP WITH TIME ZONE,
    graded_at       TIMESTAMP WITH TIME ZONE,

    submission_type VARCHAR(20) DEFAULT 'manual',
    -- 'manual' | 'timer_expired' | 'focus_loss_limit'

    cheat_event_count   INTEGER DEFAULT 0,
    is_flagged_cheating BOOLEAN DEFAULT false
);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view sessions for their org"
ON public.exam_sessions FOR SELECT USING (
    job_id IN (
        SELECT id FROM public.jobs
        WHERE organization_id IN (
            SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "System can insert sessions"
ON public.exam_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update sessions"
ON public.exam_sessions FOR UPDATE USING (true);

CREATE INDEX idx_exam_sessions_candidate ON public.exam_sessions(candidate_id);
CREATE INDEX idx_exam_sessions_job       ON public.exam_sessions(job_id);
CREATE INDEX idx_exam_sessions_status    ON public.exam_sessions(status);


-- ─────────────────────────────────────────────
-- 5. CHEAT EVENTS
--    No changes from v1.
-- ─────────────────────────────────────────────
CREATE TABLE public.cheat_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    candidate_id    UUID REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,

    event_type      VARCHAR(50) NOT NULL,
    -- 'tab_switch' | 'focus_loss' | 'paste_attempt' |
    -- 'right_click' | 'fullscreen_exit' | 'devtools_open'

    occurred_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details         JSONB
);

ALTER TABLE public.cheat_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view cheat events for their org"
ON public.cheat_events FOR SELECT USING (
    candidate_id IN (
        SELECT candidate_id FROM public.anonymous_profiles
        WHERE job_id IN (
            SELECT id FROM public.jobs
            WHERE organization_id IN (
                SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "System can insert cheat events"
ON public.cheat_events FOR INSERT WITH CHECK (true);

CREATE INDEX idx_cheat_events_session   ON public.cheat_events(session_id);
CREATE INDEX idx_cheat_events_candidate ON public.cheat_events(candidate_id);
CREATE INDEX idx_cheat_events_type      ON public.cheat_events(event_type);


-- ─────────────────────────────────────────────
-- 6. RAW ANSWER VAULT
--    v2 CHANGE: added hf_checked BOOLEAN.
--    Records whether the HF relevance gate actually
--    ran on this answer or was bypassed (503 fallback).
--    Useful for audit — you know which answers had
--    the extra safety net and which went straight to Gemini.
-- ─────────────────────────────────────────────
CREATE TABLE public.raw_answer_vault (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    candidate_id    UUID REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    question_id     UUID REFERENCES public.questions(id) ON DELETE CASCADE,

    -- Original unredacted answer — never shown to recruiter
    raw_answer_text TEXT NOT NULL,

    -- v2 NEW: did the HF gate run on this answer?
    -- false = HF returned 503, gate skipped, went straight to Gemini
    hf_checked          BOOLEAN DEFAULT false,

    time_spent_seconds  INTEGER,
    word_count          INTEGER,

    saved_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.raw_answer_vault ENABLE ROW LEVEL SECURITY;

-- No SELECT policy — service role key only. Raw text contains PII.
CREATE POLICY "System can insert raw answers"
ON public.raw_answer_vault FOR INSERT WITH CHECK (true);

CREATE INDEX idx_raw_vault_session   ON public.raw_answer_vault(session_id);
CREATE INDEX idx_raw_vault_candidate ON public.raw_answer_vault(candidate_id);
CREATE INDEX idx_raw_vault_question  ON public.raw_answer_vault(question_id);


-- ─────────────────────────────────────────────
-- 7. GRADING RESULTS
--    v2 CHANGES:
--    ADDED   hf_gate_passed BOOLEAN DEFAULT true
--            false = answer failed relevance check, auto-zeroed
--    ADDED   hf_relevance_score FLOAT
--            confidence from bart-large-mnli (null if gate skipped)
--    CHANGED gemini_model default → 'gemini-2.5-flash'
-- ─────────────────────────────────────────────
CREATE TABLE public.grading_results (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    candidate_id    UUID REFERENCES public.anonymous_profiles(candidate_id) ON DELETE CASCADE,
    question_id     UUID REFERENCES public.questions(id) ON DELETE CASCADE,

    -- Final output shown to recruiter — redacted, never raw PII
    redacted_answer TEXT NOT NULL,
    score           INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    feedback        TEXT,

    -- v2 NEW: HF relevance gate result
    -- hf_gate_passed = false means score is 0, Gemini was NOT called
    hf_gate_passed      BOOLEAN DEFAULT true,
    hf_relevance_score  FLOAT,  -- null if gate was skipped (503 fallback)

    -- Grading metadata
    gemini_model        VARCHAR(50) DEFAULT 'gemini-2.5-flash',
    grading_attempt     INTEGER DEFAULT 1,  -- 2 = retry after JSON bind fail
    was_flagged         BOOLEAN DEFAULT false,

    graded_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.grading_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view grading results for their org"
ON public.grading_results FOR SELECT USING (
    candidate_id IN (
        SELECT candidate_id FROM public.anonymous_profiles
        WHERE job_id IN (
            SELECT id FROM public.jobs
            WHERE organization_id IN (
                SELECT organization_id FROM public.recruiters WHERE user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "System can insert grading results"
ON public.grading_results FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update grading results"
ON public.grading_results FOR UPDATE USING (true);

CREATE INDEX idx_grading_results_session   ON public.grading_results(session_id);
CREATE INDEX idx_grading_results_candidate ON public.grading_results(candidate_id);
CREATE INDEX idx_grading_results_question  ON public.grading_results(question_id);


-- ─────────────────────────────────────────────
-- 8. TRIGGER — auto-increment cheat count
--    No changes from v1.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_cheat_count()
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
    FOR EACH ROW
    EXECUTE FUNCTION increment_cheat_count();


-- ─────────────────────────────────────────────
-- 9. TRIGGER — auto-increment hf_relevance_skipped
--    v2 NEW: fires when a grading_result is inserted
--    with hf_gate_passed = false. Increments the
--    counter on candidate_context_tags so the recruiter
--    dashboard can surface suspicious candidates without
--    running a subquery.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_hf_skipped()
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
    FOR EACH ROW
    EXECUTE FUNCTION increment_hf_skipped();


-- ─────────────────────────────────────────────
-- 10. RECRUITER VIEW — v2 updated
--     Added hf_gate_passed, hf_relevance_score,
--     hf_relevance_skipped so dashboard shows which
--     answers were auto-zeroed vs genuinely graded.
-- ─────────────────────────────────────────────
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
    cct.hf_relevance_skipped,
    es.submission_type,
    es.cheat_event_count,
    es.is_flagged_cheating,
    er.overall_score,
    er.recommended_status
FROM public.grading_results gr
JOIN public.exam_sessions es            ON es.id = gr.session_id
JOIN public.candidate_context_tags cct  ON cct.candidate_id = gr.candidate_id
LEFT JOIN public.evaluation_results er  ON er.candidate_id = gr.candidate_id;


-- ─────────────────────────────────────────────
-- FULL CHANGE SUMMARY v1 → v2
--
-- pii_entity_maps
--   REMOVED  ner_model VARCHAR(100)
--
-- candidate_context_tags
--   REMOVED  zero_shot_model VARCHAR(100)
--   ADDED    hf_relevance_skipped INTEGER DEFAULT 0
--   ADDED    UPDATE RLS policy
--
-- raw_answer_vault
--   ADDED    hf_checked BOOLEAN DEFAULT false
--
-- grading_results
--   ADDED    hf_gate_passed BOOLEAN DEFAULT true
--   ADDED    hf_relevance_score FLOAT
--   CHANGED  gemini_model default: gemini-1.5-flash → gemini-2.5-flash
--
-- Triggers
--   ADDED    trg_increment_hf_skipped on grading_results
--
-- recruiter_candidate_view
--   ADDED    hf_gate_passed, hf_relevance_score, hf_relevance_skipped
-- ─────────────────────────────────────────────


DELETE FROM public.evaluation_results a
USING public.evaluation_results b
WHERE a.id < b.id 
  AND a.candidate_id = b.candidate_id 
  AND a.job_id = b.job_id;

ALTER TABLE public.evaluation_results 
ADD CONSTRAINT unique_candidate_per_job UNIQUE (candidate_id, job_id);