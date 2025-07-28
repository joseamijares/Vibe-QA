# Email System Setup Status

## ✅ What's Ready

1. **Environment Variables** - You've added:
   - `BREVO_API_KEY` - Your Brevo API key
   - `APP_URL` - Your application URL

2. **Code Implementation** - Fully implemented:
   - Email Service (`src/lib/email.ts`)
   - Edge Functions for sending emails
   - Database tables for email queue
   - Email templates (HTML & text)
   - Integration in TeamPage for invitations

3. **Testing Tools** - Ready to use:
   - `npm run verify-email-tables` - Check database setup
   - `npm run test-email-direct` - Test email sending
   - `npm run deploy-email` - Deployment helper

## 🚀 Next Steps (In Order)

### 1. Deploy to Supabase (5 minutes)

```bash
# Option A: Use the helper script
npm run deploy-email

# Option B: Manual commands
supabase login
supabase secrets set BREVO_API_KEY='your-brevo-api-key-here'
supabase secrets set APP_URL='http://localhost:5173'
supabase functions deploy send-invitation-email
supabase functions deploy send-feedback-notification
```

### 2. Verify Setup (2 minutes)

```bash
# Check database tables exist
npm run verify-email-tables
```

Expected output:
- ✅ email_queue table exists
- ✅ email_templates table exists
- Available templates: team_invitation, feedback_notification

### 3. Send Test Email (2 minutes)

```bash
# Send test email (replace with your email)
npm run test-email-direct your-email@example.com
```

### 4. Check Results

1. **Check your email inbox** (and spam folder)
2. **View Brevo Dashboard**: https://app.brevo.com
   - Go to Transactional → Email Activity
   - Look for your test email
3. **Check Edge Function logs** (if needed):
   ```bash
   supabase functions logs send-invitation-email
   ```

## 🔧 Troubleshooting

### If Edge Function deployment fails:
- Make sure you're logged into Supabase CLI
- Verify your project is linked: `supabase status`

### If email doesn't send:
1. Check Edge Function logs for errors
2. Verify BREVO_API_KEY is correct
3. Check Brevo dashboard for API errors
4. Ensure you haven't hit the free tier limit (300/day)

### Common Errors:
- **"Edge function not found"** → Deploy the functions first
- **"BREVO_API_KEY not configured"** → Set the secret in Supabase
- **"Unauthorized"** → Check your Supabase anon key in .env.local

## 📱 Testing in Your App

Once the test email works:

1. Start your app: `npm run dev`
2. Go to Dashboard → Team
3. Click "Invite Team Member"
4. Enter an email and send invitation
5. Check the email was received!

## 🎯 Success Criteria

You'll know everything is working when:
- ✅ Test email script sends successfully
- ✅ You receive the test email in your inbox
- ✅ The invitation link in the email works
- ✅ Team invitations from the UI send emails

## Need Help?

- Full documentation: `/docs/features/email-system.md`
- Testing guide: `/docs/testing/email-system-testing.md`
- Brevo docs: https://developers.brevo.com