-- Apply function security fixes
-- This updates all SECURITY DEFINER functions to include SET search_path = ''

-- 1. Fix critical functions that definitely need search_path
DO $$ 
BEGIN
    -- Fix handle_new_user if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = ''''';
    END IF;

    -- Fix get_trial_days_remaining if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_trial_days_remaining') THEN
        EXECUTE 'ALTER FUNCTION public.get_trial_days_remaining(UUID) SET search_path = ''''';
    END IF;

    -- Fix is_organization_in_trial if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_organization_in_trial') THEN
        EXECUTE 'ALTER FUNCTION public.is_organization_in_trial(UUID) SET search_path = ''''';
    END IF;

    -- Fix is_superadmin if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_superadmin') THEN
        EXECUTE 'ALTER FUNCTION public.is_superadmin() SET search_path = ''''';
    END IF;

    -- Fix generate_project_api_key if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_project_api_key') THEN
        EXECUTE 'ALTER FUNCTION public.generate_project_api_key() SET search_path = ''''';
    END IF;

    -- Fix sync_trial_dates if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_trial_dates') THEN
        EXECUTE 'ALTER FUNCTION public.sync_trial_dates() SET search_path = ''''';
    END IF;

    -- Fix update_updated_at_column if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = ''''';
    END IF;

    -- Fix increment_feedback_count if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_feedback_count') THEN
        EXECUTE 'ALTER FUNCTION public.increment_feedback_count() SET search_path = ''''';
    END IF;

    -- Fix track_feedback_usage if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_feedback_usage') THEN
        EXECUTE 'ALTER FUNCTION public.track_feedback_usage() SET search_path = ''''';
    END IF;
END $$;

-- 2. List all SECURITY DEFINER functions to verify they have search_path set
SELECT 
    p.proname as function_name,
    CASE 
        WHEN p.proconfig IS NULL OR NOT (p.proconfig::text[] @> ARRAY['search_path=']) 
        THEN 'MISSING search_path'
        ELSE 'OK - has search_path'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true
ORDER BY function_name;