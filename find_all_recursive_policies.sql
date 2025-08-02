-- Find ALL policies that might be causing recursion

-- 1. Check ALL policies on organization_members
SELECT 
    'organization_members' as table_name,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;

-- 2. Check policies on organizations table that might reference organization_members
SELECT 
    'organizations' as table_name,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'organizations'
AND (qual::text LIKE '%organization_members%' 
     OR qual::text LIKE '%is_organization_member%'
     OR qual::text LIKE '%get_user_role%')
ORDER BY policyname;

-- 3. Check all functions that might be causing recursion
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND (prosrc LIKE '%organization_members%' OR proname LIKE '%organization%')
ORDER BY proname;

-- 4. Drop ALL policies and functions, then recreate with absolute certainty of no recursion
BEGIN;

-- Drop all policies on organization_members
DROP POLICY IF EXISTS "admins_manage_non_owners" ON organization_members;
DROP POLICY IF EXISTS "members_view_same_org_members" ON organization_members;
DROP POLICY IF EXISTS "owners_manage_members" ON organization_members;
DROP POLICY IF EXISTS "service_role_all" ON organization_members;
DROP POLICY IF EXISTS "users_view_own_membership" ON organization_members;

-- Drop potentially problematic functions
DROP FUNCTION IF EXISTS is_organization_member(uuid, uuid);
DROP FUNCTION IF EXISTS get_user_role(uuid, uuid);
DROP FUNCTION IF EXISTS get_user_organizations(uuid);

-- Create ONE simple policy to test
CREATE POLICY "simple_user_read_own"
    ON organization_members FOR SELECT
    USING (user_id = auth.uid());

COMMIT;

-- 5. Test the simple query
SELECT * FROM organization_members WHERE user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa' LIMIT 1;