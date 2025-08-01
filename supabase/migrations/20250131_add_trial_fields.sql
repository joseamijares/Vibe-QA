-- Add trial fields to organization_subscriptions table
ALTER TABLE public.organization_subscriptions 
ADD COLUMN IF NOT EXISTS trial_start timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end timestamp with time zone DEFAULT (now() + interval '7 days');

-- Add trial status to organizations for quick access
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;

-- Update existing organizations to have trial_ends_at
UPDATE public.organizations o
SET trial_ends_at = COALESCE(
  (SELECT trial_end FROM public.organization_subscriptions os WHERE os.organization_id = o.id),
  created_at + interval '7 days'
)
WHERE trial_ends_at IS NULL;

-- Create a function to check if organization is in trial
CREATE OR REPLACE FUNCTION is_organization_in_trial(org_id uuid)
RETURNS boolean AS $$
DECLARE
  trial_end timestamp with time zone;
  sub_status text;
BEGIN
  SELECT 
    os.trial_end,
    os.status INTO trial_end, sub_status
  FROM public.organization_subscriptions os
  WHERE os.organization_id = org_id;
  
  -- If no subscription record, check organization trial_ends_at
  IF trial_end IS NULL THEN
    SELECT trial_ends_at INTO trial_end
    FROM public.organizations
    WHERE id = org_id;
  END IF;
  
  -- Organization is in trial if:
  -- 1. Status is 'trialing' OR
  -- 2. No active subscription AND within trial period
  RETURN (sub_status = 'trialing') OR 
         (sub_status IS NULL AND trial_end > now()) OR
         (sub_status IN ('incomplete', 'incomplete_expired') AND trial_end > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get trial days remaining
CREATE OR REPLACE FUNCTION get_trial_days_remaining(org_id uuid)
RETURNS integer AS $$
DECLARE
  trial_end timestamp with time zone;
  days_remaining integer;
BEGIN
  SELECT 
    COALESCE(os.trial_end, o.trial_ends_at) INTO trial_end
  FROM public.organizations o
  LEFT JOIN public.organization_subscriptions os ON os.organization_id = o.id
  WHERE o.id = org_id;
  
  IF trial_end IS NULL OR trial_end < now() THEN
    RETURN 0;
  END IF;
  
  days_remaining := EXTRACT(DAY FROM (trial_end - now()));
  RETURN GREATEST(0, days_remaining);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the user registration trigger to set trial dates
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id uuid;
  user_email text;
  user_name text;
BEGIN
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
    now() + interval '7 days'
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
    now() + interval '7 days'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for trial status
CREATE OR REPLACE VIEW organization_trial_status AS
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
  os.plan_id
FROM public.organizations o
LEFT JOIN public.organization_subscriptions os ON os.organization_id = o.id;

-- Grant access to the view
GRANT SELECT ON organization_trial_status TO authenticated;

-- Note: Views don't support RLS policies directly
-- Access control is enforced through the underlying tables

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_org_trial_ends_at ON public.organizations(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_org_sub_trial_end ON public.organization_subscriptions(trial_end);