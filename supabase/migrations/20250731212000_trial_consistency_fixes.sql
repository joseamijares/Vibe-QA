-- Fix trial data consistency and calculation issues

-- 1. Create a function to sync trial dates between tables
CREATE OR REPLACE FUNCTION sync_trial_dates()
RETURNS trigger AS $$
BEGIN
  -- Sync trial_end to organizations.trial_ends_at
  UPDATE public.organizations 
  SET trial_ends_at = NEW.trial_end
  WHERE id = NEW.organization_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to maintain consistency
CREATE TRIGGER sync_trial_dates_trigger
  AFTER INSERT OR UPDATE OF trial_end ON public.organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_trial_dates();

-- 2. Fix the trial days calculation to be more accurate
CREATE OR REPLACE FUNCTION get_trial_days_remaining(org_id uuid)
RETURNS integer AS $$
DECLARE
  trial_end timestamp with time zone;
  days_remaining numeric;
BEGIN
  SELECT 
    COALESCE(os.trial_end, o.trial_ends_at) INTO trial_end
  FROM public.organizations o
  LEFT JOIN public.organization_subscriptions os ON os.organization_id = o.id
  WHERE o.id = org_id;
  
  IF trial_end IS NULL OR trial_end < now() THEN
    RETURN 0;
  END IF;
  
  -- Calculate days remaining with better precision (ceiling to round up partial days)
  days_remaining := CEIL(EXTRACT(EPOCH FROM (trial_end - now())) / 86400);
  RETURN GREATEST(0, days_remaining::integer);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create table for tracking processed webhook events (idempotency)
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id text UNIQUE NOT NULL,
    event_type text NOT NULL,
    processed_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON public.processed_webhook_events(stripe_event_id);

-- Enable RLS
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events
CREATE POLICY "Service role can manage webhook events"
    ON public.processed_webhook_events FOR ALL
    USING (auth.role() = 'service_role');

-- 4. Add a constant for trial duration (to avoid hardcoding)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert default trial settings
INSERT INTO public.app_settings (key, value, description) VALUES
    ('trial_duration_days', '7'::jsonb, 'Number of days for free trial')
ON CONFLICT (key) DO NOTHING;

-- Grant read access to authenticated users
GRANT SELECT ON public.app_settings TO authenticated;

-- 5. Update the user registration trigger to use the configurable trial duration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id uuid;
  user_email text;
  user_name text;
  trial_days integer;
BEGIN
  -- Get trial duration from settings
  SELECT (value::text)::integer INTO trial_days
  FROM public.app_settings
  WHERE key = 'trial_duration_days';
  
  -- Default to 7 days if not found
  IF trial_days IS NULL THEN
    trial_days := 7;
  END IF;

  -- Get user email from auth.users
  SELECT email, raw_user_meta_data->>'name' 
  INTO user_email, user_name
  FROM auth.users 
  WHERE id = new.id;

  -- Create organization with trial end date
  INSERT INTO public.organizations (name, created_by, trial_ends_at)
  VALUES (
    COALESCE(user_name, split_part(user_email, '@', 1) || '''s Organization'),
    new.id,
    now() + (trial_days || ' days')::interval
  )
  RETURNING id INTO new_org_id;

  -- Add user as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, new.id, 'owner');

  -- Create initial subscription record in trialing status
  INSERT INTO public.organization_subscriptions (
    organization_id, 
    plan_id, 
    status, 
    trial_start,
    trial_end
  )
  VALUES (
    new_org_id, 
    'free', 
    'trialing',
    now(),
    now() + (trial_days || ' days')::interval
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fix existing data inconsistencies
-- Sync any mismatched trial dates
UPDATE public.organizations o
SET trial_ends_at = os.trial_end
FROM public.organization_subscriptions os
WHERE o.id = os.organization_id
  AND o.trial_ends_at IS DISTINCT FROM os.trial_end;

-- 7. Add function to check for trial extension eligibility
CREATE OR REPLACE FUNCTION can_extend_trial(org_id uuid, extension_days integer)
RETURNS boolean AS $$
DECLARE
  current_trial_end timestamp with time zone;
  has_been_extended boolean;
BEGIN
  SELECT 
    COALESCE(os.trial_end, o.trial_ends_at),
    COALESCE(os.metadata->>'trial_extended', 'false')::boolean
  INTO current_trial_end, has_been_extended
  FROM public.organizations o
  LEFT JOIN public.organization_subscriptions os ON os.organization_id = o.id
  WHERE o.id = org_id;
  
  -- Can extend if: not already extended, trial hasn't ended, and reasonable extension
  RETURN NOT has_been_extended 
    AND current_trial_end > now() 
    AND extension_days <= 14;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION can_extend_trial(uuid, integer) TO authenticated;