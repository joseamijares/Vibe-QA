-- Remove Free and Enterprise plans, keeping only Basic and Full plans

-- First, update any organizations currently on 'free' or 'enterprise' plans to 'basic'
update public.organizations
set subscription_plan_id = 'basic'
where subscription_plan_id in ('free', 'enterprise');

-- Update any active subscriptions on 'free' or 'enterprise' to 'basic'
update public.organization_subscriptions
set plan_id = 'basic'
where plan_id in ('free', 'enterprise');

-- Update the organization table default to 'basic' instead of 'free'
alter table public.organizations 
alter column subscription_plan_id set default 'basic';

-- Delete the free and enterprise plans
delete from public.subscription_plans 
where id in ('free', 'enterprise');

-- Update the Basic plan to ensure it has the correct limits and features
update public.subscription_plans
set 
    features = '["3 projects included", "500 bug reports/month", "30-day history", "Email support", "Basic integrations", "Team collaboration"]'::jsonb,
    limits = '{"projects": 3, "feedbackPerMonth": 500, "teamMembers": 5, "storageGB": 5}'::jsonb,
    description = 'Perfect for small teams and startups'
where id = 'basic';

-- Update the Full plan to ensure it has the correct limits and features
update public.subscription_plans
set 
    features = '["10 projects", "2,000 bug reports/month", "90-day history", "Priority support", "Advanced integrations", "Custom workflows", "Analytics dashboard"]'::jsonb,
    limits = '{"projects": 10, "feedbackPerMonth": 2000, "teamMembers": 20, "storageGB": 20}'::jsonb,
    description = 'For growing teams that need more'
where id = 'full';

-- Update all functions that reference 'free' plan to use 'basic' as default

-- Update can_submit_feedback function
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
        (select plan_id from public.organization_subscriptions 
         where organization_id = o.id 
         and status in ('active', 'trialing')),
        o.subscription_plan_id,
        'basic'  -- Changed from 'free' to 'basic'
    )
    where o.id = org_id;
    
    -- -1 means unlimited (no longer applicable with only Basic and Full plans)
    if plan_limit is null then
        plan_limit := 500; -- Default to Basic plan limit
    end if;
    
    return current_count < plan_limit;
end;
$$ language plpgsql security definer;

-- Update can_create_project function
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
        'basic'  -- Changed from 'free' to 'basic'
    )
    where o.id = org_id;
    
    -- Handle null case
    if plan_limit is null then
        plan_limit := 3; -- Default to Basic plan limit
    end if;
    
    return current_count < plan_limit;
end;
$$ language plpgsql security definer;

-- Update get_organization_limits function
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
            'basic'  -- Changed from 'free' to 'basic'
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
        'basic'  -- Changed from 'free' to 'basic'
    )
    where o.id = org_id;
end;
$$ language plpgsql security definer;

-- Update the trial system to start organizations on Basic plan with trial status
-- When creating a new organization, they should have:
-- 1. subscription_plan_id = 'basic'
-- 2. subscription_status = 'trialing' 
-- 3. trial_end = 7 days from creation

-- Add a comment to clarify the new system
comment on column public.organizations.subscription_plan_id is 'Plan ID - either "basic" or "full". New organizations start with "basic" plan on trial.';
comment on column public.organizations.subscription_status is 'Subscription status - "trialing" for new orgs (7 days), then "active" or "canceled"';