-- Check Trial Status for owner@example.com
-- This script helps debug what the organization_trial_status view is returning

-- First, let's find the user and their organization
WITH user_info AS (
  SELECT 
    u.id as user_id,
    u.email,
    om.organization_id,
    om.role,
    o.name as org_name,
    o.trial_ends_at as org_trial_ends_at
  FROM auth.users u
  JOIN organization_members om ON u.id = om.user_id
  JOIN organizations o ON om.organization_id = o.id
  WHERE u.email = 'owner@example.com'
)
SELECT 
  'User Info' as section,
  jsonb_pretty(to_jsonb(user_info.*)) as data
FROM user_info

UNION ALL

-- Check organization_subscriptions table
SELECT 
  'Organization Subscription' as section,
  jsonb_pretty(to_jsonb(os.*)) as data
FROM user_info ui
LEFT JOIN organization_subscriptions os ON os.organization_id = ui.organization_id

UNION ALL

-- Check what the view returns
SELECT 
  'Trial Status View' as section,
  jsonb_pretty(to_jsonb(ots.*)) as data
FROM user_info ui
LEFT JOIN organization_trial_status ots ON ots.organization_id = ui.organization_id

UNION ALL

-- Manual calculation of trial status
SELECT 
  'Manual Calculation' as section,
  jsonb_pretty(jsonb_build_object(
    'is_in_trial', is_organization_in_trial(ui.organization_id),
    'days_remaining', get_trial_days_remaining(ui.organization_id),
    'current_time', now(),
    'trial_end_from_org', o.trial_ends_at,
    'trial_end_from_sub', os.trial_end,
    'subscription_status', os.status,
    'time_until_trial_end', o.trial_ends_at - now()
  )) as data
FROM user_info ui
JOIN organizations o ON o.id = ui.organization_id
LEFT JOIN organization_subscriptions os ON os.organization_id = ui.organization_id;

-- Also check if there are any RLS policies that might be affecting the view
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_subscriptions', 'organization_members')
ORDER BY tablename, policyname;