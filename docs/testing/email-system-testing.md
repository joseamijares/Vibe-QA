# Email System Testing Guide

## Quick Start

Now that you've added the `BREVO_API_KEY` and `APP_URL` to your environment, follow these steps to test the email system:

## 1. Deploy Edge Functions

First, you need to deploy the Edge Functions to Supabase:

```bash
# Run the deployment helper script
npm run deploy-email
```

This will guide you through:
- Logging into Supabase CLI
- Setting the secrets in Supabase
- Deploying the Edge Functions

### Manual Deployment Steps

If you prefer to do it manually:

```bash
# 1. Login to Supabase
supabase login

# 2. Set secrets (replace with your actual values)
supabase secrets set BREVO_API_KEY='your-brevo-api-key'
supabase secrets set APP_URL='http://localhost:5173'  # or your production URL

# 3. Deploy functions
supabase functions deploy send-invitation-email
supabase functions deploy send-feedback-notification

# 4. Push database migrations
supabase db push
```

## 2. Verify Database Tables

Check that the email tables were created successfully:

```bash
npm run verify-email-tables
```

This will show you:
- ✅ If email_queue table exists
- ✅ If email_templates table exists
- ✅ Available email templates
- 📊 Current email queue status

## 3. Test Email Sending

### Test with Script

Send a test invitation email:

```bash
# Send to default test email
npm run test-email

# Or send to specific email
npm run test-email your-email@example.com
```

### Test via UI

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Team page in your dashboard

3. Click "Invite Team Member"

4. Enter an email address and select a role

5. Click "Send Invitation"

## 4. Check Email Delivery

### In Your Email Client
- Check inbox (and spam folder)
- Verify email formatting looks correct
- Test the invitation link works

### In Brevo Dashboard
1. Log into [Brevo Dashboard](https://app.brevo.com)
2. Go to Transactional → Email Activity
3. Check for your test email
4. View delivery status and any errors

### In Database
Check the email queue status:

```sql
-- View all emails in queue
SELECT * FROM email_queue ORDER BY created_at DESC;

-- Check failed emails
SELECT * FROM email_queue WHERE status = 'failed';
```

## 5. Troubleshooting

### Common Issues and Solutions

#### "BREVO_API_KEY is not configured"
- Ensure you've set the secret: `supabase secrets set BREVO_API_KEY='your-key'`
- Redeploy the function after setting secrets

#### "Failed to invoke edge function"
- Check Supabase Edge Function logs:
  ```bash
  supabase functions logs send-invitation-email
  ```

#### Email not received
1. Check spam folder
2. Verify Brevo API key is valid
3. Check Brevo account limits (300 emails/day for free tier)
4. Verify sender domain in Brevo dashboard

#### "Unauthorized" error
- Ensure your Supabase anon key is correct in `.env.local`
- Check that RLS policies allow the operation

### Debug Commands

```bash
# View Edge Function logs
supabase functions logs send-invitation-email --tail

# Check function deployment status
supabase functions list

# Test Edge Function locally
supabase functions serve send-invitation-email --env-file .env.local
```

## 6. Production Checklist

Before going to production:

- [ ] Set production APP_URL in Supabase secrets
- [ ] Configure custom domain in Brevo
- [ ] Set up SPF, DKIM, and DMARC records
- [ ] Test with production email addresses
- [ ] Monitor Brevo dashboard for delivery rates
- [ ] Set up email bounce handling
- [ ] Configure rate limiting on Edge Functions

## Email System Architecture

```
User Action (Invite Team Member)
    ↓
TeamPage Component
    ↓
EmailService.sendInvitationEmail()
    ↓
Supabase Edge Function (send-invitation-email)
    ↓
Brevo API (Transactional Email)
    ↓
Email Delivered to Recipient
```

## Need Help?

- Check the [main email documentation](/docs/features/email-system.md)
- View Edge Function logs in Supabase dashboard
- Check Brevo documentation at https://developers.brevo.com