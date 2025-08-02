-- Test the exact query that's failing in the application

-- 1. First verify the user is logged in correctly
SELECT 
    current_setting('request.jwt.claims', true)::json->>'sub' as authenticated_user_id,
    auth.uid() as auth_uid,
    current_user as db_user;

-- 2. Test if we can query with service role (bypass RLS)
SET ROLE postgres;
SELECT 
    'Service role query' as test,
    om.*,
    o.name as org_name
FROM organization_members om
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa';
RESET ROLE;

-- 3. Check if there are any issues with the auth functions
SELECT 
    'Auth functions' as test,
    auth.uid() as uid_result,
    auth.role() as role_result;

-- 4. Simulate the exact query from the app with proper auth context
SET LOCAL request.jwt.claims = '{"sub": "271e7c40-74a1-464b-bfa4-78e7bf8376aa", "role": "authenticated"}';
SET LOCAL role = 'authenticated';

-- This is the exact query the app is making
SELECT * 
FROM organization_members
WHERE user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa'
ORDER BY joined_at DESC
LIMIT 1;

-- 5. Check if the problem is with the select * 
-- Try selecting specific columns
SELECT 
    id,
    organization_id,
    user_id,
    role
FROM organization_members
WHERE user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa'
ORDER BY joined_at DESC
LIMIT 1;

-- 6. Check if any of the policies are still causing issues
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * 
FROM organization_members
WHERE user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa'
LIMIT 1;

-- 7. Reset role
RESET ROLE;