-- Clean up duplicate RLS policy for organization_members table
-- The 'simple_select_own' policy is redundant as we already have 'Users can view their own memberships'

-- Drop the duplicate policy
DROP POLICY IF EXISTS "simple_select_own" ON organization_members;

-- Verify the remaining policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'organization_members'
ORDER BY policyname;

-- Expected output should show 5 policies:
-- 1. Organization admins can manage non-owner members
-- 2. Organization owners can manage members  
-- 3. System can create initial membership
-- 4. Users can view organization members
-- 5. Users can view their own memberships