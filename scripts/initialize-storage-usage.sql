-- Script to initialize storage usage for existing organizations
-- This script calculates the current storage usage based on existing feedback_media records

-- Create a temporary function to calculate and update storage for each organization
create or replace function initialize_organization_storage()
returns void as $$
declare
    org record;
    total_storage bigint;
begin
    -- Loop through all organizations
    for org in select id from public.organizations loop
        -- Calculate total storage used by this organization
        select coalesce(sum(fm.file_size), 0) into total_storage
        from public.feedback_media fm
        join public.feedback f on f.id = fm.feedback_id
        join public.projects p on p.id = f.project_id
        where p.organization_id = org.id
        and fm.file_size is not null;
        
        -- Insert or update the organization usage record
        if total_storage > 0 then
            insert into public.organization_usage (
                organization_id, 
                month, 
                storage_bytes,
                created_at,
                updated_at
            )
            values (
                org.id,
                date_trunc('month', now())::date,
                total_storage,
                now(),
                now()
            )
            on conflict (organization_id, month) 
            do update set 
                storage_bytes = excluded.storage_bytes,
                updated_at = now();
            
            raise notice 'Organization % - Storage: % bytes (% GB)', 
                org.id, 
                total_storage, 
                round((total_storage::numeric / 1073741824)::numeric, 2);
        end if;
    end loop;
end;
$$ language plpgsql;

-- Execute the initialization
select initialize_organization_storage();

-- Drop the temporary function
drop function initialize_organization_storage();

-- Show summary of storage usage by organization
select 
    o.name as organization_name,
    o.subscription_plan_id as plan,
    coalesce(sum(ou.storage_bytes), 0) as total_storage_bytes,
    round((coalesce(sum(ou.storage_bytes), 0)::numeric / 1073741824)::numeric, 2) as total_storage_gb,
    (select (limits->>'storageGB')::integer 
     from subscription_plans 
     where id = coalesce(o.subscription_plan_id, 'free')) as storage_limit_gb
from public.organizations o
left join public.organization_usage ou on ou.organization_id = o.id
group by o.id, o.name, o.subscription_plan_id
order by total_storage_bytes desc;

-- Show organizations approaching or exceeding their storage limits
select 
    o.name as organization_name,
    o.subscription_plan_id as plan,
    round((coalesce(sum(ou.storage_bytes), 0)::numeric / 1073741824)::numeric, 2) as usage_gb,
    (select (limits->>'storageGB')::integer 
     from subscription_plans 
     where id = coalesce(o.subscription_plan_id, 'free')) as limit_gb,
    case 
        when (select (limits->>'storageGB')::integer 
              from subscription_plans 
              where id = coalesce(o.subscription_plan_id, 'free')) = -1 then 'Unlimited'
        else round((coalesce(sum(ou.storage_bytes), 0)::numeric / 
                   ((select (limits->>'storageGB')::integer 
                     from subscription_plans 
                     where id = coalesce(o.subscription_plan_id, 'free')) * 1073741824))::numeric * 100, 2)::text || '%'
    end as usage_percentage
from public.organizations o
left join public.organization_usage ou on ou.organization_id = o.id
group by o.id, o.name, o.subscription_plan_id
having coalesce(sum(ou.storage_bytes), 0) > 0
order by 
    case 
        when (select (limits->>'storageGB')::integer 
              from subscription_plans 
              where id = coalesce(o.subscription_plan_id, 'free')) = -1 then 0
        else coalesce(sum(ou.storage_bytes), 0)::numeric / 
             ((select (limits->>'storageGB')::integer 
               from subscription_plans 
               where id = coalesce(o.subscription_plan_id, 'free')) * 1073741824)
    end desc;