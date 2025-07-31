-- Add superadmin role to user_role enum
-- This migration adds a superadmin role for platform-wide administrative access

-- Step 1: Add the new value to the enum (this must be committed before use)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin' AFTER 'owner';

-- Step 2: Create a function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members om
    JOIN organizations o ON om.organization_id = o.id
    WHERE om.user_id = $1 
    AND om.role = 'superadmin'
    AND o.slug = 'vibeqa-support'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update RLS policies to allow superadmin access
-- We'll update key tables to allow superadmin full access

-- Organizations table
CREATE POLICY "Superadmin can view all organizations" ON organizations
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can update all organizations" ON organizations
  FOR UPDATE USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can delete all organizations" ON organizations
  FOR DELETE USING (is_superadmin(auth.uid()));

-- Projects table
CREATE POLICY "Superadmin can view all projects" ON projects
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can manage all projects" ON projects
  FOR ALL USING (is_superadmin(auth.uid()));

-- Feedback table
CREATE POLICY "Superadmin can view all feedback" ON feedback
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can manage all feedback" ON feedback
  FOR ALL USING (is_superadmin(auth.uid()));

-- Organization members table
CREATE POLICY "Superadmin can view all members" ON organization_members
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can manage all members" ON organization_members
  FOR ALL USING (is_superadmin(auth.uid()));

-- Organization subscriptions table
CREATE POLICY "Superadmin can view all subscriptions" ON organization_subscriptions
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can manage all subscriptions" ON organization_subscriptions
  FOR ALL USING (is_superadmin(auth.uid()));

-- Step 4: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_superadmin(uuid) TO authenticated;

-- Step 5: Add comment for documentation
COMMENT ON FUNCTION is_superadmin IS 'Checks if a user has superadmin role in the VibeQA Support organization';

-- Note: Index creation moved to a separate migration due to enum transaction constraints