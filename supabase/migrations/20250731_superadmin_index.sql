-- Create indexes for superadmin performance
-- This is a separate migration because enum values must be committed before use

-- Create index for superadmin role lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_role_superadmin 
ON organization_members(user_id, role) 
WHERE role = 'superadmin';