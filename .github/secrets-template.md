# GitHub Secrets Configuration

This file lists all the GitHub secrets required for the workflows to function properly. Set these in your repository's Settings > Secrets and variables > Actions.

## Required Secrets

### Supabase Secrets

- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token for CLI operations
- `SUPABASE_PROJECT_ID` - Your Supabase project reference ID
- `SUPABASE_URL` - Your Supabase project URL (https://[project-id].supabase.co)
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep this very secure!)
- `SUPABASE_DB_PASSWORD` - Database password for migrations
- `DATABASE_URL` - Full database connection string

### Application URL
- `APP_URL` - Your application URL (e.g., https://vibeqa.com or http://localhost:5173 for dev)

### Monitoring & Alerts (Optional)
- `DISCORD_WEBHOOK_URL` - Discord webhook for notifications
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications

### Backup Storage (Optional)
- `BACKUP_BUCKET` - Storage bucket name for database backups (if using external storage)

## How to Generate Secrets

### Supabase Access Token
1. Go to https://app.supabase.com/account/tokens
2. Click "Generate new token"
3. Give it a descriptive name
4. Copy the token (you won't see it again)

### Supabase Project Secrets
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Find:
   - Project URL
   - Anon/Public key
   - Service role key (keep this very secure!)
4. For database password, check Settings > Database

### Discord Webhook
1. In your Discord server, go to Server Settings > Integrations
2. Click "Create Webhook"
3. Copy the webhook URL

### Slack Webhook
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Add "Incoming Webhooks" feature
4. Create webhook for your channel

## Security Notes

⚠️ **NEVER COMMIT SECRETS TO YOUR REPOSITORY**

- Service role keys have full database access - guard them carefully
- Rotate secrets regularly (quarterly recommended)
- Limit secret access to only necessary team members
- Enable secret scanning in your repository settings
- Use GitHub environments for additional protection on production secrets