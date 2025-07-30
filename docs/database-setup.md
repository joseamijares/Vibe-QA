# VibeQA Database Setup Guide

This guide walks you through setting up the VibeQA database schema in Supabase.

## Prerequisites

- A Supabase project created
- Access to the Supabase Dashboard SQL Editor
- Or Supabase CLI installed and configured

## Quick Setup (Recommended)

### Option 1: Using Supabase Dashboard

1. **Open SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor (left sidebar)

2. **Run the Complete Setup Script**
   - Click "New Query"
   - Copy the entire contents of `scripts/setup-database.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

3. **Verify Setup**
   - You should see success messages in the output
   - The script creates all tables and a test project
   - Note the test project API key: `proj_test123456789`

### Option 2: Using Supabase CLI

```bash
# Make sure you're connected to your project
supabase db push

# Or run the setup script directly
supabase db execute -f scripts/setup-database.sql
```

## What Gets Created

### 1. Database Tables

- **organizations** - Multi-tenant organizations
- **projects** - Projects that collect feedback
- **organization_members** - User-organization relationships
- **feedback** - All feedback submissions
- **feedback_media** - Media attachments for feedback
- **comments** - Comments on feedback
- **activity_logs** - Audit trail
- **invitations** - Team invitations
- **email_templates** - Email template storage
- **email_queue** - Email sending queue

### 2. Custom Types

- **user_role** - owner, admin, member, viewer
- **feedback_type** - bug, suggestion, praise, other
- **feedback_status** - new, in_progress, resolved, archived
- **feedback_priority** - low, medium, high, critical

### 3. Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only see organizations they belong to
- Feedback can be created publicly (via API key)
- Team members have role-based access

### 4. Test Data

The script automatically creates:
- Test Organization (slug: `test-org`)
- Test Project (API key: `proj_test123456789`)
- Allowed domains for localhost development

## Manual Setup (If Needed)

If you prefer to run migrations individually:

```sql
-- Run in this order:
1. scripts/001_initial_schema.sql
2. scripts/002_rls_policies.sql
3. scripts/003_storage_buckets.sql
4. scripts/004_update_team_policies.sql
5. scripts/005_email_system.sql
6. scripts/006_update_feedback_table.sql
```

## Storage Buckets

After running the SQL script, create these storage buckets:

1. **In Supabase Dashboard**
   - Go to Storage (left sidebar)
   - Click "New Bucket"

2. **Create `feedback-media` bucket**
   - Name: `feedback-media`
   - Public: No (keep it private)
   - File size limit: 10MB
   - Allowed MIME types: 
     - `image/*` (screenshots)
     - `audio/*` (voice recordings)

3. **Create `organization-assets` bucket**
   - Name: `organization-assets`
   - Public: No
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

## Verification Steps

### 1. Check Tables Were Created

Run this query to verify all tables exist:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

You should see:
- activity_logs
- comments
- email_queue
- email_templates
- feedback
- feedback_media
- invitations
- organization_members
- organizations
- projects

### 2. Verify Test Project

```sql
SELECT * FROM projects WHERE api_key = 'proj_test123456789';
```

This should return the test project details.

### 3. Test Feedback Submission

Use the test script to verify everything works:

```bash
npm run test-feedback
```

## Troubleshooting

### "relation does not exist" Error

This means the tables weren't created. Run the complete setup script:
```bash
scripts/setup-database.sql
```

### "permission denied" Error

Make sure you're using the correct Supabase credentials and that RLS policies are properly set.

### Storage Upload Fails

1. Verify storage buckets exist
2. Check bucket RLS policies
3. Ensure service role key is used for uploads

### Types Already Exist

The setup script handles this gracefully, but if you see warnings about duplicate types, it's safe to ignore them.

## Next Steps

1. **Deploy Edge Functions**
   ```bash
   ./scripts/deploy-feedback-function.sh
   ```

2. **Test the Integration**
   ```bash
   npm run test-feedback
   ```

3. **Configure Your Application**
   - Update `.env` with your Supabase credentials
   - Set the API URL in your widget configuration

## Maintenance

### View Recent Feedback

```sql
SELECT 
    f.*,
    p.name as project_name,
    o.name as org_name
FROM feedback f
JOIN projects p ON f.project_id = p.id
JOIN organizations o ON p.organization_id = o.id
ORDER BY f.created_at DESC
LIMIT 20;
```

### Clean Test Data

```sql
-- Delete test feedback (keeps project)
DELETE FROM feedback 
WHERE project_id = (
    SELECT id FROM projects 
    WHERE api_key = 'proj_test123456789'
);
```

### Monitor Email Queue

```sql
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY scheduled_at;
```

## Security Notes

1. **API Keys** - Keep project API keys secure
2. **RLS Policies** - Always test with different user roles
3. **Service Role Key** - Never expose in client code
4. **Backups** - Enable point-in-time recovery in production

## Support

If you encounter issues:

1. Check Supabase service status
2. Review SQL Editor output for errors
3. Verify your project is on the correct plan
4. Check function logs for Edge Function errors