-- Enforce usage limits for feedback and projects

-- Function to increment feedback count when feedback is submitted
create or replace function increment_feedback_count()
returns trigger as $$
declare
    org_id uuid;
    current_month date;
begin
    -- Get organization_id from the project
    select organization_id into org_id
    from public.projects
    where id = new.project_id;
    
    -- Get current month
    current_month := date_trunc('month', now())::date;
    
    -- Insert or update organization usage
    insert into public.organization_usage (
        organization_id, 
        month, 
        feedback_count,
        project_count
    )
    values (
        org_id, 
        current_month, 
        1,
        (select count(*) from public.projects where organization_id = org_id)
    )
    on conflict (organization_id, month)
    do update set 
        feedback_count = COALESCE(organization_usage.feedback_count, 0) + 1,
        updated_at = now();
    
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to increment feedback count on new feedback
drop trigger if exists increment_feedback_count_trigger on public.feedback;
create trigger increment_feedback_count_trigger
    after insert on public.feedback
    for each row
    execute function increment_feedback_count();

-- Function to check if feedback can be submitted (with proper limit checking)
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

-- RLS policy to prevent project creation when at limit
create or replace function check_project_limit()
returns trigger as $$
declare
    can_create boolean;
begin
    -- Check if organization can create more projects
    select can_create_project(new.organization_id) into can_create;
    
    if not can_create then
        raise exception 'Project limit reached for your subscription plan';
    end if;
    
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to enforce project limits
drop trigger if exists enforce_project_limit on public.projects;
create trigger enforce_project_limit
    before insert on public.projects
    for each row
    execute function check_project_limit();

-- Fix the Full plan feedback limit (should be 2,000 not 10,000)
update public.subscription_plans
set limits = jsonb_set(limits, '{feedbackPerMonth}', '2000')
where id = 'full';

-- Update plan features to match the correct limits
update public.subscription_plans
set features = '["10 projects", "2,000 feedback per month", "Premium support", "All feedback types", "Unlimited data retention", "Advanced analytics", "Slack integration", "Custom branding", "API access"]'::jsonb
where id = 'full';

-- Grant necessary permissions
grant execute on function increment_feedback_count to authenticated;
grant execute on function check_project_limit to authenticated;