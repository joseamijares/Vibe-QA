# GitHub Secrets Configuration

This file lists all the GitHub secrets required for the workflows to function properly. Set these in your repository's Settings > Secrets and variables > Actions.

## Required Secrets

### Supabase Secrets

#### General
- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token for CLI operations

#### Staging Environment
- `STAGING_SUPABASE_PROJECT_ID` - Staging project reference ID
- `STAGING_SUPABASE_URL` - Staging project URL (https://[project-id].supabase.co)
- `STAGING_SUPABASE_ANON_KEY` - Staging anonymous/public key
- `STAGING_SUPABASE_SERVICE_ROLE_KEY` - Staging service role key
- `STAGING_SUPABASE_DB_PASSWORD` - Staging database password
- `STAGING_DATABASE_URL` - Full staging database connection string

#### Production Environment
- `PRODUCTION_SUPABASE_PROJECT_ID` - Production project reference ID
- `PRODUCTION_SUPABASE_URL` - Production project URL
- `PRODUCTION_SUPABASE_ANON_KEY` - Production anonymous/public key
- `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY` - Production service role key
- `PRODUCTION_SUPABASE_DB_PASSWORD` - Production database password
- `PRODUCTION_DATABASE_URL` - Full production database connection string

### Application URLs
- `STAGING_APP_URL` - Staging application URL (e.g., https://staging.vibeqa.com)
- `PRODUCTION_APP_URL` - Production application URL (e.g., https://vibeqa.com)

### Monitoring & Alerts (Optional)
- `DISCORD_WEBHOOK_URL` - Discord webhook for notifications
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications

### CDN & Storage (Optional)
- `CLOUDFLARE_ZONE_ID` - Cloudflare zone ID for cache purging
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with cache purge permissions

### Backup Storage (Optional)
- `PRODUCTION_BACKUP_BUCKET` - S3/Storage bucket for production backups
- `STAGING_BACKUP_BUCKET` - S3/Storage bucket for staging backups

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
- Use different secrets for staging and production
- Limit secret access to only necessary team members
- Enable secret scanning in your repository settings