-- Combined Security Fixes Migration (Corrected)
-- This migration applies all critical security fixes

-- ============================================
-- 1. Enable RLS on organization_members table
-- ============================================
DO $$ 
BEGIN
    -- Only enable if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'organization_members' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on organization_members table';
    ELSE
        RAISE NOTICE 'RLS already enabled on organization_members table';
    END IF;
END $$;

-- ============================================
-- 2. Enable RLS on app_settings table
-- ============================================
DO $$ 
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'app_settings'
    ) THEN
        -- Only enable if not already enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'app_settings' 
            AND rowsecurity = true
        ) THEN
            ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on app_settings table';
        ELSE
            RAISE NOTICE 'RLS already enabled on app_settings table';
        END IF;
    ELSE
        RAISE NOTICE 'app_settings table does not exist';
    END IF;
END $$;

-- ============================================
-- 3. Add RLS policies for app_settings
-- ============================================
DO $$ 
BEGIN
    -- Only add policies if table exists
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'app_settings'
    ) THEN
        -- Superadmins policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'app_settings' 
            AND policyname = 'Superadmins can manage all app settings'
        ) THEN
            CREATE POLICY "Superadmins can manage all app settings" ON public.app_settings
                FOR ALL USING (public.is_superadmin());
            RAISE NOTICE 'Created superadmins policy for app_settings';
        END IF;

        -- System policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'app_settings' 
            AND policyname = 'System can read app settings'
        ) THEN
            CREATE POLICY "System can read app settings" ON public.app_settings
                FOR SELECT USING (auth.role() = 'postgres');
            RAISE NOTICE 'Created system read policy for app_settings';
        END IF;

        -- Authenticated users policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'app_settings' 
            AND policyname = 'Authenticated users can read public settings'
        ) THEN
            CREATE POLICY "Authenticated users can read public settings" ON public.app_settings
                FOR SELECT USING (
                    auth.role() = 'authenticated' 
                    AND key IN ('default_trial_duration_days', 'max_trial_extensions')
                );
            RAISE NOTICE 'Created authenticated users policy for app_settings';
        END IF;
    END IF;
END $$;

-- ============================================
-- 4. Fix organization_trial_status view
-- ============================================
DROP VIEW IF EXISTS public.organization_trial_status;

CREATE OR REPLACE VIEW public.organization_trial_status AS
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

-- Grant permissions on the view
GRANT SELECT ON public.organization_trial_status TO authenticated;

-- ============================================
-- 5. Fix function search paths
-- ============================================
DO $$ 
DECLARE
    func RECORD;
    func_count INTEGER := 0;
BEGIN
    -- Fix all SECURITY DEFINER functions
    FOR func IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND (p.proconfig IS NULL OR NOT (p.proconfig::text[] @> ARRAY['search_path=']))
    LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func.func_signature);
        func_count := func_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Fixed search_path for % SECURITY DEFINER functions', func_count;
    RAISE NOTICE 'Recreated organization_trial_status view without SECURITY DEFINER';
END $$;

-- ============================================
-- 6. Final verification
-- ============================================
DO $$ 
DECLARE
    rls_count INTEGER;
    func_count INTEGER;
BEGIN
    -- Count tables with RLS disabled
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('organization_members', 'app_settings')
    AND rowsecurity = false;
    
    -- Count functions without search_path
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT (p.proconfig::text[] @> ARRAY['search_path=']));
    
    RAISE NOTICE '=== Security Fix Summary ===';
    RAISE NOTICE 'Tables with RLS disabled: %', rls_count;
    RAISE NOTICE 'Functions without search_path: %', func_count;
    
    IF rls_count = 0 AND func_count = 0 THEN
        RAISE NOTICE '✅ All security issues have been fixed!';
    ELSE
        RAISE WARNING '⚠️  Some security issues remain. Check the Supabase Linter.';
    END IF;
END $$;

-- ============================================
-- 7. Show final status
-- ============================================
SELECT 
    'RLS Status Check' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organization_members', 'app_settings')

UNION ALL

SELECT 
    'View Security Check' as check_type,
    'organization_trial_status' as tablename,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_views v
            JOIN pg_class c ON c.relname = v.viewname
            WHERE v.schemaname = 'public' 
            AND v.viewname = 'organization_trial_status'
            AND NOT c.relrowsecurity
        ) THEN '✅ Fixed (no SECURITY DEFINER)' 
        ELSE '❌ Still has issues' 
    END as rls_status

ORDER BY check_type, tablename;