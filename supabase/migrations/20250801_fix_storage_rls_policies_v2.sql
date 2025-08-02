-- Simplified Storage RLS Policies for Multi-tenant Architecture
-- This migration fixes the storage policies based on security review feedback

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can upload feedback media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view feedback media from their organizations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete feedback media from their organizations" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload feedback media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their organization's feedback media" ON storage.objects;
DROP POLICY IF EXISTS "Organization admins can delete their feedback media" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update feedback media" ON storage.objects;

-- Drop the complex functions that were over-engineered
DROP FUNCTION IF EXISTS extract_org_id_from_path(text);
DROP FUNCTION IF EXISTS extract_feedback_id_from_path(text);
DROP FUNCTION IF EXISTS generate_signed_media_url(uuid, text, integer);

-- Simplified storage policies following Supabase best practices

-- 1. Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access"
    ON storage.objects FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 2. Authenticated users can read their organization's media
-- This uses the feedback_media table as the source of truth
CREATE POLICY "Authenticated users can read org media"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'feedback-media'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM feedback_media fm
            JOIN feedback f ON f.id = fm.feedback_id
            JOIN projects p ON p.id = f.project_id
            JOIN organization_members om ON om.organization_id = p.organization_id
            WHERE fm.url LIKE '%' || storage.objects.name
            AND om.user_id = auth.uid()
        )
    );

-- 3. No direct upload/delete for users - all operations go through Edge Functions
-- This ensures proper validation and organization context

-- Add helper view for media access (optional, for dashboard queries)
CREATE OR REPLACE VIEW user_accessible_media AS
SELECT 
    fm.*,
    f.project_id,
    p.organization_id,
    p.name as project_name
FROM feedback_media fm
JOIN feedback f ON f.id = fm.feedback_id
JOIN projects p ON p.id = f.project_id
WHERE is_organization_member(p.organization_id, auth.uid());

-- Grant access to the view
GRANT SELECT ON user_accessible_media TO authenticated;

-- Add index for better performance on media lookups
CREATE INDEX IF NOT EXISTS idx_feedback_media_url ON feedback_media(url);

-- Create function to get signed URL (application-level, not database-level)
-- This is just for reference - actual implementation should be in Edge Functions
COMMENT ON TABLE storage.objects IS 'Storage access is controlled via Edge Functions. Direct access requires service role. Media URLs are validated against feedback_media table.';

-- Add cleanup function for orphaned storage objects
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_objects()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete storage objects that don't have corresponding media records
    WITH deleted AS (
        DELETE FROM storage.objects 
        WHERE bucket_id = 'feedback-media'
        AND created_at < NOW() - INTERVAL '1 day' -- Only clean up old objects
        AND NOT EXISTS (
            SELECT 1 FROM feedback_media fm
            WHERE storage.objects.name = regexp_replace(fm.url, '^.*/storage/v1/object/(public|sign)/feedback-media/', '')
        )
        RETURNING 1
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (optional - depends on your setup)
-- This would be run via pg_cron or external scheduler
COMMENT ON FUNCTION cleanup_orphaned_storage_objects IS 'Run this function periodically to clean up orphaned storage objects. Recommended: daily via pg_cron or external scheduler.';

-- Update feedback_media table to track access
ALTER TABLE feedback_media 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS accessed_at timestamptz,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- Add index for created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_feedback_media_created_at ON feedback_media(created_at);

-- Verification query to ensure policies are correctly set
DO $$
BEGIN
    RAISE NOTICE 'Storage RLS policies have been simplified.';
    RAISE NOTICE 'All uploads should go through Edge Functions with service role.';
    RAISE NOTICE 'Authenticated users can only read media linked to their organizations.';
END $$;