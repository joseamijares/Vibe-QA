# Widget Deployment Guide

This guide walks you through deploying the VibeQA widget and backend functions.

## Prerequisites

- Supabase CLI installed and configured
- Node.js and npm installed
- Access to your Supabase project
- Environment variables configured in `.env`

## Step 1: Deploy Edge Functions

### 1.1 Login to Supabase CLI

```bash
supabase login
```

### 1.2 Link Your Project

```bash
# Replace with your project reference from Supabase dashboard
supabase link --project-ref your-project-ref
```

### 1.3 Deploy the Functions

We've created a deployment script to simplify this process:

```bash
# Run the deployment script
./scripts/deploy-feedback-function.sh
```

Or deploy manually:

```bash
# Deploy all functions
supabase functions deploy submit-feedback
supabase functions deploy send-invitation-email
supabase functions deploy send-feedback-notification

# Set secrets
supabase secrets set BREVO_API_KEY='your-brevo-api-key'
supabase secrets set APP_URL='https://vibeqa.app'
```

### 1.4 Verify Deployment

```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs submit-feedback
```

## Step 2: Set Up Test Project

### 2.1 Run the Setup Script

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/setup-test-project.sql`
4. Run the query

This will create:
- A test organization named "Test Organization"
- A test project with API key: `proj_test123456789`
- Allowed domains for localhost testing

### 2.2 Verify Test Project

Run this query to verify:

```sql
SELECT * FROM projects WHERE api_key = 'proj_test123456789';
```

## Step 3: Test the Integration

### 3.1 Test with Script

```bash
# Test feedback submission
npm run test-feedback
```

Expected output:
```
🧪 Testing Feedback Submission...
✅ Feedback submitted successfully!
📝 Feedback ID: [UUID]
```

### 3.2 Test with Widget Demo

1. Start the development server:
```bash
npm run dev
```

2. Open the widget demo:
```
http://localhost:5173/widget-demo.html
```

3. Click "Open Widget" and submit test feedback

### 3.3 Verify in Database

Check the feedback was stored:

```sql
-- In Supabase SQL Editor
SELECT * FROM feedback 
WHERE project_id = (
  SELECT id FROM projects 
  WHERE api_key = 'proj_test123456789'
)
ORDER BY created_at DESC
LIMIT 10;
```

## Step 4: Build Widget for Production

### 4.1 Build the Widget

```bash
# Build the widget bundle
npm run build:widget
```

This creates optimized files in `dist-widget/`:
- `widget.iife.js` - The main widget file
- `widget.iife.js.map` - Source map for debugging

### 4.2 Test Production Build

```bash
# Serve the production build
npm run preview

# Open the demo
open http://localhost:4173/widget-demo.html
```

## Step 5: Deploy to CDN

### Option 1: Cloudflare Pages

1. Create a new Cloudflare Pages project
2. Upload the `dist-widget` folder
3. Set custom domain (e.g., cdn.vibeqa.com)

### Option 2: AWS S3 + CloudFront

```bash
# Upload to S3
aws s3 sync dist-widget/ s3://your-widget-bucket/ --acl public-read

# Set cache headers
aws s3 cp s3://your-widget-bucket/widget.iife.js \
  s3://your-widget-bucket/widget.iife.js \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=3600"
```

### Option 3: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd dist-widget
vercel --prod
```

## Step 6: Configure Production URLs

### 6.1 Update Widget Configuration

Users will need to configure the widget with your production URLs:

```html
<script>
window.vibeQAConfig = {
  projectKey: 'their-project-key',
  apiUrl: 'https://oussjxzwtxlanuxtgmtt.supabase.co/functions/v1'
};
</script>
<script src="https://cdn.vibeqa.com/widget.js" async></script>
```

### 6.2 Update CORS Settings

If needed, update CORS in your Edge Function to allow specific domains.

## Step 7: Monitor and Maintain

### 7.1 Monitor Function Performance

```bash
# View function invocations
supabase functions logs submit-feedback --tail

# Check function metrics in Supabase Dashboard
# Functions → submit-feedback → Metrics
```

### 7.2 Set Up Alerts

In Supabase Dashboard:
1. Go to Functions → submit-feedback
2. Set up alerts for errors or high latency
3. Configure email notifications

### 7.3 Regular Maintenance

- Monitor storage usage for uploaded media
- Clean up old test data periodically
- Review and rotate API keys
- Update dependencies regularly

## Troubleshooting

### Function Not Found (404)

- Verify function is deployed: `supabase functions list`
- Check the function URL is correct
- Ensure project is linked correctly

### Authentication Errors (401)

- Verify API key is correct
- Check project is active in database
- Ensure API key matches the project

### CORS Errors

- Check Edge Function includes CORS headers
- Verify domain is in allowed_domains if configured
- Try with a simple test first

### Media Upload Failures

- Check storage bucket exists
- Verify RLS policies on storage
- Check file size limits (10MB)
- Ensure correct file types

## Next Steps

1. Set up monitoring and analytics
2. Configure rate limiting
3. Implement caching for better performance
4. Set up automated backups
5. Create customer documentation

## Support

For issues or questions:
- Check function logs: `supabase functions logs submit-feedback`
- Review error details in browser console
- Check Supabase Dashboard for service status