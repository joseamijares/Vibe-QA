-- Debug RLS issue - check for circular dependencies and policy conflicts

-- 1. Check if the user exists and has membership
SELECT 
    'User exists' as check_type,
    EXISTS(SELECT 1 FROM auth.users WHERE id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa') as result;

SELECT 
    'Has membership' as check_type,
    EXISTS(SELECT 1 FROM organization_members WHERE user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa') as result;

-- 2. Try to query with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION debug_get_user_membership(p_user_id uuid)
RETURNS TABLE (
    organization_id uuid,
    role text,
    org_name text
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        om.organization_id,
        om.role::text,
        o.name
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM debug_get_user_membership('271e7c40-74a1-464b-bfa4-78e7bf8376aa');

-- 3. Check all functions that might be causing circular dependencies
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname IN ('is_organization_member', 'get_user_role', 'get_user_organizations')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Check for any policies using these functions
SELECT 
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE qual::text LIKE '%is_organization_member%'
   OR qual::text LIKE '%get_user_role%'
   OR qual::text LIKE '%get_user_organizations%'
ORDER BY tablename, policyname;

-- 5. Temporarily disable RLS to test (DO NOT DO THIS IN PRODUCTION)
-- We'll re-enable it immediately after testing
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- Test query without RLS
SELECT 
    om.*,
    o.name as org_name
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa';

-- Re-enable RLS immediately
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- 6. Create a simple test to verify basic RLS functionality
DO $$
DECLARE
    test_result boolean;
BEGIN
    -- Set session user to our test user
    EXECUTE format('SET LOCAL role TO authenticated');
    EXECUTE format('SET LOCAL request.jwt.claims.sub TO %L', '271e7c40-74a1-464b-bfa4-78e7bf8376aa');
    
    -- Try a simple query
    SELECT EXISTS(
        SELECT 1 FROM organization_members WHERE user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa'
    ) INTO test_result;
    
    RAISE NOTICE 'Can query own membership: %', test_result;
END $$;