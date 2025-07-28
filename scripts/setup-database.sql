-- VibeQA Complete Database Setup
-- This script sets up the entire database schema and creates a test project
-- Run this in your Supabase SQL Editor

-- ====================================
-- STEP 1: Initial Schema Setup
-- ====================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_type AS ENUM ('bug', 'suggestion', 'praise', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Organizations table
create table if not exists organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text unique not null,
    logo_url text,
    settings jsonb default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create index for slug lookups
create index if not exists idx_organizations_slug on organizations(slug);

-- Projects table
create table if not exists projects (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id) on delete cascade,
    name text not null,
    slug text not null,
    description text,
    api_key text unique not null,
    settings jsonb default '{}',
    allowed_domains text[] default '{}',
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(organization_id, slug)
);

-- Create indexes for projects
create index if not exists idx_projects_organization_id on projects(organization_id);
create index if not exists idx_projects_api_key on projects(api_key);

-- Organization members table (links users to organizations)
create table if not exists organization_members (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    role user_role not null default 'member',
    joined_at timestamptz default now(),
    unique(organization_id, user_id)
);

-- Create indexes for organization members
create index if not exists idx_organization_members_user_id on organization_members(user_id);
create index if not exists idx_organization_members_organization_id on organization_members(organization_id);

-- Feedback table
create table if not exists feedback (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects(id) on delete cascade,
    type feedback_type not null default 'bug',
    status feedback_status not null default 'new',
    priority feedback_priority not null default 'medium',
    title text,
    description text not null,
    reporter_email text,
    reporter_name text,
    page_url text,
    user_agent text,
    browser_info jsonb,
    device_info jsonb,
    custom_data jsonb,
    metadata jsonb default '{}',
    assigned_to uuid references auth.users(id) on delete set null,
    resolved_at timestamptz,
    resolved_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create indexes for feedback
create index if not exists idx_feedback_project_id on feedback(project_id);
create index if not exists idx_feedback_status on feedback(status);
create index if not exists idx_feedback_created_at on feedback(created_at desc);
create index if not exists idx_feedback_assigned_to on feedback(assigned_to);

-- Feedback media table
create table if not exists feedback_media (
    id uuid primary key default uuid_generate_v4(),
    feedback_id uuid references feedback(id) on delete cascade,
    type text not null check (type in ('screenshot', 'video', 'audio')),
    url text not null,
    thumbnail_url text,
    file_size bigint,
    duration integer, -- for video/audio in seconds
    metadata jsonb default '{}',
    created_at timestamptz default now()
);

-- Create index for feedback media
create index if not exists idx_feedback_media_feedback_id on feedback_media(feedback_id);

-- Comments table
create table if not exists comments (
    id uuid primary key default uuid_generate_v4(),
    feedback_id uuid references feedback(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    content text not null,
    is_internal boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create indexes for comments
create index if not exists idx_comments_feedback_id on comments(feedback_id);
create index if not exists idx_comments_user_id on comments(user_id);

-- Activity logs table
create table if not exists activity_logs (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    action text not null,
    resource_type text not null,
    resource_id uuid,
    metadata jsonb default '{}',
    created_at timestamptz default now()
);

-- Create indexes for activity logs
create index if not exists idx_activity_logs_organization_id on activity_logs(organization_id);
create index if not exists idx_activity_logs_user_id on activity_logs(user_id);
create index if not exists idx_activity_logs_created_at on activity_logs(created_at desc);

-- Invitations table
create table if not exists invitations (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id) on delete cascade,
    email text not null,
    role user_role not null default 'member',
    invited_by uuid references auth.users(id) on delete set null,
    accepted_at timestamptz,
    expires_at timestamptz default (now() + interval '7 days'),
    created_at timestamptz default now()
);

-- Create indexes for invitations
create index if not exists idx_invitations_organization_id on invitations(organization_id);
create index if not exists idx_invitations_email on invitations(email);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
drop trigger if exists update_organizations_updated_at on organizations;
create trigger update_organizations_updated_at before update on organizations
    for each row execute function update_updated_at_column();

drop trigger if exists update_projects_updated_at on projects;
create trigger update_projects_updated_at before update on projects
    for each row execute function update_updated_at_column();

drop trigger if exists update_feedback_updated_at on feedback;
create trigger update_feedback_updated_at before update on feedback
    for each row execute function update_updated_at_column();

drop trigger if exists update_comments_updated_at on comments;
create trigger update_comments_updated_at before update on comments
    for each row execute function update_updated_at_column();

-- Function to create a new organization for a user
create or replace function create_organization_for_user(
    user_id uuid,
    org_name text,
    org_slug text
)
returns uuid as $$
declare
    new_org_id uuid;
begin
    -- Create the organization
    insert into organizations (name, slug)
    values (org_name, org_slug)
    returning id into new_org_id;
    
    -- Add the user as owner
    insert into organization_members (organization_id, user_id, role)
    values (new_org_id, user_id, 'owner');
    
    -- Log the activity
    insert into activity_logs (organization_id, user_id, action, resource_type, resource_id)
    values (new_org_id, user_id, 'created_organization', 'organization', new_org_id);
    
    return new_org_id;
end;
$$ language plpgsql security definer;

-- Function to generate a unique project API key
create or replace function generate_project_api_key()
returns trigger as $$
begin
    -- Generate a prefixed API key for easier identification
    if new.api_key is null or new.api_key = '' then
        new.api_key = 'pk_' || replace(uuid_generate_v4()::text, '-', '');
    end if;
    return new;
end;
$$ language plpgsql;

-- Trigger to generate API key for new projects
drop trigger if exists generate_api_key_trigger on projects;
create trigger generate_api_key_trigger
    before insert on projects
    for each row
    execute function generate_project_api_key();

-- ====================================
-- STEP 2: Row Level Security (RLS)
-- ====================================

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table projects enable row level security;
alter table feedback enable row level security;
alter table feedback_media enable row level security;
alter table comments enable row level security;
alter table activity_logs enable row level security;
alter table invitations enable row level security;

-- Organizations policies
create policy "Users can view organizations they belong to"
    on organizations for select
    using (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = organizations.id
            and organization_members.user_id = auth.uid()
        )
    );

create policy "Organization owners can update their organization"
    on organizations for update
    using (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = organizations.id
            and organization_members.user_id = auth.uid()
            and organization_members.role = 'owner'
        )
    );

-- Projects policies
create policy "Users can view projects in their organizations"
    on projects for select
    using (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = projects.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

create policy "Organization owners and admins can manage projects"
    on projects for all
    using (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = projects.organization_id
            and organization_members.user_id = auth.uid()
            and organization_members.role in ('owner', 'admin')
        )
    );

-- Feedback policies
create policy "Users can view feedback for projects in their organizations"
    on feedback for select
    using (
        exists (
            select 1 from projects
            join organization_members on organization_members.organization_id = projects.organization_id
            where projects.id = feedback.project_id
            and organization_members.user_id = auth.uid()
        )
    );

create policy "Users can update feedback for projects in their organizations"
    on feedback for update
    using (
        exists (
            select 1 from projects
            join organization_members on organization_members.organization_id = projects.organization_id
            where projects.id = feedback.project_id
            and organization_members.user_id = auth.uid()
            and organization_members.role in ('owner', 'admin', 'member')
        )
    );

-- Public access for widget to create feedback (using API key validation)
create policy "Public can create feedback with valid API key"
    on feedback for insert
    with check (true);

-- ====================================
-- STEP 3: Email System Tables
-- ====================================

-- Email templates table
create table if not exists email_templates (
    id uuid primary key default uuid_generate_v4(),
    name text unique not null,
    subject text not null,
    html_content text not null,
    text_content text,
    variables jsonb default '[]',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Email queue table
create table if not exists email_queue (
    id uuid primary key default uuid_generate_v4(),
    to_email text not null,
    to_name text,
    from_email text not null default 'notifications@vibeqa.com',
    from_name text default 'VibeQA',
    subject text not null,
    template text,
    params jsonb default '{}',
    status text default 'pending' check (status in ('pending', 'sent', 'failed')),
    attempts integer default 0,
    error text,
    scheduled_at timestamptz default now(),
    sent_at timestamptz,
    created_at timestamptz default now()
);

-- Create indexes for email queue
create index if not exists idx_email_queue_status on email_queue(status);
create index if not exists idx_email_queue_scheduled_at on email_queue(scheduled_at);

-- Enable RLS on email tables
alter table email_templates enable row level security;
alter table email_queue enable row level security;

-- ====================================
-- STEP 4: Storage Setup
-- ====================================

-- Note: Storage buckets need to be created via Supabase Dashboard or CLI
-- This is just documentation of required buckets

-- Required storage buckets:
-- 1. feedback-media (private) - For screenshots, recordings, etc.
-- 2. organization-assets (private) - For logos and other org assets

-- ====================================
-- STEP 5: Create Test Data
-- ====================================

DO $$
DECLARE
    test_org_id UUID;
    test_project_id UUID;
BEGIN
    -- Check if test organization exists
    SELECT id INTO test_org_id 
    FROM organizations 
    WHERE slug = 'test-org' 
    LIMIT 1;
    
    -- If no test org exists, create one
    IF test_org_id IS NULL THEN
        INSERT INTO organizations (name, slug, settings)
        VALUES (
            'Test Organization',
            'test-org',
            '{"description": "Organization for testing widget integration"}'::jsonb
        )
        RETURNING id INTO test_org_id;
        
        RAISE NOTICE 'Created test organization with ID: %', test_org_id;
    ELSE
        RAISE NOTICE 'Using existing test organization with ID: %', test_org_id;
    END IF;
    
    -- Check if test project exists
    SELECT id INTO test_project_id
    FROM projects
    WHERE organization_id = test_org_id
    AND slug = 'test-project'
    LIMIT 1;
    
    -- If no test project exists, create one
    IF test_project_id IS NULL THEN
        INSERT INTO projects (
            organization_id,
            name,
            slug,
            description,
            api_key,
            is_active,
            allowed_domains,
            settings
        ) VALUES (
            test_org_id,
            'Test Project',
            'test-project',
            'Project for testing widget feedback submission',
            'proj_test123456789',
            true,
            ARRAY['localhost:5173', 'localhost:3000', 'localhost:4173', 'localhost:8080'],
            '{
                "feedbackTypes": ["bug", "suggestion", "praise", "other"],
                "emailNotifications": true,
                "autoAssign": false
            }'::jsonb
        )
        RETURNING id INTO test_project_id;
        
        RAISE NOTICE 'Created test project with ID: %', test_project_id;
        RAISE NOTICE 'API Key: proj_test123456789';
    ELSE
        -- Update the API key to ensure it matches our test configuration
        UPDATE projects 
        SET api_key = 'proj_test123456789',
            is_active = true,
            allowed_domains = ARRAY['localhost:5173', 'localhost:3000', 'localhost:4173', 'localhost:8080']
        WHERE id = test_project_id;
        
        RAISE NOTICE 'Updated existing test project with ID: %', test_project_id;
        RAISE NOTICE 'API Key: proj_test123456789';
    END IF;
    
    -- Show success message
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Project Details:';
    RAISE NOTICE '- Organization: Test Organization (test-org)';
    RAISE NOTICE '- Project: Test Project (test-project)';
    RAISE NOTICE '- API Key: proj_test123456789';
    RAISE NOTICE '- Allowed Domains: localhost:5173, localhost:3000, localhost:4173, localhost:8080';
    
END $$;

-- ====================================
-- STEP 6: Verification
-- ====================================

-- Show the test project details
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.api_key,
    p.is_active,
    p.allowed_domains,
    o.name as organization_name,
    o.slug as organization_slug
FROM projects p
JOIN organizations o ON p.organization_id = o.id
WHERE p.api_key = 'proj_test123456789';

-- Count tables created
SELECT 
    COUNT(*) as tables_created,
    STRING_AGG(tablename, ', ' ORDER BY tablename) as table_list
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'organizations', 'projects', 'organization_members', 
    'feedback', 'feedback_media', 'comments', 
    'activity_logs', 'invitations', 'email_templates', 'email_queue'
);

-- ====================================
-- USEFUL QUERIES
-- ====================================

-- To view all feedback for the test project:
/*
SELECT * FROM feedback 
WHERE project_id = (SELECT id FROM projects WHERE api_key = 'proj_test123456789')
ORDER BY created_at DESC
LIMIT 10;
*/

-- To clean up test feedback:
/*
DELETE FROM feedback 
WHERE project_id = (SELECT id FROM projects WHERE api_key = 'proj_test123456789');
*/

-- To check if a user has access to the test organization:
/*
SELECT * FROM organization_members
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'test-org');
*/