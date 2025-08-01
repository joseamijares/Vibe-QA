-- Quick fix for Supabase security issues
-- Run this in SQL Editor

-- 1. Enable RLS on organization_members table
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on app_settings table
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 3. Add basic RLS policies for app_settings if they don't exist
DO $$ 
BEGIN
    -- Check if policies exist before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'app_settings' 
        AND policyname = 'Superadmins can manage all app settings'
    ) THEN
        CREATE POLICY "Superadmins can manage all app settings" ON public.app_settings
            FOR ALL USING (public.is_superadmin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'app_settings' 
        AND policyname = 'System can read app settings'
    ) THEN
        CREATE POLICY "System can read app settings" ON public.app_settings
            FOR SELECT USING (auth.role() = 'postgres');
    END IF;

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
    END IF;
END $$;

-- 4. Fix organization_trial_status view (remove SECURITY DEFINER)
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

-- 5. Verify RLS is enabled
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organization_members', 'app_settings')
ORDER BY tablename;