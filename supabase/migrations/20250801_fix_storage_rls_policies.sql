-- Fix Storage RLS Policies for Multi-tenant Architecture
-- This migration fixes the storage policies to correctly handle the path structure:
-- {organizationId}/{feedbackId}/{filename}

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Users can upload feedback media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view feedback media from their organizations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete feedback media from their organizations" ON storage.objects;

-- Create function to extract organization ID from storage path
CREATE OR REPLACE FUNCTION extract_org_id_from_path(full_path text)
RETURNS uuid AS $$
BEGIN
    -- Path format: organizationId/feedbackId/filename
    -- Extract the first part before the first slash
    RETURN NULLIF(SPLIT_PART(full_path, '/', 1), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to extract feedback ID from storage path
CREATE OR REPLACE FUNCTION extract_feedback_id_from_path(full_path text)
RETURNS uuid AS $$
BEGIN
    -- Path format: organizationId/feedbackId/filename
    -- Extract the second part between slashes
    RETURN NULLIF(SPLIT_PART(full_path, '/', 2), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- New storage policies for feedback-media bucket with proper path handling
CREATE POLICY "Service role can upload feedback media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'feedback-media'
        AND auth.role() = 'service_role'
    );

CREATE POLICY "Authenticated users can view their organization's feedback media"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'feedback-media'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 
            FROM organization_members om
            WHERE om.organization_id = extract_org_id_from_path(name)
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can delete their feedback media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'feedback-media'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 
            FROM organization_members om
            WHERE om.organization_id = extract_org_id_from_path(name)
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- Add policy for updating objects (needed for metadata updates)
CREATE POLICY "Service role can update feedback media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'feedback-media'
        AND auth.role() = 'service_role'
    );

-- Create function to generate signed URLs with expiration
CREATE OR REPLACE FUNCTION generate_signed_media_url(
    p_feedback_id uuid,
    p_media_url text,
    p_expires_in integer DEFAULT 3600
)
RETURNS text AS $$
DECLARE
    v_org_id uuid;
    v_path text;
    v_bucket text;
BEGIN
    -- Check if user has access to this feedback
    SELECT p.organization_id INTO v_org_id
    FROM feedback f
    JOIN projects p ON p.id = f.project_id
    WHERE f.id = p_feedback_id;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Feedback not found';
    END IF;
    
    IF NOT is_organization_member(v_org_id, auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Extract path from URL
    -- URL format: https://.../storage/v1/object/public/feedback-media/...
    v_path := regexp_replace(p_media_url, '^.*/storage/v1/object/public/feedback-media/', '');
    
    -- Generate signed URL (this is a placeholder - actual implementation depends on Supabase client)
    -- In production, this would call Supabase's createSignedUrl function
    RETURN format('%s?token=signed_%s&expires=%s', 
        p_media_url, 
        encode(gen_random_bytes(16), 'hex'),
        extract(epoch from now() + interval '1 second' * p_expires_in)::bigint
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_signed_media_url TO authenticated;

-- Update feedback_media table to add security columns
ALTER TABLE feedback_media 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS access_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_media_feedback_id ON feedback_media(feedback_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_name_prefix ON storage.objects(name text_pattern_ops) WHERE bucket_id = 'feedback-media';

-- Add RLS policy for feedback_media table
ALTER TABLE feedback_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media records from their organizations"
    ON feedback_media FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM feedback f
            JOIN projects p ON p.id = f.project_id
            WHERE f.id = feedback_media.feedback_id
            AND is_organization_member(p.organization_id, auth.uid())
        )
    );

-- Add comment explaining the storage structure
COMMENT ON TABLE storage.objects IS 'Storage objects with path structure: {organizationId}/{feedbackId}/{filename} for feedback-media bucket';