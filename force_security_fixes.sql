-- Force Apply Security Fixes
-- This script forcefully applies all security fixes without conditions

-- ============================================
-- 1. Check current RLS status BEFORE changes
-- ============================================
SELECT 
    'BEFORE FIX' as status,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organization_members', 'app_settings');

-- ============================================
-- 2. FORCE Enable RLS (no conditions)
-- ============================================
-- Force enable on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Force enable on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Add missing RLS policies for app_settings
-- ============================================
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Superadmins can manage all app settings" ON public.app_settings;
DROP POLICY IF EXISTS "System can read app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can read public settings" ON public.app_settings;

-- Recreate policies
CREATE POLICY "Superadmins can manage all app settings" ON public.app_settings
    FOR ALL USING (public.is_superadmin());

CREATE POLICY "System can read app settings" ON public.app_settings
    FOR SELECT USING (auth.role() = 'postgres');

CREATE POLICY "Authenticated users can read public settings" ON public.app_settings
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND key IN ('default_trial_duration_days', 'max_trial_extensions')
    );

-- ============================================
-- 4. Fix organization_trial_status view
-- ============================================
-- First check if it exists with SECURITY DEFINER
SELECT 
    'CURRENT VIEW' as check_type,
    v.viewname,
    pg_get_viewdef(c.oid) as view_definition,
    c.relrowsecurity as has_security_definer
FROM pg_views v
JOIN pg_class c ON c.relname = v.viewname AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = v.schemaname)
WHERE v.schemaname = 'public' 
AND v.viewname = 'organization_trial_status';

-- Drop the view completely
DROP VIEW IF EXISTS public.organization_trial_status CASCADE;

-- Recreate without SECURITY DEFINER (using explicit syntax)
CREATE VIEW public.organization_trial_status 
WITH (security_invoker = true) AS
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

-- ============================================
-- 5. Fix ALL function search paths at once
-- ============================================
DO $$ 
DECLARE
    func_rec RECORD;
    total_fixed INTEGER := 0;
BEGIN
    -- Loop through all SECURITY DEFINER functions
    FOR func_rec IN 
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments,
            p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
    LOOP
        -- Fix search path for each function
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''''', 
                      func_rec.function_name, 
                      func_rec.arguments);
        total_fixed := total_fixed + 1;
    END LOOP;
    
    RAISE NOTICE 'Fixed search_path for % functions', total_fixed;
END $$;

-- ============================================
-- 6. Verify RLS is now enabled
-- ============================================
SELECT 
    'AFTER FIX' as status,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED' 
        ELSE '❌ STILL DISABLED - MANUAL FIX NEEDED' 
    END as result
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organization_members', 'app_settings')
ORDER BY tablename;

-- ============================================
-- 7. Verify view is fixed
-- ============================================
SELECT 
    'VIEW CHECK' as check_type,
    v.viewname,
    CASE 
        WHEN pg_get_viewdef(c.oid) LIKE '%SECURITY DEFINER%' THEN '❌ Still has SECURITY DEFINER'
        ELSE '✅ Fixed - No SECURITY DEFINER'
    END as status
FROM pg_views v
JOIN pg_class c ON c.relname = v.viewname AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = v.schemaname)
WHERE v.schemaname = 'public' 
AND v.viewname = 'organization_trial_status';

-- ============================================
-- 8. List any remaining issues
-- ============================================
SELECT 
    'REMAINING ISSUES' as check_type,
    COUNT(*) as count,
    string_agg(tablename, ', ') as tables_without_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
AND tablename IN ('organization_members', 'app_settings');

-- ============================================
-- 9. If still not working, show manual commands
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MANUAL FIX COMMANDS (if needed) ===';
    RAISE NOTICE 'Run these one by one if the above didn''t work:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Enable RLS manually:';
    RAISE NOTICE '   ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;';
    RAISE NOTICE '   ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;';
    RAISE NOTICE '';
    RAISE NOTICE '2. Check if enabled:';
    RAISE NOTICE '   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN (''organization_members'', ''app_settings'');';
    RAISE NOTICE '';
    RAISE NOTICE '3. For the view, try:';
    RAISE NOTICE '   DROP VIEW public.organization_trial_status CASCADE;';
    RAISE NOTICE '   Then recreate it from the script above.';
END $$;