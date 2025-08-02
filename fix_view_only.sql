-- Fix organization_trial_status view ONLY
-- This specifically addresses the SECURITY DEFINER issue

-- Drop the existing view
DROP VIEW IF EXISTS public.organization_trial_status CASCADE;

-- Recreate without SECURITY DEFINER
CREATE VIEW public.organization_trial_status AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.trial_started_at,
    o.trial_expires_at,
    o.stripe_subscription_id,
    o.stripe_subscription_status,
    CASE 
        WHEN o.stripe_subscription_status IN ('active', 'trialing') THEN false
        WHEN o.trial_expires_at IS NULL THEN false
        WHEN o.trial_expires_at > NOW() THEN false
        ELSE true
    END as is_trial_expired,
    CASE 
        WHEN o.trial_expires_at IS NULL THEN 0
        WHEN o.trial_expires_at < NOW() THEN 0
        ELSE EXTRACT(EPOCH FROM (o.trial_expires_at - NOW())) / 86400
    END::integer as trial_days_remaining
FROM organizations o;

-- Grant permissions
GRANT SELECT ON public.organization_trial_status TO authenticated;
GRANT SELECT ON public.organization_trial_status TO anon;

-- Verify the view doesn't have SECURITY DEFINER
SELECT 
    'organization_trial_status' as view_name,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ Still has SECURITY DEFINER'
        ELSE '✅ Fixed - No SECURITY DEFINER'
    END as status
FROM pg_views
WHERE schemaname = 'public' 
AND viewname = 'organization_trial_status';