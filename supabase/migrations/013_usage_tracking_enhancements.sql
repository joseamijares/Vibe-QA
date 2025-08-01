-- Enhanced usage tracking for project counts and limit enforcement

-- Add project_count to organization_usage table
alter table public.organization_usage 
add column if not exists project_count integer default 0;

-- Function to update project count
create or replace function update_project_count(org_id uuid)
returns void as $$
begin
    -- Update the project count for the current month
    insert into public.organization_usage (organization_id, month, project_count)
    values (org_id, date_trunc('month', now())::date, 
            (select count(*) from public.projects where organization_id = org_id))
    on conflict (organization_id, month)
    do update set 
        project_count = (select count(*) from public.projects where organization_id = org_id),
        updated_at = now();
end;
$$ language plpgsql security definer;

-- Trigger to update project count when projects are created or deleted
create or replace function track_project_changes()
returns trigger as $$
begin
    if (TG_OP = 'INSERT') then
        perform update_project_count(new.organization_id);
    elsif (TG_OP = 'DELETE') then
        perform update_project_count(old.organization_id);
    end if;
    return null;
end;
$$ language plpgsql security definer;

-- Create trigger for project tracking
drop trigger if exists on_project_changes on public.projects;
create trigger on_project_changes
    after insert or delete on public.projects
    for each row
    execute function track_project_changes();

-- Function to check if organization can create more projects
create or replace function can_create_project(org_id uuid)
returns boolean as $$
declare
    current_count integer;
    plan_limit integer;
begin
    -- Get current project count
    select count(*) into current_count 
    from public.projects 
    where organization_id = org_id;
    
    -- Get plan limit
    select (sp.limits->>'projects')::integer into plan_limit
    from public.organizations o
    left join public.subscription_plans sp on sp.id = coalesce(
        (select plan_id from public.organization_subscriptions where organization_id = o.id),
        o.subscription_plan_id,
        'free'
    )
    where o.id = org_id;
    
    -- -1 means unlimited
    if plan_limit = -1 then
        return true;
    end if;
    
    return current_count < plan_limit;
end;
$$ language plpgsql security definer;

-- Function to check if organization can submit more feedback
create or replace function can_submit_feedback(org_id uuid)
returns boolean as $$
declare
    current_count integer;
    plan_limit integer;
begin
    -- Get current month's feedback count
    select coalesce(feedback_count, 0) into current_count
    from public.organization_usage
    where organization_id = org_id 
    and month = date_trunc('month', now())::date;
    
    -- Get plan limit
    select (sp.limits->>'feedbackPerMonth')::integer into plan_limit
    from public.organizations o
    left join public.subscription_plans sp on sp.id = coalesce(
        (select plan_id from public.organization_subscriptions where organization_id = o.id),
        o.subscription_plan_id,
        'free'
    )
    where o.id = org_id;
    
    -- -1 means unlimited
    if plan_limit = -1 then
        return true;
    end if;
    
    return current_count < plan_limit;
end;
$$ language plpgsql security definer;

-- Function to get organization usage limits
create or replace function get_organization_limits(org_id uuid)
returns table (
    plan_id text,
    project_limit integer,
    feedback_limit integer,
    team_member_limit integer,
    storage_limit_gb integer,
    current_projects integer,
    current_feedback integer,
    current_team_members integer,
    current_storage_gb numeric
) as $$
begin
    return query
    select 
        coalesce(
            (select plan_id from public.organization_subscriptions where organization_id = org_id),
            o.subscription_plan_id,
            'free'
        ) as plan_id,
        (sp.limits->>'projects')::integer as project_limit,
        (sp.limits->>'feedbackPerMonth')::integer as feedback_limit,
        (sp.limits->>'teamMembers')::integer as team_member_limit,
        (sp.limits->>'storageGB')::integer as storage_limit_gb,
        (select count(*)::integer from public.projects where organization_id = org_id) as current_projects,
        coalesce((select feedback_count from public.organization_usage where organization_id = org_id and month = date_trunc('month', now())::date), 0) as current_feedback,
        (select count(*)::integer from public.organization_members where organization_id = org_id) as current_team_members,
        coalesce(
            (select round((storage_bytes::numeric / 1073741824)::numeric, 2) 
             from public.organization_usage 
             where organization_id = org_id 
             and month = date_trunc('month', now())::date), 
            0
        ) as current_storage_gb
    from public.organizations o
    left join public.subscription_plans sp on sp.id = coalesce(
        (select plan_id from public.organization_subscriptions where organization_id = o.id),
        o.subscription_plan_id,
        'free'
    )
    where o.id = org_id;
end;
$$ language plpgsql security definer;

-- Update existing usage records to include project counts
update public.organization_usage ou
set project_count = (
    select count(*) 
    from public.projects p 
    where p.organization_id = ou.organization_id
)
where project_count is null or project_count = 0;

-- Grant execute permissions
grant execute on function can_create_project to authenticated;
grant execute on function can_submit_feedback to authenticated;
grant execute on function get_organization_limits to authenticated;