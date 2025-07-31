-- Superadmin Panel Tables and Policies
-- This migration creates the necessary tables for the superadmin panel functionality

-- Create coupon type enum
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed_amount');
CREATE TYPE coupon_status AS ENUM ('active', 'expired', 'depleted');

-- Coupons table
CREATE TABLE coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  description text,
  type coupon_type NOT NULL,
  value numeric NOT NULL CHECK (value > 0),
  usage_limit integer,
  used_count integer DEFAULT 0,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  status coupon_status DEFAULT 'active',
  applicable_plans text[], -- Array of plan IDs this coupon applies to, null = all plans
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone DEFAULT now()
);

-- Coupon usage tracking
CREATE TABLE coupon_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES organization_subscriptions(id),
  applied_at timestamp with time zone DEFAULT now(),
  discount_amount numeric NOT NULL,
  stripe_discount_id text,
  created_by uuid REFERENCES auth.users(id)
);

-- System metrics table
CREATE TABLE system_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name text NOT NULL,
  metric_value jsonb NOT NULL,
  metric_type text NOT NULL, -- 'database', 'storage', 'api', 'users', etc.
  recorded_at timestamp with time zone DEFAULT now(),
  period_start timestamp with time zone,
  period_end timestamp with time zone
);

-- Revenue reports cache table
CREATE TABLE revenue_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date date NOT NULL,
  metrics jsonb NOT NULL, -- MRR, ARR, new subscriptions, churned, etc.
  generated_at timestamp with time zone DEFAULT now(),
  UNIQUE(report_date)
);

-- Audit log for superadmin actions
CREATE TABLE superadmin_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupon_usage_organization ON coupon_usage(organization_id);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_system_metrics_type_date ON system_metrics(metric_type, recorded_at DESC);
CREATE INDEX idx_revenue_reports_date ON revenue_reports(report_date DESC);
CREATE INDEX idx_superadmin_audit_log_user ON superadmin_audit_log(admin_user_id);
CREATE INDEX idx_superadmin_audit_log_date ON superadmin_audit_log(created_at DESC);

-- RLS Policies for coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage coupons" ON coupons
  FOR ALL USING (is_superadmin(auth.uid()));

CREATE POLICY "Public can view active coupons" ON coupons
  FOR SELECT USING (status = 'active' AND valid_until > now());

-- RLS Policies for coupon_usage
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can view all coupon usage" ON coupon_usage
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "Organizations can view their own coupon usage" ON coupon_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = coupon_usage.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for system_metrics
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage system metrics" ON system_metrics
  FOR ALL USING (is_superadmin(auth.uid()));

-- RLS Policies for revenue_reports
ALTER TABLE revenue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage revenue reports" ON revenue_reports
  FOR ALL USING (is_superadmin(auth.uid()));

-- RLS Policies for superadmin_audit_log
ALTER TABLE superadmin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can view audit logs" ON superadmin_audit_log
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON superadmin_audit_log
  FOR INSERT WITH CHECK (true);

-- Functions for coupon validation
CREATE OR REPLACE FUNCTION validate_coupon(coupon_code text)
RETURNS TABLE (
  is_valid boolean,
  coupon_id uuid,
  discount_type coupon_type,
  discount_value numeric,
  message text
) AS $$
DECLARE
  v_coupon record;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = coupon_code
  AND status = 'active';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, null::uuid, null::coupon_type, 0::numeric, 'Coupon not found or inactive';
    RETURN;
  END IF;

  -- Check validity dates
  IF v_coupon.valid_from > now() THEN
    RETURN QUERY SELECT false, v_coupon.id, v_coupon.type, v_coupon.value, 'Coupon not yet valid';
    RETURN;
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN QUERY SELECT false, v_coupon.id, v_coupon.type, v_coupon.value, 'Coupon has expired';
    RETURN;
  END IF;

  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, v_coupon.id, v_coupon.type, v_coupon.value, 'Coupon usage limit reached';
    RETURN;
  END IF;

  -- Coupon is valid
  RETURN QUERY SELECT true, v_coupon.id, v_coupon.type, v_coupon.value, 'Coupon is valid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record coupon usage
CREATE OR REPLACE FUNCTION apply_coupon(
  p_coupon_id uuid,
  p_organization_id uuid,
  p_subscription_id uuid,
  p_discount_amount numeric,
  p_stripe_discount_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_usage_id uuid;
BEGIN
  -- Insert usage record
  INSERT INTO coupon_usage (
    coupon_id,
    organization_id,
    subscription_id,
    discount_amount,
    stripe_discount_id,
    created_by
  ) VALUES (
    p_coupon_id,
    p_organization_id,
    p_subscription_id,
    p_discount_amount,
    p_stripe_discount_id,
    auth.uid()
  ) RETURNING id INTO v_usage_id;

  -- Update used count
  UPDATE coupons
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = p_coupon_id;

  -- Check if coupon should be marked as depleted
  UPDATE coupons
  SET status = 'depleted',
      updated_at = now()
  WHERE id = p_coupon_id
  AND usage_limit IS NOT NULL
  AND used_count >= usage_limit;

  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate revenue metrics
CREATE OR REPLACE FUNCTION calculate_revenue_metrics(p_date date DEFAULT CURRENT_DATE)
RETURNS jsonb AS $$
DECLARE
  v_metrics jsonb;
BEGIN
  WITH monthly_revenue AS (
    SELECT
      COUNT(DISTINCT os.organization_id) as active_subscriptions,
      SUM(sp.price_monthly) as mrr,
      COUNT(DISTINCT CASE 
        WHEN os.created_at >= date_trunc('month', p_date) 
        THEN os.organization_id 
      END) as new_subscriptions,
      COUNT(DISTINCT CASE 
        WHEN os.canceled_at >= date_trunc('month', p_date) 
        AND os.canceled_at < date_trunc('month', p_date) + interval '1 month'
        THEN os.organization_id 
      END) as churned_subscriptions
    FROM organization_subscriptions os
    JOIN subscription_plans sp ON os.plan_id = sp.id
    WHERE os.status IN ('active', 'trialing')
    AND os.current_period_start <= p_date
    AND (os.current_period_end IS NULL OR os.current_period_end > p_date)
  ),
  plan_breakdown AS (
    SELECT
      sp.name as plan_name,
      COUNT(*) as count,
      SUM(sp.price_monthly) as revenue
    FROM organization_subscriptions os
    JOIN subscription_plans sp ON os.plan_id = sp.id
    WHERE os.status IN ('active', 'trialing')
    GROUP BY sp.name
  )
  SELECT jsonb_build_object(
    'date', p_date,
    'mrr', COALESCE(mr.mrr, 0),
    'arr', COALESCE(mr.mrr * 12, 0),
    'active_subscriptions', COALESCE(mr.active_subscriptions, 0),
    'new_subscriptions', COALESCE(mr.new_subscriptions, 0),
    'churned_subscriptions', COALESCE(mr.churned_subscriptions, 0),
    'churn_rate', CASE 
      WHEN mr.active_subscriptions > 0 
      THEN ROUND((mr.churned_subscriptions::numeric / mr.active_subscriptions) * 100, 2)
      ELSE 0 
    END,
    'plan_breakdown', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'plan', plan_name,
          'count', count,
          'revenue', revenue
        )
      )
      FROM plan_breakdown
    ), '[]'::jsonb)
  ) INTO v_metrics
  FROM monthly_revenue mr;

  RETURN v_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record system metrics
CREATE OR REPLACE FUNCTION record_system_metrics()
RETURNS void AS $$
BEGIN
  -- Database metrics
  INSERT INTO system_metrics (metric_name, metric_type, metric_value)
  VALUES (
    'database_size',
    'database',
    jsonb_build_object(
      'total_size', pg_database_size(current_database()),
      'tables', (
        SELECT jsonb_object_agg(
          schemaname || '.' || tablename,
          pg_total_relation_size(schemaname||'.'||tablename)
        )
        FROM pg_tables
        WHERE schemaname = 'public'
      )
    )
  );

  -- User metrics
  INSERT INTO system_metrics (metric_name, metric_type, metric_value)
  VALUES (
    'user_stats',
    'users',
    jsonb_build_object(
      'total_users', (SELECT COUNT(*) FROM auth.users),
      'active_today', (
        SELECT COUNT(DISTINCT user_id) 
        FROM activity_logs 
        WHERE created_at >= CURRENT_DATE
      ),
      'new_users_today', (
        SELECT COUNT(*) 
        FROM auth.users 
        WHERE created_at >= CURRENT_DATE
      )
    )
  );

  -- Storage metrics
  INSERT INTO system_metrics (metric_name, metric_type, metric_value)
  VALUES (
    'storage_usage',
    'storage',
    jsonb_build_object(
      'feedback_media', (
        SELECT COALESCE(SUM(file_size), 0) 
        FROM feedback_media
      ),
      'total_files', (
        SELECT COUNT(*) 
        FROM feedback_media
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log superadmin actions
CREATE OR REPLACE FUNCTION log_superadmin_action()
RETURNS trigger AS $$
BEGIN
  -- Only log if user is superadmin
  IF is_superadmin(auth.uid()) THEN
    INSERT INTO superadmin_audit_log (
      admin_user_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id::text
        ELSE NEW.id::text
      END,
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_organizations_changes
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION log_superadmin_action();

CREATE TRIGGER audit_organization_subscriptions_changes
  AFTER INSERT OR UPDATE OR DELETE ON organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_superadmin_action();

CREATE TRIGGER audit_coupons_changes
  AFTER INSERT OR UPDATE OR DELETE ON coupons
  FOR EACH ROW EXECUTE FUNCTION log_superadmin_action();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_coupon(text) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_coupon(uuid, uuid, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_revenue_metrics(date) TO authenticated;
GRANT EXECUTE ON FUNCTION record_system_metrics() TO authenticated;

-- Functions for user management (superadmin only)
CREATE OR REPLACE FUNCTION get_all_users_with_organizations()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamp with time zone,
  organizations jsonb
) AS $$
BEGIN
  -- Check if user is superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Superadmin only.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.created_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'organization', jsonb_build_object(
            'id', o.id,
            'name', o.name,
            'slug', o.slug
          ),
          'role', om.role
        )
      ) FILTER (WHERE o.id IS NOT NULL),
      '[]'::jsonb
    ) as organizations
  FROM auth.users u
  LEFT JOIN organization_members om ON u.id = om.user_id
  LEFT JOIN organizations o ON om.organization_id = o.id
  GROUP BY u.id, u.email, u.created_at
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_user_as_superadmin(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if user is superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Superadmin only.';
  END IF;

  -- Log the action
  INSERT INTO superadmin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    'DELETE_USER',
    'auth.users',
    user_id::text,
    jsonb_build_object('deleted_at', now())
  );

  -- Delete the user (cascade will handle related records)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_user_as_superadmin(
  user_email text,
  user_password text
)
RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user is superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Superadmin only.';
  END IF;

  -- Create user via auth.users
  -- Note: In production, you'd use Supabase Admin API for this
  -- This is a placeholder that would need proper implementation
  -- For now, we'll just raise an exception
  RAISE EXCEPTION 'User creation requires Supabase Admin API. Use Edge Function instead.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for superadmin functions
GRANT EXECUTE ON FUNCTION get_all_users_with_organizations() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_as_superadmin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_as_superadmin(text, text) TO authenticated;