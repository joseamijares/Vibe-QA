# GitHub Actions Workflows Documentation

This document describes the GitHub Actions workflows configured for VibeQA to automate CI/CD processes, security scanning, and monitoring.

## Overview

VibeQA uses GitHub Actions for:
- Automated database migrations
- TypeScript type generation and validation
- Widget deployment pipeline
- Edge functions CI/CD
- Security scanning
- Health monitoring

## Workflows

### 1. Database Migrations (`supabase-migrations.yml`)

**Purpose**: Automatically deploy and validate database migrations to staging and production environments.

**Triggers**:
- Push to `main` or `Dev` branches (when SQL files change)
- Pull requests (validation only)
- Manual workflow dispatch

**Key Features**:
- SQL syntax validation
- Migration naming convention enforcement
- Automatic deployment to staging on Dev branch push
- Production deployment with backup on main branch push
- Migration diff generation
- Rollback capability

**Required Secrets**:
- `SUPABASE_ACCESS_TOKEN`
- `STAGING_SUPABASE_PROJECT_ID`
- `STAGING_SUPABASE_DB_PASSWORD`
- `PRODUCTION_SUPABASE_PROJECT_ID`
- `PRODUCTION_SUPABASE_DB_PASSWORD`

### 2. Type Generation & Validation (`type-check.yml`)

**Purpose**: Generate TypeScript types from database schema and validate type safety across the codebase.

**Triggers**:
- Push to `main` or `Dev` branches
- Pull requests
- Daily schedule (9 AM UTC)
- Manual workflow dispatch

**Key Features**:
- Automatic TypeScript type generation from Supabase schema
- Type change detection
- Automatic PR creation for type updates
- Type coverage analysis (90% threshold)
- Unsafe type assertion detection
- API endpoint type validation

**Required Secrets**:
- `SUPABASE_ACCESS_TOKEN`
- `STAGING_SUPABASE_PROJECT_ID`

### 3. Widget Deployment (`deploy-widget.yml`)

**Purpose**: Build, test, and deploy the feedback widget to CDN with versioning support.

**Triggers**:
- Push to `main` or `Dev` branches (widget changes)
- Pull requests (preview deployments)
- Release publication
- Manual workflow dispatch

**Key Features**:
- Widget size optimization and limits (500KB max)
- Multi-channel deployment (production, staging, beta)
- Version management with immutable URLs
- PR preview comments
- CDN cache invalidation
- Rollback support

**Required Secrets**:
- `STAGING_SUPABASE_PROJECT_ID`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`
- `PRODUCTION_SUPABASE_PROJECT_ID`
- `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDFLARE_ZONE_ID` (optional)
- `CLOUDFLARE_API_TOKEN` (optional)

### 4. Edge Functions CI/CD (`edge-functions.yml`)

**Purpose**: Lint, test, and deploy Supabase Edge Functions with proper validation.

**Triggers**:
- Push to `main` or `Dev` branches (function changes)
- Pull requests
- Manual workflow dispatch (with specific function selection)

**Key Features**:
- Deno linting and formatting
- Type checking for each function
- Environment variable usage detection
- CORS configuration validation
- Bundle size analysis
- Function-specific deployment configuration
- Health endpoint testing after deployment

**Required Secrets**:
- `SUPABASE_ACCESS_TOKEN`
- `STAGING_SUPABASE_PROJECT_ID`
- `STAGING_SUPABASE_ANON_KEY`
- `PRODUCTION_SUPABASE_PROJECT_ID`

### 5. Security Scanning (`security-scan.yml`)

**Purpose**: Comprehensive security scanning for secrets, vulnerabilities, and misconfigurations.

**Triggers**:
- Push to `main` or `Dev` branches
- Pull requests
- Daily schedule (2 AM UTC)
- Manual workflow dispatch

**Key Features**:
- Secret scanning with TruffleHog
- Hardcoded secret detection
- NPM dependency vulnerability scanning
- ESLint security plugin analysis
- RLS policy validation
- Storage bucket security checks
- API route authentication verification
- File permission auditing

**Security Checks**:
- No hardcoded API keys or secrets
- No console.log of sensitive variables
- Critical vulnerability threshold enforcement
- RLS enabled on all tables
- No overly permissive policies
- Proper CORS configuration

### 6. Health Monitoring (`health-monitoring.yml`)

**Purpose**: Monitor application, API, and infrastructure health with alerting.

**Triggers**:
- Every 15 minutes (cron schedule)
- Manual workflow dispatch

**Key Features**:
- Multi-environment health checks (production & staging)
- Component-specific monitoring:
  - Supabase REST API
  - Supabase Auth API
  - Edge Functions
  - Application endpoints
  - Widget CDN availability
  - Database connectivity
  - Storage bucket accessibility
- Alert notifications (Discord/Slack webhooks)
- Automatic issue creation on failures
- Health report generation

**Required Secrets**:
- `PRODUCTION_SUPABASE_URL`
- `PRODUCTION_SUPABASE_ANON_KEY`
- `PRODUCTION_APP_URL`
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_APP_URL`
- `DISCORD_WEBHOOK_URL` (optional)
- `SLACK_WEBHOOK_URL` (optional)

## Environment Configuration

### Staging Environment

Used for:
- Testing migrations before production
- Widget preview deployments
- Edge function testing
- Integration testing

### Production Environment

Used for:
- Live application deployments
- Customer-facing widget CDN
- Production edge functions
- Real user traffic

### Environment Protection Rules

Production environment should have:
- Required reviewers
- Deployment branch restrictions (main only)
- Environment secrets
- Deployment history

## Best Practices

### 1. Secret Management
- Use GitHub Secrets for sensitive values
- Separate secrets per environment
- Rotate secrets regularly
- Never commit secrets to code

### 2. Deployment Safety
- Always test in staging first
- Use deployment environments for protection
- Implement rollback procedures
- Monitor after deployment

### 3. Workflow Optimization
- Use workflow concurrency limits
- Cache dependencies
- Parallelize independent jobs
- Clean up old artifacts

### 4. Monitoring & Alerts
- Set up webhook notifications
- Monitor workflow run times
- Track deployment success rates
- Review security scan results

## Troubleshooting

### Common Issues

1. **Migration Deployment Fails**
   - Check SQL syntax
   - Verify database credentials
   - Ensure migrations are incremental

2. **Type Generation Mismatch**
   - Regenerate types locally
   - Check for schema drift
   - Verify Supabase project connection

3. **Widget Deployment Issues**
   - Check file size limits
   - Verify storage bucket permissions
   - Clear CDN cache

4. **Edge Function Failures**
   - Check Deno compatibility
   - Verify environment variables
   - Test CORS configuration

5. **Security Scan Alerts**
   - Review flagged vulnerabilities
   - Update dependencies
   - Fix RLS policies

6. **Health Check Failures**
   - Check service status
   - Verify API keys
   - Review recent deployments

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review security scan results
   - Check health monitoring alerts
   - Update dependencies

2. **Monthly**
   - Rotate API keys
   - Review workflow performance
   - Clean up old artifacts

3. **Quarterly**
   - Audit access permissions
   - Update workflow versions
   - Review and optimize workflows