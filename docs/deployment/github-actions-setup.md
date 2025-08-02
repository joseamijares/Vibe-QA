# GitHub Actions Setup Guide

This guide helps you set up the GitHub Actions workflows for VibeQA's production deployment.

## Overview

VibeQA uses a production-only deployment strategy without staging environments. All deployments go directly to production after code review via pull requests.

## Required GitHub Secrets

Set these secrets in your repository: **Settings → Secrets and variables → Actions**

### Essential Secrets

```bash
SUPABASE_ACCESS_TOKEN        # Your Supabase CLI access token
SUPABASE_PROJECT_ID          # Your Supabase project reference ID
SUPABASE_URL                 # https://[your-project].supabase.co
SUPABASE_ANON_KEY           # Your Supabase anonymous/public key
SUPABASE_SERVICE_ROLE_KEY   # Your Supabase service role key
SUPABASE_DB_PASSWORD        # Database password for migrations
DATABASE_URL                # Full PostgreSQL connection string
```

### Optional Secrets

```bash
APP_URL                     # Your production app URL
DISCORD_WEBHOOK_URL         # For health check notifications
SLACK_WEBHOOK_URL          # For health check notifications
BACKUP_BUCKET              # External storage for database backups
```

## Workflow Triggers

### Automatic Deployments (on push to main)
- Database migrations
- Widget deployment
- Edge functions deployment
- Type generation

### Pull Request Checks
- Code quality (formatting, linting, TypeScript)
- Security scanning
- Migration validation
- Bundle size checks

### Scheduled Tasks
- Daily database backups (3 AM UTC)
- Health monitoring (every 15 minutes)
- Security scans (daily at 2 AM UTC)
- Type generation check (daily at 9 AM UTC)

## Setting Up Secrets

### 1. Get Supabase Access Token
```bash
# Visit https://app.supabase.com/account/tokens
# Generate a new token
# Add as SUPABASE_ACCESS_TOKEN
```

### 2. Get Project Credentials
```bash
# In Supabase Dashboard → Settings → API
# Copy:
# - Project URL → SUPABASE_URL
# - anon public key → SUPABASE_ANON_KEY
# - service_role key → SUPABASE_SERVICE_ROLE_KEY
```

### 3. Get Database Credentials
```bash
# In Supabase Dashboard → Settings → Database
# Copy:
# - Database password → SUPABASE_DB_PASSWORD
# - Connection string → DATABASE_URL
```

## Testing Your Setup

### 1. Test Migration Workflow
```bash
# Create a test migration
echo "-- Test migration" > supabase/migrations/999_test.sql
git add supabase/migrations/999_test.sql
git commit -m "test: migration workflow"
git push origin main
```

### 2. Test Widget Deployment
```bash
# Make a small widget change
# Edit src/widget/loader.ts
git add src/widget/loader.ts
git commit -m "test: widget deployment"
git push origin main
```

### 3. Test Health Monitoring
```bash
# Manually trigger the workflow
# Go to Actions → Health Monitoring → Run workflow
```

## Monitoring Deployments

### Check Workflow Status
1. Go to your repository's **Actions** tab
2. View running/completed workflows
3. Click on any workflow for detailed logs

### Health Check Results
- Check workflow summaries for health status
- Set up Discord/Slack webhooks for alerts
- Monitor the Actions tab for scheduled runs

## Troubleshooting

### Migration Deployment Fails
- Check `SUPABASE_DB_PASSWORD` is correct
- Verify SQL syntax in migration files
- Ensure migrations are incremental

### Widget Deployment Fails
- Check widget size (must be under 500KB)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase storage bucket permissions

### Type Generation Fails
- Ensure `SUPABASE_ACCESS_TOKEN` is valid
- Check project connection in Supabase CLI
- Verify database schema is accessible

### Health Checks Fail
- Verify all URL secrets are set correctly
- Check Supabase project is active
- Ensure services are not rate-limited

## Best Practices

1. **Always use pull requests** for code changes
2. **Run local checks** before pushing: `npm run precommit`
3. **Monitor deployments** after merging to main
4. **Keep secrets secure** - rotate them quarterly
5. **Review workflow logs** for any warnings or errors

## Emergency Procedures

### Rollback Database Migration
1. Check the backup artifact in the workflow run
2. Manually restore using the backup file
3. Fix the migration and redeploy

### Rollback Widget Deployment
The workflow automatically attempts rollback on failure. If manual intervention is needed:
1. Find the previous version in Supabase storage
2. Copy it to the production path
3. Clear any CDN caches

### Disable Workflows
If needed, you can disable workflows temporarily:
1. Go to Actions → Select workflow → ⋯ → Disable workflow
2. Fix the issue
3. Re-enable when ready