-- Storage tracking implementation for VibeQA
-- This migration adds storage usage tracking and enforcement

-- Function to increment storage usage when files are uploaded
create or replace function increment_storage_usage()
returns trigger as $$
declare
    org_id uuid;
begin
    -- Get organization_id from the feedback->project relationship
    select p.organization_id into org_id
    from public.feedback f
    join public.projects p on p.id = f.project_id
    where f.id = new.feedback_id;
    
    -- Update or insert storage usage for the organization
    insert into public.organization_usage (organization_id, month, storage_bytes)
    values (org_id, date_trunc('month', now())::date, coalesce(new.file_size, 0))
    on conflict (organization_id, month)
    do update set 
        storage_bytes = public.organization_usage.storage_bytes + coalesce(new.file_size, 0),
        updated_at = now();
    
    return new;
end;
$$ language plpgsql security definer;

-- Function to decrement storage usage when files are deleted
create or replace function decrement_storage_usage()
returns trigger as $$
declare
    org_id uuid;
begin
    -- Get organization_id from the feedback->project relationship
    select p.organization_id into org_id
    from public.feedback f
    join public.projects p on p.id = f.project_id
    where f.id = old.feedback_id;
    
    -- Update storage usage for the organization
    update public.organization_usage
    set storage_bytes = greatest(0, storage_bytes - coalesce(old.file_size, 0)),
        updated_at = now()
    where organization_id = org_id
    and month = date_trunc('month', now())::date;
    
    return old;
end;
$$ language plpgsql security definer;

-- Function to check if organization can upload a file of given size
create or replace function can_upload_file(org_id uuid, file_size_bytes bigint)
returns boolean as $$
declare
    current_usage bigint;
    storage_limit_gb integer;
    storage_limit_bytes bigint;
begin
    -- Get current storage usage (cumulative, not just current month)
    select coalesce(sum(storage_bytes), 0) into current_usage
    from public.organization_usage
    where organization_id = org_id;
    
    -- Get storage limit from plan
    select (sp.limits->>'storageGB')::integer into storage_limit_gb
    from public.organizations o
    left join public.subscription_plans sp on sp.id = coalesce(
        (select plan_id from public.organization_subscriptions where organization_id = o.id),
        o.subscription_plan_id,
        'free'
    )
    where o.id = org_id;
    
    -- -1 means unlimited
    if storage_limit_gb = -1 then
        return true;
    end if;
    
    -- Convert GB to bytes (1GB = 1073741824 bytes)
    storage_limit_bytes := storage_limit_gb::bigint * 1073741824;
    
    -- Check if adding this file would exceed the limit
    return (current_usage + file_size_bytes) <= storage_limit_bytes;
end;
$$ language plpgsql security definer;

-- Function to get organization's current storage usage
create or replace function get_organization_storage_usage(org_id uuid)
returns table (
    usage_bytes bigint,
    usage_gb numeric,
    limit_gb integer,
    percentage_used numeric
) as $$
declare
    storage_limit_gb integer;
begin
    -- Get storage limit from plan
    select (sp.limits->>'storageGB')::integer into storage_limit_gb
    from public.organizations o
    left join public.subscription_plans sp on sp.id = coalesce(
        (select plan_id from public.organization_subscriptions where organization_id = o.id),
        o.subscription_plan_id,
        'free'
    )
    where o.id = org_id;
    
    return query
    select 
        coalesce(sum(ou.storage_bytes), 0) as usage_bytes,
        round((coalesce(sum(ou.storage_bytes), 0)::numeric / 1073741824)::numeric, 2) as usage_gb,
        storage_limit_gb as limit_gb,
        case 
            when storage_limit_gb = -1 then 0
            when storage_limit_gb = 0 then 100
            else round((coalesce(sum(ou.storage_bytes), 0)::numeric / (storage_limit_gb * 1073741824))::numeric * 100, 2)
        end as percentage_used
    from public.organization_usage ou
    where ou.organization_id = org_id;
end;
$$ language plpgsql security definer;

-- Create triggers for storage tracking
drop trigger if exists on_feedback_media_insert on public.feedback_media;
create trigger on_feedback_media_insert
    after insert on public.feedback_media
    for each row
    execute function increment_storage_usage();

drop trigger if exists on_feedback_media_delete on public.feedback_media;
create trigger on_feedback_media_delete
    after delete on public.feedback_media
    for each row
    execute function decrement_storage_usage();

-- Function to enforce storage limits on feedback_media inserts
create or replace function check_storage_limit()
returns trigger as $$
declare
    org_id uuid;
    can_upload boolean;
begin
    -- Get organization_id from the feedback->project relationship
    select p.organization_id into org_id
    from public.feedback f
    join public.projects p on p.id = f.project_id
    where f.id = new.feedback_id;
    
    -- Check if organization can upload this file
    select can_upload_file(org_id, new.file_size) into can_upload;
    
    if not can_upload then
        raise exception 'Storage limit exceeded for organization';
    end if;
    
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to enforce storage limits
drop trigger if exists before_feedback_media_insert on public.feedback_media;
create trigger before_feedback_media_insert
    before insert on public.feedback_media
    for each row
    execute function check_storage_limit();

-- Update get_organization_limits function to include storage usage
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
            (select round((sum(storage_bytes)::numeric / 1073741824)::numeric, 2) 
             from public.organization_usage 
             where organization_id = org_id), 
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

-- Grant execute permissions
grant execute on function can_upload_file to authenticated;
grant execute on function get_organization_storage_usage to authenticated;
grant execute on function get_organization_limits to authenticated;

-- Add index for performance
create index if not exists idx_organization_usage_org_id on public.organization_usage(organization_id);
create index if not exists idx_feedback_media_file_size on public.feedback_media(file_size);