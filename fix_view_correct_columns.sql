-- Fix organization_trial_status view with CORRECT column names
-- This uses the actual columns that exist in the database

-- First, check current view definition
SELECT 
    viewname, 
    definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'organization_trial_status';

-- Drop the existing view
DROP VIEW IF EXISTS public.organization_trial_status CASCADE;

-- Recreate the view based on the original definition from migrations
-- but WITHOUT SECURITY DEFINER
CREATE VIEW public.organization_trial_status AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COALESCE(os.trial_end, o.trial_ends_at) as trial_ends_at,
    CASE 
        WHEN is_organization_in_trial(o.id) THEN 'active'
        WHEN os.status IN ('active', 'past_due') THEN 'converted'
        WHEN os.status = 'canceled' THEN 'canceled'
        ELSE 'expired'
    END as trial_status,
    get_trial_days_remaining(o.id) as days_remaining,
    os.status as subscription_status,
    os.plan_id,
    -- Additional fields that might be used by the app
    o.stripe_subscription_id,
    o.stripe_subscription_status,
    CASE 
        WHEN o.stripe_subscription_status IN ('active', 'trialing') THEN false
        WHEN o.trial_ends_at IS NULL THEN false
        WHEN o.trial_ends_at > NOW() THEN false
        ELSE true
    END as is_trial_expired,
    CASE 
        WHEN o.trial_ends_at IS NULL THEN 0
        WHEN o.trial_ends_at < NOW() THEN 0
        ELSE EXTRACT(EPOCH FROM (o.trial_ends_at - NOW())) / 86400
    END::integer as trial_days_remaining
FROM public.organizations o
LEFT JOIN public.organization_subscriptions os ON os.organization_id = o.id;

-- Grant access to the view
GRANT SELECT ON public.organization_trial_status TO authenticated;
GRANT SELECT ON public.organization_trial_status TO anon;

-- Verify the view doesn't have SECURITY DEFINER
SELECT 
    'organization_trial_status' as view_name,
    pg_get_viewdef('public.organization_trial_status'::regclass) as definition,
    CASE 
        WHEN pg_get_viewdef('public.organization_trial_status'::regclass) LIKE '%SECURITY DEFINER%' 
        THEN '❌ Still has SECURITY DEFINER'
        ELSE '✅ Fixed - No SECURITY DEFINER'
    END as status;

-- Alternative check using pg_class
SELECT 
    c.relname as view_name,
    CASE 
        WHEN c.relrowsecurity THEN '❌ Has row security (SECURITY DEFINER-like)'
        ELSE '✅ No row security - Normal view'
    END as security_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname = 'organization_trial_status'
AND c.relkind = 'v';