# Email System Documentation

## Overview

VibeQA uses Brevo (formerly Sendinblue) for transactional email delivery. The email system is built with reliability and scalability in mind, using Supabase Edge Functions for secure server-side email sending.

## Architecture

```
Frontend (React) → Supabase Edge Functions → Brevo API
                 ↓
            Email Queue DB (for reliability)
```

## Setup Instructions

### 1. Create Brevo Account

1. Sign up for a free Brevo account at [https://www.brevo.com](https://www.brevo.com)
2. Navigate to Settings → API Keys
3. Create a new API key and copy it securely

### 2. Configure Supabase Edge Functions

```bash
# Set the Brevo API key as a secret in Supabase
supabase secrets set BREVO_API_KEY=xkeysib-your-api-key-here

# Set the app URL for email links
supabase secrets set APP_URL=https://your-app-domain.com

# Deploy the Edge Functions
supabase functions deploy send-invitation-email
supabase functions deploy send-feedback-notification
```

### 3. Run Database Migrations

```bash
# Apply the email system migration
supabase db push
```

### 4. Configure Email Domains (Production)

1. In Brevo dashboard, go to Settings → Senders & IP
2. Add and verify your sending domain (e.g., vibeqa.com)
3. Configure SPF, DKIM, and DMARC records as instructed

## Email Types

### 1. Team Invitation Email

Sent when a team admin invites a new member.

**Trigger**: `TeamPage.tsx` → `EmailService.sendInvitationEmail()`

**Template Variables**:
- `organizationName`: Name of the organization
- `inviterName`: Name of the person sending the invitation
- `recipientName`: Name of the recipient
- `role`: Role assigned (Admin, Member, Viewer)
- `acceptLink`: Direct link to accept invitation
- `expiryDate`: When the invitation expires

### 2. Feedback Notification

Sent to team members when new feedback is submitted.

**Trigger**: Widget submission → Edge Function

**Template Variables**:
- `projectName`: Name of the project
- `feedbackType`: Type of feedback (Bug, Suggestion, Praise)
- `reporterName`: Person who submitted feedback
- `reporterEmail`: Email of the reporter
- `pageUrl`: URL where feedback was submitted
- `description`: Feedback description (truncated)
- `feedbackLink`: Direct link to view full feedback

## Email Queue System

The email queue ensures reliable delivery even if the Brevo API is temporarily unavailable.

### Queue States

- `pending`: Email is waiting to be sent
- `processing`: Email is being sent
- `sent`: Email was successfully sent
- `failed`: Email failed after max attempts

### Retry Logic

- Maximum attempts: 3
- Retry delay: 5 minutes
- Failed emails are kept for 7 days
- Successful emails are kept for 30 days

## Email Preferences

Users can manage their email preferences through:

```typescript
// Get current preferences
const prefs = await EmailService.getEmailPreferences(userId);

// Update preferences
await EmailService.updateEmailPreferences(userId, {
  feedback: true,      // Receive feedback notifications
  invitations: true,   // Receive team invitations
  weekly_digest: false // Weekly summary (future feature)
});
```

## Testing Emails

### Local Development

1. Use Brevo's test API key for development
2. Set `APP_URL=http://localhost:5173` in Edge Function environment
3. Use test email addresses (e.g., test@example.com)

### Test Email Delivery

```typescript
// Test invitation email
await EmailService.sendInvitationEmail({
  invitationId: 'test-id',
  email: 'test@example.com',
  organizationName: 'Test Org',
  inviterName: 'Admin',
  role: 'member',
  expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
});
```

## Monitoring

### Email Queue Status

```sql
-- Check pending emails
SELECT * FROM email_queue WHERE status = 'pending';

-- Check failed emails
SELECT * FROM email_queue WHERE status = 'failed';

-- Email sending statistics
SELECT 
  status, 
  COUNT(*) as count,
  DATE(created_at) as date
FROM email_queue
GROUP BY status, DATE(created_at)
ORDER BY date DESC;
```

### Brevo Dashboard

Monitor email delivery in the Brevo dashboard:
- Delivery rates
- Bounce rates
- Open rates (if tracking enabled)
- Spam reports

## Troubleshooting

### Common Issues

1. **"BREVO_API_KEY is not configured"**
   - Ensure the API key is set in Supabase secrets
   - Verify the Edge Function has been redeployed

2. **"Failed to send email"**
   - Check Brevo API key validity
   - Verify sender email is authorized in Brevo
   - Check Brevo account limits (300/day for free tier)

3. **Emails not being received**
   - Check spam folder
   - Verify email domain configuration (SPF, DKIM)
   - Check Brevo dashboard for bounce reports

### Debug Mode

Enable debug logging in Edge Functions:

```typescript
console.log('Email params:', emailParams);
console.log('Brevo response:', result);
```

## Future Enhancements

1. **Email Templates in Database**: Allow admins to customize email templates through UI
2. **Weekly Digest**: Automated weekly summary of feedback activity
3. **Email Analytics**: Track open rates and click-through rates
4. **Webhook Processing**: Handle Brevo webhooks for bounce handling
5. **Multi-language Support**: Localized email templates

## API Reference

### EmailService Methods

```typescript
// Send invitation email
EmailService.sendInvitationEmail(params: SendInvitationEmailParams)

// Send feedback notification
EmailService.sendFeedbackNotification(params: SendFeedbackNotificationParams)

// Queue email for batch sending
EmailService.queueEmail(params: QueueEmailParams)

// Get email queue status
EmailService.getEmailQueueStatus(email: string)

// Update email preferences
EmailService.updateEmailPreferences(userId: string, preferences: EmailPreferences)

// Get email preferences
EmailService.getEmailPreferences(userId: string)
```

## Security Considerations

1. **API Keys**: Never expose Brevo API keys in frontend code
2. **Rate Limiting**: Implement rate limiting on Edge Functions
3. **Email Validation**: Always validate email addresses before sending
4. **Unsubscribe Links**: Include unsubscribe links in all emails
5. **Data Privacy**: Don't include sensitive data in email content