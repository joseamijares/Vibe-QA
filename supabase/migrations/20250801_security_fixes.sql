-- Migration: Security Fixes for RLS and SECURITY DEFINER Issues
-- Created: 2025-08-01
-- Purpose: Fix critical security issues identified by Supabase linter

-- ============================================
-- 1. Enable RLS on organization_members table
-- ============================================
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Enable RLS on app_settings table and add policies
-- ============================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_settings table
-- Allow superadmins to manage all settings
CREATE POLICY "Superadmins can manage all app settings" ON public.app_settings
  FOR ALL USING (public.is_superadmin());

-- Allow system to read settings (for functions running as postgres)
CREATE POLICY "System can read app settings" ON public.app_settings
  FOR SELECT USING (auth.role() = 'postgres');

-- Allow authenticated users to read non-sensitive settings
CREATE POLICY "Authenticated users can read public settings" ON public.app_settings
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND key IN ('default_trial_duration_days', 'max_trial_extensions')
  );

-- ============================================
-- 3. Fix organization_trial_status view
-- ============================================
-- Drop the existing view with SECURITY DEFINER
DROP VIEW IF EXISTS public.organization_trial_status;

-- Recreate without SECURITY DEFINER (regular view inherits caller's permissions)
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

-- Grant appropriate permissions
GRANT SELECT ON public.organization_trial_status TO authenticated;

-- ============================================
-- 4. Fix critical SECURITY DEFINER functions with search_path
-- ============================================

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  org_id UUID;
  default_trial_days INTEGER;
BEGIN
  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  -- Get default trial duration
  SELECT COALESCE((SELECT value::integer FROM public.app_settings WHERE key = 'default_trial_duration_days'), 7)
  INTO default_trial_days;

  -- Create organization with trial
  INSERT INTO public.organizations (name, owner_id, trial_started_at, trial_expires_at)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'organization_name', SPLIT_PART(NEW.email, '@', 1) || '''s Organization'),
    NEW.id,
    NOW(),
    NOW() + INTERVAL '1 day' * default_trial_days
  )
  RETURNING id INTO org_id;

  -- Create organization membership as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix get_trial_days_remaining function
CREATE OR REPLACE FUNCTION public.get_trial_days_remaining(org_id UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  days_remaining INTEGER;
BEGIN
  SELECT 
    CASE 
      WHEN o.stripe_subscription_status IN ('active', 'trialing') THEN NULL
      WHEN o.trial_expires_at IS NULL THEN 0
      WHEN o.trial_expires_at < NOW() THEN 0
      ELSE EXTRACT(EPOCH FROM (o.trial_expires_at - NOW())) / 86400
    END::integer
  INTO days_remaining
  FROM public.organizations o
  WHERE o.id = org_id;

  RETURN COALESCE(days_remaining, 0);
END;
$$ LANGUAGE plpgsql;

-- Fix is_organization_in_trial function
CREATE OR REPLACE FUNCTION public.is_organization_in_trial(org_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  in_trial BOOLEAN;
BEGIN
  SELECT 
    CASE 
      WHEN o.stripe_subscription_status IN ('active', 'trialing') THEN FALSE
      WHEN o.trial_expires_at IS NULL THEN FALSE
      WHEN o.trial_expires_at > NOW() THEN TRUE
      ELSE FALSE
    END
  INTO in_trial
  FROM public.organizations o
  WHERE o.id = org_id;

  RETURN COALESCE(in_trial, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Fix sync_trial_dates function
CREATE OR REPLACE FUNCTION public.sync_trial_dates()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- When subscription trial_ends_at changes, update organization trial_expires_at
  IF NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at THEN
    UPDATE public.organizations
    SET trial_expires_at = NEW.trial_ends_at::timestamptz
    WHERE stripe_subscription_id = NEW.stripe_subscription_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix is_superadmin function
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_superadmin = true
  );
END;
$$ LANGUAGE plpgsql;

-- Fix generate_project_api_key function
CREATE OR REPLACE FUNCTION public.generate_project_api_key()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  api_key TEXT;
BEGIN
  -- Generate a secure random API key with prefix
  api_key := 'proj_' || encode(gen_random_bytes(32), 'hex');
  RETURN api_key;
END;
$$ LANGUAGE plpgsql;

-- Fix increment_feedback_count function
CREATE OR REPLACE FUNCTION public.increment_feedback_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.projects
  SET feedback_count = feedback_count + 1
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix track_feedback_usage function
CREATE OR REPLACE FUNCTION public.track_feedback_usage()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update organization usage tracking
  INSERT INTO public.usage_tracking (organization_id, feedback_count, month_year)
  VALUES (
    (SELECT organization_id FROM public.projects WHERE id = NEW.project_id),
    1,
    DATE_TRUNC('month', NOW())
  )
  ON CONFLICT (organization_id, month_year)
  DO UPDATE SET 
    feedback_count = usage_tracking.feedback_count + 1,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Verify all tables have RLS enabled
-- ============================================
-- This query helps verify RLS is enabled on all public tables
-- Run this query to check: SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;

-- ============================================
-- 6. Add comment explaining the security fixes
-- ============================================
COMMENT ON TABLE public.app_settings IS 'Application settings table with RLS enabled - only superadmins can modify';
COMMENT ON VIEW public.organization_trial_status IS 'View for checking organization trial status - uses caller permissions';