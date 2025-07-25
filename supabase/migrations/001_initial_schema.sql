-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('owner', 'admin', 'member', 'viewer');
create type feedback_type as enum ('bug', 'suggestion', 'praise', 'other');
create type feedback_status as enum ('new', 'in_progress', 'resolved', 'archived');
create type feedback_priority as enum ('low', 'medium', 'high', 'critical');

-- Organizations table
create table organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text unique not null,
    logo_url text,
    settings jsonb default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create index for slug lookups
create index idx_organizations_slug on organizations(slug);

-- Projects table
create table projects (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id) on delete cascade,
    name text not null,
    slug text not null,
    description text,
    api_key uuid default uuid_generate_v4(),
    settings jsonb default '{}',
    allowed_domains text[] default '{}',
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(organization_id, slug)
);

-- Create indexes for projects
create index idx_projects_organization_id on projects(organization_id);
create index idx_projects_api_key on projects(api_key);

-- Organization members table (links users to organizations)
create table organization_members (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    role user_role not null default 'member',
    joined_at timestamptz default now(),
    unique(organization_id, user_id)
);

-- Create indexes for organization members
create index idx_organization_members_user_id on organization_members(user_id);
create index idx_organization_members_organization_id on organization_members(organization_id);

-- Feedback table
create table feedback (
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
create index idx_feedback_project_id on feedback(project_id);
create index idx_feedback_status on feedback(status);
create index idx_feedback_created_at on feedback(created_at desc);
create index idx_feedback_assigned_to on feedback(assigned_to);

-- Feedback media table
create table feedback_media (
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
create index idx_feedback_media_feedback_id on feedback_media(feedback_id);

-- Comments table
create table comments (
    id uuid primary key default uuid_generate_v4(),
    feedback_id uuid references feedback(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    content text not null,
    is_internal boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create indexes for comments
create index idx_comments_feedback_id on comments(feedback_id);
create index idx_comments_user_id on comments(user_id);

-- Activity logs table
create table activity_logs (
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
create index idx_activity_logs_organization_id on activity_logs(organization_id);
create index idx_activity_logs_user_id on activity_logs(user_id);
create index idx_activity_logs_created_at on activity_logs(created_at desc);

-- Invitations table
create table invitations (
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
create index idx_invitations_organization_id on invitations(organization_id);
create index idx_invitations_email on invitations(email);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_organizations_updated_at before update on organizations
    for each row execute function update_updated_at_column();

create trigger update_projects_updated_at before update on projects
    for each row execute function update_updated_at_column();

create trigger update_feedback_updated_at before update on feedback
    for each row execute function update_updated_at_column();

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
    new.api_key = 'pk_' || replace(uuid_generate_v4()::text, '-', '');
    return new;
end;
$$ language plpgsql;

-- Trigger to generate API key for new projects
create trigger generate_api_key_trigger
    before insert on projects
    for each row
    execute function generate_project_api_key();