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
    organization_id UUID REFERENCES public.organizations(id),
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


-- Interview Invitations Table for Magic Link Authentication
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Interview Invitations Table
CREATE TABLE IF NOT EXISTS public.interview_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255),
    recruiter_id UUID REFERENCES public.recruiters(id),
    organization_id UUID REFERENCES public.organizations(id),
    job_title VARCHAR(255),
    interview_date TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.interview_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.interview_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.interview_invitations(candidate_email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON public.interview_invitations(expires_at);

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
-- This is needed for unauthenticated candidates to validate their tokens
CREATE POLICY "Public can validate tokens" 
ON public.interview_invitations
FOR SELECT USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_interview_invitations_updated_at
    BEFORE UPDATE ON public.interview_invitations
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

-- Grant necessary permissions (adjust based on your Supabase setup)
-- GRANT SELECT, INSERT, UPDATE ON public.interview_invitations TO authenticated;
-- GRANT SELECT ON public.interview_invitations TO anon;

-- Anonymous Profiles (Extracted Skills)
CREATE TABLE public.anonymous_profiles (
    candidate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skills JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secure Identities (Vault for R2 Keys)
CREATE TABLE public.secure_identities (
    candidate_id UUID PRIMARY KEY REFERENCES public.anonymous_profiles(candidate_id),
    r2_object_key VARCHAR(1024) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.anonymous_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_identities ENABLE ROW LEVEL SECURITY;

-- Allow public insertion (for now) or restricted to service role
-- For MVP, we'll allow Authenticated/Anon read access to anonymous_profiles
CREATE POLICY "Public read anonymous profiles" 
ON public.anonymous_profiles
FOR SELECT USING (true);

-- Jobs Table (For Hiring Funnel)
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    recruiter_id UUID REFERENCES public.recruiters(id),
    
    -- Filter Logic
    required_skills JSONB, -- ["Python", "Django", "RestAPI"]
    screening_questions JSONB, -- ["Explain Dependency Injection", "What is ACID?"]
    
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

-- Link Candidates to Jobs
ALTER TABLE public.anonymous_profiles 
ADD COLUMN job_id UUID REFERENCES public.jobs(id);

ALTER TABLE public.anonymous_profiles
ADD COLUMN status VARCHAR(50) DEFAULT 'applied'; -- 'applied', 'auto-rejected', 'screening', 'shortlisted', 'rejected'
