# Email Integration Guide

## Overview

VibeQA uses Brevo (formerly Sendinblue) as the email service provider, integrated with Supabase Auth through the Send Email Hook. This setup provides:

- Custom branded email templates
- Rate limiting (10 emails/minute per user)
- Support for all auth flows (signup, magic link, password reset, etc.)
- Simple, minimal email designs consistent with VibeQA branding

## Email Templates

All auth email templates are designed to be:
- **Simple and minimal** - Only essential information
- **Consistent branding** - Using VibeQA's gradient colors (#094765 to #3387a7)
- **Mobile-friendly** - Max width of 480px
- **Accessible** - Clear text hierarchy and contrast

### Available Templates

1. **Welcome Email** - Sent after user signup
2. **Magic Link** - For passwordless login
3. **Password Reset** - For forgotten passwords
4. **Email Verification** - To confirm email addresses
5. **Email Change Confirmation** - When users update their email

## Setup Instructions

### 1. Configure Brevo

1. Create a Brevo account at https://www.brevo.com
2. Verify your sender domain
3. Generate an API key from Settings > SMTP & API
4. Create a sender email (e.g., noreply@vibeqa.com)

### 2. Set Environment Variables

Add to your `.env.local`:

```bash
# Brevo Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@vibeqa.com

# Supabase Auth Hook Secret (generate a secure random string)
SUPABASE_AUTH_HOOK_SECRET=your_webhook_secret_here

# App URL for email links
NEXT_PUBLIC_APP_URL=https://app.vibeqa.com
```

### 3. Deploy the Edge Function

```bash
# Deploy the send-email-hook function
supabase functions deploy send-email-hook
```

### 4. Configure Supabase Auth Hook

In Supabase Dashboard:

1. Go to Authentication > Hooks
2. Enable "Send Email" hook
3. Set the endpoint to your edge function URL:
   ```
   https://[project-ref].supabase.co/functions/v1/send-email-hook
   ```
4. Add the webhook secret in the headers:
   ```
   Authorization: Bearer [your_webhook_secret]
   ```

### 5. Disable Default Supabase Emails

In Supabase Dashboard > Authentication > Email Templates:
- Keep templates enabled but they won't be sent when using the hook
- The hook intercepts and sends via Brevo instead

## Rate Limiting

The email system includes built-in rate limiting:
- **10 emails per minute** per email address
- Prevents abuse and helps maintain good sender reputation
- Returns 429 status code when limit exceeded

## Testing

To test the email integration:

1. **Test Signup Flow**:
   ```bash
   # Create a test user
   curl -X POST https://[your-app]/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "testpass123"}'
   ```

2. **Test Magic Link**:
   ```bash
   # Request magic link
   curl -X POST https://[your-app]/auth/magic-link \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

3. **Check Brevo Dashboard**:
   - Log into Brevo
   - Check Transactional > Email Activity
   - Verify emails are being sent

## Troubleshooting

### Emails Not Sending

1. **Check Edge Function Logs**:
   ```bash
   supabase functions logs send-email-hook
   ```

2. **Verify Environment Variables**:
   - Ensure BREVO_API_KEY is set correctly
   - Check SUPABASE_AUTH_HOOK_SECRET matches dashboard config

3. **Check Brevo Configuration**:
   - Verify sender email is verified
   - Check API key has correct permissions
   - Monitor Brevo dashboard for errors

### Rate Limit Issues

- If users hit rate limits, they'll see appropriate error messages
- Rate limits reset after 1 minute
- Consider increasing limits for production if needed

### Template Issues

- Templates are in `/supabase/functions/_shared/auth-email-templates.ts`
- Test rendering by checking function logs
- Ensure all template variables are properly passed

## Customization

To customize email templates:

1. Edit `/supabase/functions/_shared/auth-email-templates.ts`
2. Keep designs simple and focused
3. Test on multiple email clients
4. Redeploy the edge function after changes

## Best Practices

1. **Keep emails simple** - Authentication emails should be clear and trustworthy
2. **Avoid marketing content** - Keep auth emails separate from marketing
3. **Test thoroughly** - Check rendering in different email clients
4. **Monitor delivery** - Use Brevo's analytics to track performance
5. **Handle failures gracefully** - Log errors but don't block auth flow

## Migration from Default Emails

If migrating from Supabase default emails:

1. Deploy the edge function first
2. Test with a few users
3. Enable the auth hook
4. Monitor for any issues
5. Default emails automatically stop when hook is active