-- This migration only adds the widget assets bucket and related tables
-- It assumes the base schema is already in place

-- Create storage bucket for widget distribution (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'widget-assets') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'widget-assets',
            'widget-assets',
            true, -- Public bucket for CDN distribution
            10485760, -- 10MB limit (widget should be much smaller)
            array['application/javascript', 'text/javascript', 'application/json', 'text/html', 'text/css']
        );
    END IF;
END $$;

-- Public read access for widget files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Public read access for widget assets'
    ) THEN
        CREATE POLICY "Public read access for widget assets"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'widget-assets');
    END IF;
END $$;

-- Only admins can upload/update widget files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Admins can upload widget assets'
    ) THEN
        CREATE POLICY "Admins can upload widget assets"
            ON storage.objects FOR INSERT
            WITH CHECK (
                bucket_id = 'widget-assets'
                AND auth.role() = 'service_role'
            );
    END IF;
END $$;

-- Create a table to track widget versions (if not exists)
CREATE TABLE IF NOT EXISTS widget_versions (
    id uuid primary key default gen_random_uuid(),
    version text not null,
    channel text not null default 'production',
    file_path text not null,
    file_size integer,
    checksum text,
    release_notes text,
    is_latest boolean default false,
    created_at timestamp with time zone default now(),
    created_by uuid references auth.users(id),
    CONSTRAINT widget_versions_version_key UNIQUE (version)
);

-- Enable RLS if not already enabled
ALTER TABLE widget_versions ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_widget_versions_latest 
    ON widget_versions(channel, is_latest) 
    WHERE is_latest = true;

CREATE INDEX IF NOT EXISTS idx_widget_versions_version 
    ON widget_versions(version);