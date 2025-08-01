-- Debug script to check user organization membership
-- Replace 'USER_EMAIL' with the actual email you're testing with

-- 1. Check if user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'USER_EMAIL';

-- 2. Check organization membership
SELECT om.*, o.name as org_name
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL');

-- 3. Check if organization exists
SELECT * 
FROM organizations 
WHERE id IN (
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL')
);

-- 4. Check RLS policies on organizations
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;

-- 5. Check if user has superadmin role
SELECT is_superadmin((SELECT id FROM auth.users WHERE email = 'USER_EMAIL'));

-- 6. Check subscription status
SELECT os.*, o.name as org_name
FROM organization_subscriptions os
JOIN organizations o ON os.organization_id = o.id
WHERE os.organization_id IN (
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL')
);