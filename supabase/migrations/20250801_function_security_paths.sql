-- Migration: Fix remaining SECURITY DEFINER functions with search_path
-- Created: 2025-08-01
-- Purpose: Add SET search_path = '' to all remaining SECURITY DEFINER functions

-- ============================================
-- Fix update_updated_at_column function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix create_organization_for_user function
-- ============================================
CREATE OR REPLACE FUNCTION public.create_organization_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  org_id UUID;
  default_trial_days INTEGER;
BEGIN
  -- Get default trial duration from app_settings
  SELECT COALESCE(
    (SELECT value::integer FROM public.app_settings WHERE key = 'default_trial_duration_days'),
    7
  ) INTO default_trial_days;

  -- Create organization with trial period
  INSERT INTO public.organizations (
    name, 
    owner_id, 
    trial_started_at, 
    trial_expires_at
  )
  VALUES (
    NEW.email || '''s Organization',
    NEW.id,
    NOW(),
    NOW() + INTERVAL '1 day' * default_trial_days
  )
  RETURNING id INTO org_id;

  -- Add user as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix log_superadmin_action function
-- ============================================
CREATE OR REPLACE FUNCTION public.log_superadmin_action(
  p_action_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.superadmin_audit_logs (
    user_id,
    action_type,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_description,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix validate_coupon function
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code TEXT, p_organization_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
BEGIN
  -- Find active coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = UPPER(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired coupon');
  END IF;

  -- Check usage limit
  IF v_coupon.max_uses IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.coupon_uses
    WHERE coupon_id = v_coupon.id;

    IF v_usage_count >= v_coupon.max_uses THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Coupon usage limit reached');
    END IF;
  END IF;

  -- Check if already used by this organization
  IF EXISTS (
    SELECT 1 FROM public.coupon_uses
    WHERE coupon_id = v_coupon.id
      AND organization_id = p_organization_id
  ) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon already used');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'description', v_coupon.description
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix apply_coupon function
-- ============================================
CREATE OR REPLACE FUNCTION public.apply_coupon(p_code TEXT, p_organization_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_validation JSONB;
  v_coupon_id UUID;
BEGIN
  -- Validate coupon first
  v_validation := public.validate_coupon(p_code, p_organization_id);
  
  IF NOT (v_validation->>'valid')::boolean THEN
    RETURN v_validation;
  END IF;

  v_coupon_id := (v_validation->>'coupon_id')::uuid;

  -- Record usage
  INSERT INTO public.coupon_uses (coupon_id, organization_id, used_by)
  VALUES (v_coupon_id, p_organization_id, auth.uid());

  -- Update organization with coupon info
  UPDATE public.organizations
  SET 
    stripe_coupon_id = v_coupon_id::text,
    updated_at = NOW()
  WHERE id = p_organization_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Coupon applied successfully',
    'discount_type', v_validation->>'discount_type',
    'discount_value', v_validation->>'discount_value'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix calculate_revenue_metrics function
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_revenue_metrics(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  total_revenue NUMERIC,
  mrr NUMERIC,
  active_subscriptions INTEGER,
  new_subscriptions INTEGER,
  churned_subscriptions INTEGER,
  trial_conversions INTEGER
)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH revenue_data AS (
    SELECT 
      SUM(amount) FILTER (WHERE status = 'succeeded') as total,
      COUNT(DISTINCT organization_id) FILTER (
        WHERE status = 'succeeded' 
        AND date_trunc('month', created_at) = date_trunc('month', p_end_date)
      ) as active_subs,
      COUNT(*) FILTER (
        WHERE status = 'succeeded' 
        AND created_at >= p_start_date 
        AND created_at <= p_end_date
        AND is_first_payment = true
      ) as new_subs
    FROM public.payments
    WHERE created_at >= p_start_date AND created_at <= p_end_date
  ),
  mrr_calc AS (
    SELECT SUM(
      CASE plan
        WHEN 'basic' THEN 5.00
        WHEN 'full' THEN 14.00
        WHEN 'enterprise' THEN 49.00
        ELSE 0
      END
    ) as monthly_recurring
    FROM public.organizations
    WHERE stripe_subscription_status = 'active'
  ),
  churn_data AS (
    SELECT COUNT(*) as churned
    FROM public.subscriptions
    WHERE status = 'canceled'
      AND updated_at >= p_start_date 
      AND updated_at <= p_end_date
  ),
  trial_data AS (
    SELECT COUNT(*) as converted
    FROM public.organizations
    WHERE stripe_subscription_id IS NOT NULL
      AND trial_expires_at IS NOT NULL
      AND created_at >= p_start_date 
      AND created_at <= p_end_date
  )
  SELECT 
    COALESCE(rd.total, 0)::NUMERIC,
    COALESCE(mc.monthly_recurring, 0)::NUMERIC,
    COALESCE(rd.active_subs, 0)::INTEGER,
    COALESCE(rd.new_subs, 0)::INTEGER,
    COALESCE(cd.churned, 0)::INTEGER,
    COALESCE(td.converted, 0)::INTEGER
  FROM revenue_data rd
  CROSS JOIN mrr_calc mc
  CROSS JOIN churn_data cd
  CROSS JOIN trial_data td;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix record_system_metrics function
-- ============================================
CREATE OR REPLACE FUNCTION public.record_system_metrics()
RETURNS VOID
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_metrics JSONB;
BEGIN
  -- Collect various system metrics
  v_metrics := jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_organizations', (SELECT COUNT(*) FROM public.organizations),
    'active_subscriptions', (
      SELECT COUNT(*) FROM public.organizations 
      WHERE stripe_subscription_status = 'active'
    ),
    'total_projects', (SELECT COUNT(*) FROM public.projects),
    'total_feedback', (SELECT COUNT(*) FROM public.feedback),
    'storage_usage_mb', (
      SELECT COALESCE(SUM(size) / 1024 / 1024, 0)::INTEGER 
      FROM storage.objects
    )
  );

  INSERT INTO public.system_metrics (
    metric_type,
    value,
    metadata
  ) VALUES (
    'daily_snapshot',
    (v_metrics->>'total_organizations')::INTEGER,
    v_metrics
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix get_all_users_with_organizations function
-- ============================================
CREATE OR REPLACE FUNCTION public.get_all_users_with_organizations()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  organization_id UUID,
  organization_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only superadmins can call this function
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    o.id,
    o.name,
    om.role,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.organization_members om ON om.user_id = p.id
  LEFT JOIN public.organizations o ON o.id = om.organization_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix delete_user_as_superadmin function
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_user_as_superadmin(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only superadmins can call this function
  IF NOT public.is_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;

  -- Log the action
  PERFORM public.log_superadmin_action(
    'delete_user',
    'Deleted user ' || p_user_id,
    jsonb_build_object('deleted_user_id', p_user_id)
  );

  -- Delete from auth.users (cascades to profiles and other tables)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix create_user_as_superadmin function
-- ============================================
CREATE OR REPLACE FUNCTION public.create_user_as_superadmin(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_organization_name TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Only superadmins can call this function
  IF NOT public.is_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;

  -- This is a placeholder - actual user creation should be done through Supabase Admin API
  -- For now, return an error indicating the proper method
  RETURN jsonb_build_object(
    'success', false, 
    'error', 'User creation must be done through Supabase Admin API'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix update_profiles_updated_at function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix can_extend_trial function
-- ============================================
CREATE OR REPLACE FUNCTION public.can_extend_trial(p_organization_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_extensions INTEGER;
  v_max_extensions INTEGER;
BEGIN
  -- Get current extension count
  SELECT trial_extension_count INTO v_extensions
  FROM public.organizations
  WHERE id = p_organization_id;

  -- Get max extensions allowed
  SELECT COALESCE(
    (SELECT value::integer FROM public.app_settings WHERE key = 'max_trial_extensions'),
    1
  ) INTO v_max_extensions;

  RETURN COALESCE(v_extensions, 0) < v_max_extensions;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix create_test_user function (if exists)
-- ============================================
DROP FUNCTION IF EXISTS public.create_test_user();

-- ============================================
-- Fix handle_new_user_safe function
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  BEGIN
    PERFORM public.handle_new_user();
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user_safe: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fix ensure_all_users_have_organizations function
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_all_users_have_organizations()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  users_fixed INTEGER := 0;
  user_record RECORD;
  org_id UUID;
  default_trial_days INTEGER;
BEGIN
  -- Get default trial duration
  SELECT COALESCE(
    (SELECT value::integer FROM public.app_settings WHERE key = 'default_trial_duration_days'),
    7
  ) INTO default_trial_days;

  -- Find users without organizations
  FOR user_record IN 
    SELECT p.id, p.email 
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.organization_members om 
      WHERE om.user_id = p.id
    )
  LOOP
    -- Create organization
    INSERT INTO public.organizations (
      name, 
      owner_id,
      trial_started_at,
      trial_expires_at
    )
    VALUES (
      user_record.email || '''s Organization',
      user_record.id,
      NOW(),
      NOW() + INTERVAL '1 day' * default_trial_days
    )
    RETURNING id INTO org_id;

    -- Add membership
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, user_record.id, 'owner');

    users_fixed := users_fixed + 1;
  END LOOP;

  RETURN users_fixed;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Add comment about security improvements
-- ============================================
COMMENT ON SCHEMA public IS 'All SECURITY DEFINER functions now have SET search_path = '''' to prevent search path injection attacks';