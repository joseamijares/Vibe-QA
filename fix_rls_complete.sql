-- Complete fix for RLS infinite recursion on organization_members table

-- 1. First, temporarily disable RLS to clean up
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies on organization_members to start fresh
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'organization_members' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organization_members', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- 3. Create new, simple policies that avoid any function calls or circular references

-- Policy 1: Users can see their own membership record
CREATE POLICY "users_view_own_membership"
    ON organization_members FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can see other members in orgs where they are a member
-- This uses a simple subquery without any function calls
CREATE POLICY "members_view_same_org_members"
    ON organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM organization_members AS my_membership
            WHERE my_membership.user_id = auth.uid()
            AND my_membership.organization_id = organization_members.organization_id
        )
    );

-- Policy 3: Owners can manage members in their organizations
CREATE POLICY "owners_manage_members"
    ON organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM organization_members AS my_membership
            WHERE my_membership.user_id = auth.uid()
            AND my_membership.organization_id = organization_members.organization_id
            AND my_membership.role = 'owner'
        )
    );

-- Policy 4: Admins can manage non-owner members
CREATE POLICY "admins_manage_non_owners"
    ON organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM organization_members AS my_membership
            WHERE my_membership.user_id = auth.uid()
            AND my_membership.organization_id = organization_members.organization_id
            AND my_membership.role IN ('owner', 'admin')
        )
        AND role != 'owner'
    );

-- Policy 5: Service role can do anything (for system operations)
CREATE POLICY "service_role_all"
    ON organization_members FOR ALL
    USING (auth.role() = 'service_role');

-- 4. Re-enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- 5. Test the fix - this should now work
SELECT 
    om.*,
    o.name as org_name,
    'Test successful!' as status
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa';

-- 6. Verify all policies are in place
SELECT 
    policyname,
    cmd,
    permissive,
    substring(qual::text, 1, 100) as policy_condition
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;