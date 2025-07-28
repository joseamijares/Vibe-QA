# Backend Setup Guide for Widget Feedback Submission

## Overview

This guide walks you through setting up the backend API for the VibeQA widget to submit feedback. The backend uses Supabase Edge Functions to handle feedback submissions, media uploads, and email notifications.

## Prerequisites

- Supabase project set up
- Supabase CLI installed (`npm install -g supabase`)
- Brevo account for email notifications (optional)
- Storage buckets configured in Supabase

## Step 1: Configure Storage Buckets

Ensure you have the `feedback-media` storage bucket created:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `feedback-media`
3. Set it as a private bucket
4. Configure RLS policies (see `supabase/migrations/003_storage_buckets.sql`)

## Step 2: Set Environment Variables

### Local Development

1. Create `.env.local` file:
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

2. Set Supabase secrets for Edge Functions:
```bash
supabase secrets set BREVO_API_KEY='your-brevo-api-key'
supabase secrets set APP_URL='http://localhost:5173'
```

### Production

Set these in your Supabase Dashboard → Settings → Edge Functions:
- `BREVO_API_KEY`: Your Brevo API key
- `APP_URL`: Your production app URL

## Step 3: Deploy Edge Functions

1. Login to Supabase CLI:
```bash
supabase login
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
```

3. Deploy the Edge Functions:
```bash
# Deploy the feedback submission function
supabase functions deploy submit-feedback

# Deploy email notification functions
supabase functions deploy send-invitation-email
supabase functions deploy send-feedback-notification
```

## Step 4: Configure Widget

Update your widget configuration to use the Edge Function URL:

### Production Configuration
```javascript
window.vibeQAConfig = {
  projectKey: 'your-project-key',
  apiUrl: 'https://your-project-id.supabase.co/functions/v1',
  // ... other options
};
```

### Local Development Configuration
```javascript
window.vibeQAConfig = {
  projectKey: 'proj_test123456789',
  apiUrl: 'http://localhost:54321/functions/v1',
  debug: true,
  // ... other options
};
```

## Step 5: Create a Test Project

1. Insert a test project in your database:

```sql
-- First create an organization if you don't have one
INSERT INTO organizations (name, slug)
VALUES ('Test Organization', 'test-org')
RETURNING id;

-- Then create a project (replace organization_id with the ID from above)
INSERT INTO projects (
  organization_id,
  name,
  slug,
  api_key,
  is_active
) VALUES (
  'your-organization-id',
  'Test Project',
  'test-project',
  'proj_test123456789',
  true
);
```

## Step 6: Test the Integration

### Using the Widget Demo

1. Start the development server:
```bash
npm run dev
```

2. Open the widget demo:
```
http://localhost:5173/widget-demo.html
```

3. Click "Open Widget" and submit test feedback

### Using cURL

Test the API directly:

```bash
curl -X POST \
  http://localhost:54321/functions/v1/submit-feedback \
  -H "Content-Type: application/json" \
  -H "X-Project-Key: proj_test123456789" \
  -d '{
    "type": "bug",
    "description": "Test feedback from cURL",
    "pageUrl": "https://example.com",
    "reporterEmail": "test@example.com",
    "browserInfo": {
      "browser": "cURL",
      "version": "test",
      "os": "test"
    },
    "deviceInfo": {
      "type": "desktop",
      "os": "test",
      "screenResolution": "test"
    }
  }'
```

## Step 7: Monitor and Debug

### Check Edge Function Logs

```bash
# View logs for the submit-feedback function
supabase functions logs submit-feedback
```

### Common Issues and Solutions

1. **CORS Errors**
   - Ensure the Edge Function includes proper CORS headers
   - Check that the widget is using the correct API URL

2. **Authentication Errors (401)**
   - Verify the project API key is correct
   - Check that the project exists and is active

3. **Storage Upload Failures**
   - Ensure the `feedback-media` bucket exists
   - Check bucket RLS policies
   - Verify file size limits (10MB max)

4. **Email Not Sending**
   - Verify `BREVO_API_KEY` is set correctly
   - Check Edge Function logs for errors
   - Ensure email templates are configured

## Production Deployment Checklist

- [ ] Storage buckets created and configured
- [ ] Environment variables set in Supabase Dashboard
- [ ] Edge Functions deployed successfully
- [ ] Domain whitelist configured (if needed)
- [ ] Email notifications tested
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up
- [ ] Widget configuration updated with production URLs

## API Rate Limiting

Consider implementing rate limiting for production:

1. Use Supabase's built-in rate limiting
2. Or implement custom rate limiting in the Edge Function
3. Monitor usage in Supabase Dashboard → Edge Functions

## Security Considerations

1. **API Key Security**
   - Generate unique API keys per project
   - Rotate keys regularly
   - Never expose service role keys

2. **Domain Validation**
   - Configure allowed domains per project
   - Validate origin headers

3. **Input Validation**
   - Sanitize all user inputs
   - Validate file types and sizes
   - Limit feedback length

## Next Steps

1. Test the complete flow with media uploads
2. Set up monitoring and alerts
3. Configure CDN for widget distribution
4. Implement analytics tracking
5. Set up automated backups