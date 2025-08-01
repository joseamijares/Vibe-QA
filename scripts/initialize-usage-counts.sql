-- Initialize usage counts for existing organizations

-- Initialize project counts for all organizations
insert into public.organization_usage (organization_id, month, project_count, feedback_count)
select 
    o.id,
    date_trunc('month', now())::date,
    (select count(*) from public.projects where organization_id = o.id),
    coalesce(
        (select count(*) 
         from public.feedback f
         join public.projects p on p.id = f.project_id
         where p.organization_id = o.id
         and f.created_at >= date_trunc('month', now())
        ), 0
    )
from public.organizations o
on conflict (organization_id, month) 
do update set
    project_count = excluded.project_count,
    feedback_count = excluded.feedback_count,
    updated_at = now();

-- Show current usage for all organizations
select 
    o.name as organization,
    o.subscription_plan_id as plan,
    ou.project_count,
    sp.limits->>'projects' as project_limit,
    ou.feedback_count,
    sp.limits->>'feedbackPerMonth' as feedback_limit
from public.organizations o
left join public.organization_usage ou on ou.organization_id = o.id 
    and ou.month = date_trunc('month', now())::date
left join public.subscription_plans sp on sp.id = coalesce(
    (select plan_id from public.organization_subscriptions where organization_id = o.id),
    o.subscription_plan_id,
    'free'
)
order by o.created_at desc;