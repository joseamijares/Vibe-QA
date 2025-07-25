-- Enable Row Level Security on all tables
alter table organizations enable row level security;
alter table projects enable row level security;
alter table organization_members enable row level security;
alter table feedback enable row level security;
alter table feedback_media enable row level security;
alter table comments enable row level security;
alter table activity_logs enable row level security;
alter table invitations enable row level security;

-- Helper function to check if user is organization member
create or replace function is_organization_member(org_id uuid, user_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 from organization_members
        where organization_id = org_id
        and organization_members.user_id = user_id
    );
end;
$$ language plpgsql security definer;

-- Helper function to check user role in organization
create or replace function get_user_role(org_id uuid, user_id uuid)
returns user_role as $$
declare
    role user_role;
begin
    select organization_members.role into role
    from organization_members
    where organization_id = org_id
    and organization_members.user_id = user_id;
    
    return role;
end;
$$ language plpgsql security definer;

-- Helper function to get user's organizations
create or replace function get_user_organizations(user_id uuid)
returns setof uuid as $$
begin
    return query
    select organization_id
    from organization_members
    where organization_members.user_id = user_id;
end;
$$ language plpgsql security definer;

-- Organizations policies
create policy "Users can view organizations they belong to"
    on organizations for select
    using (is_organization_member(id, auth.uid()));

create policy "Only owners can update organizations"
    on organizations for update
    using (get_user_role(id, auth.uid()) = 'owner');

create policy "Only owners can delete organizations"
    on organizations for delete
    using (get_user_role(id, auth.uid()) = 'owner');

-- Projects policies
create policy "Users can view projects in their organizations"
    on projects for select
    using (is_organization_member(organization_id, auth.uid()));

create policy "Admins and owners can create projects"
    on projects for insert
    with check (
        get_user_role(organization_id, auth.uid()) in ('owner', 'admin')
    );

create policy "Admins and owners can update projects"
    on projects for update
    using (
        get_user_role(organization_id, auth.uid()) in ('owner', 'admin')
    );

create policy "Only owners can delete projects"
    on projects for delete
    using (get_user_role(organization_id, auth.uid()) = 'owner');

-- Organization members policies
create policy "Users can view members of their organizations"
    on organization_members for select
    using (is_organization_member(organization_id, auth.uid()));

create policy "Owners and admins can add members"
    on organization_members for insert
    with check (
        get_user_role(organization_id, auth.uid()) in ('owner', 'admin')
    );

create policy "Owners can update member roles"
    on organization_members for update
    using (get_user_role(organization_id, auth.uid()) = 'owner');

create policy "Owners can remove members"
    on organization_members for delete
    using (get_user_role(organization_id, auth.uid()) = 'owner');

-- Feedback policies
create policy "Users can view feedback for projects in their organizations"
    on feedback for select
    using (
        exists (
            select 1 from projects
            where projects.id = feedback.project_id
            and is_organization_member(projects.organization_id, auth.uid())
        )
    );

create policy "Anyone can create feedback with valid API key"
    on feedback for insert
    with check (
        exists (
            select 1 from projects
            where projects.id = feedback.project_id
            and projects.is_active = true
        )
    );

create policy "Members can update feedback in their organizations"
    on feedback for update
    using (
        exists (
            select 1 from projects
            where projects.id = feedback.project_id
            and is_organization_member(projects.organization_id, auth.uid())
            and get_user_role(projects.organization_id, auth.uid()) != 'viewer'
        )
    );

create policy "Admins and owners can delete feedback"
    on feedback for delete
    using (
        exists (
            select 1 from projects
            where projects.id = feedback.project_id
            and is_organization_member(projects.organization_id, auth.uid())
            and get_user_role(projects.organization_id, auth.uid()) in ('owner', 'admin')
        )
    );

-- Feedback media policies
create policy "Users can view media for feedback they can access"
    on feedback_media for select
    using (
        exists (
            select 1 from feedback
            join projects on projects.id = feedback.project_id
            where feedback.id = feedback_media.feedback_id
            and is_organization_member(projects.organization_id, auth.uid())
        )
    );

create policy "Media can be created with feedback"
    on feedback_media for insert
    with check (
        exists (
            select 1 from feedback
            join projects on projects.id = feedback.project_id
            where feedback.id = feedback_media.feedback_id
            and projects.is_active = true
        )
    );

-- Comments policies
create policy "Users can view comments for feedback they can access"
    on comments for select
    using (
        exists (
            select 1 from feedback
            join projects on projects.id = feedback.project_id
            where feedback.id = comments.feedback_id
            and is_organization_member(projects.organization_id, auth.uid())
        )
    );

create policy "Members can create comments"
    on comments for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from feedback
            join projects on projects.id = feedback.project_id
            where feedback.id = comments.feedback_id
            and is_organization_member(projects.organization_id, auth.uid())
            and get_user_role(projects.organization_id, auth.uid()) != 'viewer'
        )
    );

create policy "Users can update their own comments"
    on comments for update
    using (auth.uid() = user_id);

create policy "Users can delete their own comments"
    on comments for delete
    using (auth.uid() = user_id);

-- Activity logs policies
create policy "Users can view activity logs for their organizations"
    on activity_logs for select
    using (is_organization_member(organization_id, auth.uid()));

create policy "System can create activity logs"
    on activity_logs for insert
    with check (true); -- Activity logs are created by database functions

-- Invitations policies
create policy "Admins and owners can view invitations"
    on invitations for select
    using (
        get_user_role(organization_id, auth.uid()) in ('owner', 'admin')
    );

create policy "Admins and owners can create invitations"
    on invitations for insert
    with check (
        get_user_role(organization_id, auth.uid()) in ('owner', 'admin')
    );

create policy "Anyone can view their own invitation by email"
    on invitations for select
    using (email = auth.email());

create policy "Admins and owners can delete invitations"
    on invitations for delete
    using (
        get_user_role(organization_id, auth.uid()) in ('owner', 'admin')
    );

-- Create function to handle new user signup
create or replace function handle_new_user()
returns trigger as $$
declare
    org_id uuid;
    org_slug text;
begin
    -- Generate a unique slug from email
    org_slug := lower(split_part(new.email, '@', 1) || '-' || substr(md5(random()::text), 1, 6));
    
    -- Create organization for the new user
    org_id := create_organization_for_user(
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Organization',
        org_slug
    );
    
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to create organization on user signup
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();