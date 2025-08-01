-- Reset Trial for Test User
-- This script resets the trial period for a specific user by email
-- Usage: Update the @user_email variable to target different users

-- Configuration
DO $$
DECLARE
  target_email text := 'owner@example.com';
  user_id_var uuid;
  org_id_var uuid;
  trial_days integer := 7;
  new_trial_end timestamp with time zone;
BEGIN
  -- Calculate new trial end date
  new_trial_end := now() + (trial_days || ' days')::interval;
  
  -- Get user ID from email
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = target_email;
  
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;
  
  -- Get organization ID for this user
  SELECT om.organization_id INTO org_id_var
  FROM organization_members om
  WHERE om.user_id = user_id_var
    AND om.role IN ('owner', 'admin')
  LIMIT 1;
  
  IF org_id_var IS NULL THEN
    RAISE EXCEPTION 'No organization found for user %', target_email;
  END IF;
  
  -- Update organization trial_ends_at
  UPDATE organizations
  SET 
    trial_ends_at = new_trial_end,
    updated_at = now()
  WHERE id = org_id_var;
  
  -- Update or insert organization subscription
  INSERT INTO organization_subscriptions (
    organization_id,
    plan_id,
    status,
    trial_start,
    trial_end,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    org_id_var,
    'free',
    'trialing',
    now(),
    new_trial_end,
    jsonb_build_object(
      'trial_reset_at', now(),
      'trial_reset_by', 'manual_script',
      'trial_extended', false
    ),
    now(),
    now()
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    status = 'trialing',
    trial_start = EXCLUDED.trial_start,
    trial_end = EXCLUDED.trial_end,
    metadata = organization_subscriptions.metadata || EXCLUDED.metadata,
    updated_at = now(),
    -- Clear any cancellation dates
    cancel_at = NULL,
    canceled_at = NULL;
  
  -- Log the results
  RAISE NOTICE 'Successfully reset trial for user: %', target_email;
  RAISE NOTICE 'Organization ID: %', org_id_var;
  RAISE NOTICE 'New trial end date: %', new_trial_end;
  RAISE NOTICE 'Trial will last for % days', trial_days;
END $$;

-- Verify the changes
SELECT 
  u.email,
  o.name as organization_name,
  o.trial_ends_at as org_trial_ends_at,
  os.status as subscription_status,
  os.plan_id,
  os.trial_start,
  os.trial_end as subscription_trial_end,
  os.metadata,
  get_trial_days_remaining(o.id) as days_remaining,
  is_organization_in_trial(o.id) as is_in_trial
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
LEFT JOIN organization_subscriptions os ON o.id = os.organization_id
WHERE u.email = 'owner@example.com';