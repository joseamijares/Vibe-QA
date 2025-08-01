-- Detailed Trial Status Check for owner@example.com
-- Run each section separately to see the results

-- 1. Find the user and organization
SELECT 
  u.id as user_id,
  u.email,
  om.organization_id,
  om.role,
  o.name as org_name,
  o.trial_ends_at as org_trial_ends_at,
  o.created_at as org_created_at
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'owner@example.com';

-- 2. Check organization_subscriptions
SELECT 
  os.*,
  now() as current_time,
  os.trial_end > now() as should_be_in_trial
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organization_subscriptions os ON os.organization_id = om.organization_id
WHERE u.email = 'owner@example.com';

-- 3. Check what the view returns (this is what the app sees)
SELECT 
  ots.*,
  now() as current_time
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organization_trial_status ots ON ots.organization_id = om.organization_id
WHERE u.email = 'owner@example.com';

-- 4. Manual function calls
SELECT 
  om.organization_id,
  is_organization_in_trial(om.organization_id) as is_in_trial_function,
  get_trial_days_remaining(om.organization_id) as days_remaining_function
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
WHERE u.email = 'owner@example.com';

-- 5. Check if the view exists and its definition
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname = 'organization_trial_status';