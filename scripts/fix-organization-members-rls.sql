-- Fix organization_members RLS policies
-- This script adds the missing RLS policies for the organization_members table

-- First, check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'organization_members';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON organization_members;

-- Create new policies for organization_members

-- Policy 1: Users can view their own membership records
CREATE POLICY "Users can view their own memberships"
    ON organization_members FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can view all members in organizations they belong to
CREATE POLICY "Users can view organization members"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy 3: Organization owners can manage all members
CREATE POLICY "Organization owners can manage members"
    ON organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role = 'owner'
        )
    );

-- Policy 4: Organization admins can manage members (except owners)
CREATE POLICY "Organization admins can manage non-owner members"
    ON organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
        AND role != 'owner'  -- Admins cannot modify owner memberships
    );

-- Policy 5: System can create initial membership during signup
CREATE POLICY "System can create initial membership"
    ON organization_members FOR INSERT
    WITH CHECK (
        -- Allow insert if user is creating their own membership
        auth.uid() = user_id
        OR
        -- Allow system/service role to create memberships
        auth.jwt()->>'role' = 'service_role'
    );

-- Verify policies were created
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