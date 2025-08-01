-- Create project_members table for project-based access control
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id),
    UNIQUE(project_id, user_id)
);

-- Add project_ids field to invitations table
ALTER TABLE public.invitations 
ADD COLUMN project_ids UUID[] DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_invitations_project_ids ON public.invitations USING gin(project_ids);

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_members

-- Organization owners can manage all project members
CREATE POLICY "Organization owners can manage project members" ON public.project_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.organization_members om ON om.organization_id = p.organization_id
        WHERE p.id = project_members.project_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
);

-- Users can view project members for projects they have access to
CREATE POLICY "Users can view project members" ON public.project_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
    )
);

-- Update RLS policies for projects table

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their organization's projects" ON public.projects;

-- Create new policy that checks project_members table
CREATE POLICY "Users can view projects they have access to" ON public.projects
FOR SELECT USING (
    -- Organization owners can see all projects
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = projects.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
    OR
    -- Members can see projects they're members of
    EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
    )
);

-- Update RLS policies for feedback table to respect project access

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view feedback for their organization's projects" ON public.feedback;

-- Create new policy that checks project access
CREATE POLICY "Users can view feedback for accessible projects" ON public.feedback
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        LEFT JOIN public.organization_members om ON om.organization_id = p.organization_id
        LEFT JOIN public.project_members pm ON pm.project_id = p.id
        WHERE p.id = feedback.project_id
        AND (
            -- Organization owners can see all feedback
            (om.user_id = auth.uid() AND om.role = 'owner')
            OR
            -- Project members can see project feedback
            (pm.user_id = auth.uid())
        )
    )
);

-- Function to automatically add organization owners to all new projects
CREATE OR REPLACE FUNCTION add_owners_to_new_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Add all organization owners as project admins
    INSERT INTO public.project_members (project_id, user_id, role, invited_by)
    SELECT 
        NEW.id,
        om.user_id,
        'admin',
        auth.uid()
    FROM public.organization_members om
    WHERE om.organization_id = NEW.organization_id
    AND om.role = 'owner'
    ON CONFLICT (project_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add owners to new projects
CREATE TRIGGER add_owners_to_project_after_insert
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION add_owners_to_new_project();

-- Migrate existing data: Add all current organization members to all projects
INSERT INTO public.project_members (project_id, user_id, role, created_at)
SELECT DISTINCT
    p.id AS project_id,
    om.user_id,
    CASE 
        WHEN om.role = 'owner' THEN 'admin'
        WHEN om.role = 'admin' THEN 'editor'
        ELSE 'viewer'
    END AS role,
    NOW() AS created_at
FROM public.projects p
JOIN public.organization_members om ON om.organization_id = p.organization_id
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE public.project_members IS 'Manages project-level access control for team members';
COMMENT ON COLUMN public.project_members.role IS 'Project-specific role: viewer (read-only), editor (can manage feedback), admin (full project control)';
COMMENT ON COLUMN public.invitations.project_ids IS 'Array of project IDs the invitation grants access to. Empty array means access to all projects.';