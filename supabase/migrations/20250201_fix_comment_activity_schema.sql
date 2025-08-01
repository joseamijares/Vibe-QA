-- Fix profiles table by adding email column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Update email from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- Make email not null after population
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Create unique constraint on email
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Drop the existing activity_logs table that was created for feedback
DROP TABLE IF EXISTS activity_logs CASCADE;

-- Recreate activity_logs for feedback tracking (not organization level)
CREATE TABLE activity_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id uuid REFERENCES feedback(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX idx_activity_logs_feedback_id ON activity_logs(feedback_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for activity_logs
CREATE POLICY "Users can view activity logs for their organization's feedback" ON activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM feedback f
            JOIN projects p ON f.project_id = p.id
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE f.id = activity_logs.feedback_id
            AND om.user_id = auth.uid()
        )
    );

-- Create organization_usage table
CREATE TABLE IF NOT EXISTS organization_usage (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    month date NOT NULL,
    feedback_count integer DEFAULT 0,
    storage_bytes bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, month)
);

-- Create index
CREATE INDEX idx_organization_usage_org_month ON organization_usage(organization_id, month);

-- Enable RLS
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_usage
CREATE POLICY "Users can view their organization's usage" ON organization_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_usage.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Create function to get organization storage usage
CREATE OR REPLACE FUNCTION get_organization_storage_usage(org_id uuid)
RETURNS TABLE(usage_gb numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT COALESCE(SUM(storage_bytes) / 1073741824.0, 0)::numeric AS usage_gb
    FROM organization_usage
    WHERE organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix comments RLS policies
DROP POLICY IF EXISTS "Users can create comments on feedback they have access to" ON comments;
DROP POLICY IF EXISTS "Users can view comments on feedback they have access to" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Create comprehensive RLS policies for comments
CREATE POLICY "Users can view comments on feedback they have access to" ON comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM feedback f
            JOIN projects p ON f.project_id = p.id
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE f.id = comments.feedback_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments on feedback they have access to" ON comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM feedback f
            JOIN projects p ON f.project_id = p.id
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE f.id = comments.feedback_id
            AND om.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE
    USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON organization_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_storage_usage TO authenticated;

-- Recreate activity logging functions and triggers for the new schema
CREATE OR REPLACE FUNCTION log_feedback_activity(
    p_feedback_id uuid,
    p_user_id uuid,
    p_action text,
    p_details jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
    INSERT INTO activity_logs (feedback_id, user_id, action, details)
    VALUES (p_feedback_id, p_user_id, p_action, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers for activity logging
CREATE OR REPLACE FUNCTION track_feedback_status_change() RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND old.status IS DISTINCT FROM new.status) THEN
        PERFORM log_feedback_activity(
            new.id,
            auth.uid(),
            'status_changed',
            jsonb_build_object(
                'old_status', old.status,
                'new_status', new.status,
                'changed_at', now()
            )
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_feedback_assignment_change() RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND old.assigned_to IS DISTINCT FROM new.assigned_to) THEN
        PERFORM log_feedback_activity(
            new.id,
            auth.uid(),
            'assignment_changed',
            jsonb_build_object(
                'old_assignee', old.assigned_to,
                'new_assignee', new.assigned_to,
                'changed_at', now()
            )
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_feedback_priority_change() RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND old.priority IS DISTINCT FROM new.priority) THEN
        PERFORM log_feedback_activity(
            new.id,
            auth.uid(),
            'priority_changed',
            jsonb_build_object(
                'old_priority', old.priority,
                'new_priority', new.priority,
                'changed_at', now()
            )
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_feedback_resolution() RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND old.resolved_at IS NULL AND new.resolved_at IS NOT NULL) THEN
        PERFORM log_feedback_activity(
            new.id,
            new.resolved_by,
            'resolved',
            jsonb_build_object(
                'resolved_at', new.resolved_at,
                'resolution_time_hours', extract(epoch from (new.resolved_at - new.created_at)) / 3600
            )
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_comment_addition() RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM log_feedback_activity(
            new.feedback_id,
            new.user_id,
            'comment_added',
            jsonb_build_object(
                'comment_id', new.id,
                'is_internal', new.is_internal,
                'created_at', new.created_at
            )
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS track_feedback_status ON feedback;
CREATE TRIGGER track_feedback_status
    AFTER UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION track_feedback_status_change();

DROP TRIGGER IF EXISTS track_feedback_assignment ON feedback;
CREATE TRIGGER track_feedback_assignment
    AFTER UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION track_feedback_assignment_change();

DROP TRIGGER IF EXISTS track_feedback_priority ON feedback;
CREATE TRIGGER track_feedback_priority
    AFTER UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION track_feedback_priority_change();

DROP TRIGGER IF EXISTS track_feedback_resolution ON feedback;
CREATE TRIGGER track_feedback_resolution
    AFTER UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION track_feedback_resolution();

DROP TRIGGER IF EXISTS track_comment_addition ON comments;
CREATE TRIGGER track_comment_addition
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION track_comment_addition();

-- Grant permissions
GRANT SELECT ON activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_feedback_activity TO authenticated;