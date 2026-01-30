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
