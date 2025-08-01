# VibeQA Database Schema

**Last Updated**: January 31, 2025

## Overview
VibeQA uses Supabase PostgreSQL with Row Level Security (RLS) enabled for multi-tenant data isolation. The schema supports multi-tenant organizations, project-based feedback collection, user management with roles, and subscription-based billing with trial support.

## Core Tables

### organizations
Stores organization/company information for multi-tenancy.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Organization display name |
| slug | VARCHAR(255) | URL-friendly identifier (unique) |
| logo_url | TEXT | Organization logo URL |
| created_by | UUID | FK to auth.users - organization creator |
| trial_ends_at | TIMESTAMP | When the trial period ends |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### organization_members
Links users to organizations with roles.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| user_id | UUID | FK to auth.users |
| role | user_role | 'superadmin', 'owner', 'admin', 'member', or 'viewer' |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Unique constraint**: (organization_id, user_id)

### projects
Projects that collect feedback, scoped to organizations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| name | VARCHAR(255) | Project display name |
| description | TEXT | Project description |
| api_key | VARCHAR(255) | Unique key for widget auth (proj_xxx format) |
| allowed_domains | TEXT[] | Array of allowed domains for CORS |
| is_active | BOOLEAN | Whether project accepts feedback |
| created_by | UUID | FK to auth.users |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes**: api_key (unique), organization_id

### feedback
All feedback submissions from users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK to projects |
| type | feedback_type | 'bug', 'suggestion', 'praise', or 'other' |
| message | TEXT | Text content of feedback |
| user_email | VARCHAR(255) | Reporter's email (optional) |
| page_url | TEXT | URL where feedback was submitted |
| screenshot_url | TEXT | Storage URL for screenshot |
| voice_url | TEXT | Storage URL for voice recording |
| attachments | TEXT[] | Array of attachment URLs |
| browser_info | JSONB | Browser and device information |
| custom_metadata | JSONB | Custom data from widget |
| status | feedback_status | 'new', 'in_progress', 'resolved', or 'archived' |
| priority | feedback_priority | 'low', 'medium', 'high', or 'urgent' |
| assigned_to | UUID | FK to auth.users (team member) |
| resolved_at | TIMESTAMP | When feedback was resolved |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes**: project_id, status, created_at

## Billing & Subscription Tables

### organization_subscriptions
Manages subscription details for organizations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations (unique) |
| plan_id | VARCHAR(50) | 'basic' or 'full' |
| status | subscription_status | 'trialing', 'active', 'past_due', 'canceled', etc |
| stripe_customer_id | VARCHAR(255) | Stripe customer ID |
| stripe_subscription_id | VARCHAR(255) | Stripe subscription ID |
| current_period_start | TIMESTAMP | Billing period start |
| current_period_end | TIMESTAMP | Billing period end |
| trial_start | TIMESTAMP | Trial period start |
| trial_end | TIMESTAMP | Trial period end |
| cancel_at | TIMESTAMP | Scheduled cancellation date |
| canceled_at | TIMESTAMP | When subscription was canceled |
| metadata | JSONB | Additional subscription data |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### processed_webhook_events
Tracks processed Stripe webhooks for idempotency.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| stripe_event_id | TEXT | Stripe event ID (unique) |
| event_type | TEXT | Type of webhook event |
| processed_at | TIMESTAMP | When event was processed |
| metadata | JSONB | Event metadata |

## Email System Tables

### email_queue
Queue for sending emails asynchronously.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| to_email | VARCHAR(255) | Recipient email |
| template | VARCHAR(100) | Email template name |
| data | JSONB | Template variables |
| status | email_status | 'pending', 'processing', 'sent', 'failed' |
| error | TEXT | Error message if failed |
| attempts | INTEGER | Number of send attempts |
| sent_at | TIMESTAMP | When email was sent |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### email_templates
Email template definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Template identifier (unique) |
| subject | TEXT | Email subject line |
| html_body | TEXT | HTML email content |
| text_body | TEXT | Plain text fallback |
| variables | JSONB | Required template variables |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Configuration Tables

### app_settings
Application-wide configuration settings.

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Setting key (primary key) |
| value | JSONB | Setting value |
| description | TEXT | Setting description |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Views

### organization_trial_status
Computed view for trial status information.

| Column | Type | Description |
|--------|------|-------------|
| organization_id | UUID | Organization ID |
| organization_name | VARCHAR | Organization name |
| trial_ends_at | TIMESTAMP | When trial ends |
| trial_status | TEXT | 'active', 'converted', 'canceled', or 'expired' |
| days_remaining | INTEGER | Days left in trial |
| subscription_status | TEXT | Current subscription status |
| plan_id | VARCHAR | Current plan |

## Enums

### user_role
```sql
CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'admin', 'member', 'viewer');
```

### feedback_type
```sql
CREATE TYPE feedback_type AS ENUM ('bug', 'suggestion', 'praise', 'other');
```

### feedback_status
```sql
CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved', 'archived');
```

### feedback_priority
```sql
CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high', 'urgent');
```

### subscription_status
```sql
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 
  'incomplete', 'incomplete_expired', 'unpaid'
);
```

### email_status
```sql
CREATE TYPE email_status AS ENUM ('pending', 'processing', 'sent', 'failed');
```

## Row Level Security (RLS) Policies

### Organizations
- **SELECT**: Users can view organizations they belong to (or superadmin)
- **UPDATE**: Only organization owners can update (or superadmin)
- **DELETE**: Only organization owners can delete

### Organization Members
- **SELECT**: Users can view members of their organizations
- **INSERT/UPDATE/DELETE**: Only owners can manage members (or superadmin)

### Projects
- **SELECT**: Users can view projects in their organizations
- **INSERT/UPDATE/DELETE**: Owners and admins can manage projects

### Feedback
- **SELECT**: Users can view feedback for their organization's projects
- **UPDATE**: Members can update feedback status
- **INSERT**: Public access for widget submissions (via Edge Function)

### Organization Subscriptions
- **SELECT**: Organization members can view their subscription
- **UPDATE**: Only through system/webhook updates

## Storage Buckets

### feedback-media
Stores screenshots, voice recordings, and attachments.
- Private bucket
- Path structure: `{project_id}/{feedback_id}/{filename}`
- Access controlled via signed URLs
- Max file size: 10MB per file

### organization-assets
Stores organization logos and branding assets.
- Private bucket
- Path structure: `{organization_id}/logo.{ext}`
- Members can manage their organization's assets

### widget-assets
Stores widget JavaScript files for CDN distribution.
- Public bucket
- Path structure: `{channel}/widget.js` (production, staging, beta)
- Versioned deployments

## Database Functions

### handle_new_user()
Trigger function that runs after user signup:
1. Creates a new organization with 7-day trial
2. Adds the user as organization owner
3. Creates initial subscription record in 'trialing' status
4. Generates unique organization slug

### is_organization_in_trial(org_id UUID)
Returns boolean indicating if organization is in active trial.

### get_trial_days_remaining(org_id UUID)
Returns integer with days left in trial (0 if expired).

### can_extend_trial(org_id UUID, extension_days INTEGER)
Checks if trial can be extended (not already extended, still active).

### sync_trial_dates()
Trigger function to keep trial dates synchronized between tables.

## Triggers

### Updated Timestamps
All tables have triggers that automatically update the `updated_at` column on any row modification.

### New User Registration
`auth.users` AFTER INSERT trigger calls `handle_new_user()` function.

### Trial Date Sync
`organization_subscriptions` AFTER INSERT/UPDATE trigger calls `sync_trial_dates()`.

## Indexes

### Performance Indexes
- `organizations.slug` - Unique index for slug lookups
- `projects.api_key` - Unique index for widget authentication
- `feedback.project_id` - For filtering by project
- `feedback.created_at` - For time-based queries
- `email_queue.status` - For processing pending emails
- `processed_webhook_events.stripe_event_id` - For idempotency checks

## Migration History

Key migrations:
- Initial schema setup
- Add user roles enum with superadmin
- Add trial fields to organizations and subscriptions
- Add processed webhook events for idempotency
- Add app_settings for configurable values
- Trial consistency fixes and improved calculations