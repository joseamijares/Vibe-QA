# VibeQA Database Schema

## Overview
VibeQA uses Supabase PostgreSQL with Row Level Security (RLS) enabled for multi-tenant data isolation.

## Tables

### organizations
Stores organization/company information for multi-tenancy.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Organization display name |
| slug | VARCHAR(255) | URL-friendly identifier (unique) |
| subscription_status | VARCHAR(50) | 'free', 'pro', or 'team' |
| subscription_end_date | TIMESTAMP | When subscription expires |
| stripe_customer_id | VARCHAR(255) | Stripe customer reference |
| stripe_subscription_id | VARCHAR(255) | Stripe subscription reference |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### organization_members
Links users to organizations with roles.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| user_id | UUID | FK to auth.users |
| role | VARCHAR(50) | 'owner', 'admin', or 'member' |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### projects
Projects that collect feedback, scoped to organizations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| name | VARCHAR(255) | Project display name |
| slug | VARCHAR(255) | URL-friendly identifier |
| api_key | VARCHAR(255) | Unique key for widget auth |
| widget_settings | JSONB | Widget configuration |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### feedback
All feedback submissions from users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK to projects |
| type | VARCHAR(50) | 'text', 'voice', 'screenshot', or 'video' |
| content | TEXT | Text content of feedback |
| metadata | JSONB | Additional data (browser info, etc) |
| user_email | VARCHAR(255) | Reporter's email |
| user_name | VARCHAR(255) | Reporter's name |
| page_url | TEXT | URL where feedback was submitted |
| media_url | TEXT | Storage URL for media files |
| status | VARCHAR(50) | 'new', 'in_progress', 'resolved', or 'archived' |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Row Level Security (RLS) Policies

### Organizations
- **SELECT**: Users can only view organizations they belong to
- **UPDATE**: Only organization owners can update organization details

### Organization Members
- **SELECT**: Users can view members of their organizations
- **ALL**: Owners and admins can manage members

### Projects
- **SELECT**: Users can view projects in their organizations
- **ALL**: Owners and admins can manage projects

### Feedback
- **SELECT**: Users can view feedback for projects in their organizations
- **UPDATE**: Users can update feedback status for their projects
- **INSERT**: Public access for widget submissions (authenticated via API key)

## Storage Buckets

### feedback-media
Stores screenshots, voice recordings, and video files.
- Private bucket
- Access controlled via RLS policies

### organization-assets
Stores organization logos and other assets.
- Private bucket
- Members can manage their organization's assets

## Automatic Features

### User Organization Creation
When a new user signs up, a trigger automatically:
1. Creates a new organization with the user's email prefix
2. Adds the user as the organization owner
3. Generates a unique organization slug

### Updated Timestamps
All tables have triggers that automatically update the `updated_at` column on any row modification.