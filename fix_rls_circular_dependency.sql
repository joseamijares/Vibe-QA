-- Fix RLS circular dependency issue causing 500 errors
-- The problem: is_organization_member() function queries organization_members table,
-- but the RLS policy on organization_members uses this function, creating a loop

-- First, let's check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;

-- Drop the problematic policies that use circular dependencies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;

-- Create a new policy that allows users to see their own membership directly
-- This avoids the circular dependency by not calling any functions
CREATE POLICY "Users can view their own membership"
    ON organization_members FOR SELECT
    USING (user_id = auth.uid());

-- Create a policy that allows users to view other members in the same organization
-- This uses a subquery instead of a function to avoid circular dependency
CREATE POLICY "Members can view other members in same organization"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members om2 
            WHERE om2.user_id = auth.uid()
        )
    );

-- Fix the is_organization_member function to avoid circular dependency
-- by marking it as STABLE and using a more direct approach
CREATE OR REPLACE FUNCTION is_organization_member(org_id uuid, user_id uuid)
RETURNS boolean AS $$
DECLARE
    is_member boolean;
BEGIN
    -- Use a direct query with SECURITY DEFINER to bypass RLS
    SELECT EXISTS (
        SELECT 1 
        FROM organization_members
        WHERE organization_id = org_id
        AND organization_members.user_id = user_id
        LIMIT 1
    ) INTO is_member;
    
    RETURN COALESCE(is_member, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Set search path for security
ALTER FUNCTION is_organization_member(uuid, uuid) SET search_path = public, pg_catalog;

-- Verify the fix by checking if we can query the user's membership
SELECT 
    om.*,
    o.name as org_name,
    o.slug as org_slug
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa';

-- Check all policies on organization_members table
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;