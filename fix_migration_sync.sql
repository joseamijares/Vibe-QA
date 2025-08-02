-- Fix migration sync issues
-- Run this in Supabase SQL Editor to prepare for migration sync

-- 1. Check if activity_logs exists and has the right structure
DO $$ 
BEGIN
    -- Add feedback_id column if it doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'feedback_id') THEN
            ALTER TABLE activity_logs ADD COLUMN feedback_id uuid REFERENCES feedback(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 2. Mark the problematic migrations as already applied
-- This tells Supabase these migrations have been manually applied
INSERT INTO supabase_migrations.schema_migrations (version, inserted_at)
VALUES 
    ('20250201_activity_logging_triggers', NOW()),
    ('20250201_add_profiles_table', NOW()),
    ('20250201_enforce_usage_limits', NOW()),
    ('20250201_fix_comment_activity_schema', NOW()),
    ('20250201_fix_profile_rls_and_activity_limits', NOW()),
    ('20250201_remove_free_enterprise_plans', NOW()),
    ('20250201_storage_tracking', NOW()),
    ('20250731_superadmin_index', NOW()),
    ('20250801_function_security_paths', NOW()),
    ('20250801_project_members', NOW()),
    ('20250801_security_fixes', NOW())
ON CONFLICT (version) DO NOTHING;

-- 3. Verify migration status
SELECT version, inserted_at 
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '2025%'
ORDER BY version;