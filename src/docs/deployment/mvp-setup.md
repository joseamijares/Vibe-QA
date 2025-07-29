# VibeQA MVP Setup Guide

This guide will help you set up the VibeQA MVP for local development or initial deployment.

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git
- Code editor (VS Code recommended)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd vibe-qa
npm install
```

### 2. Supabase Setup

#### Create a New Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Save your project URL and anon key

#### Database Schema Setup

Run these SQL commands in the Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  api_key TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  allowed_domains TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type feedback_type NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  status feedback_status DEFAULT 'new',
  priority feedback_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback media
CREATE TABLE feedback_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enums
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE feedback_type AS ENUM ('bug', 'suggestion', 'praise', 'other');
CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved', 'archived');
CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create indexes
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_feedback_project ON feedback(project_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_comments_feedback ON comments(feedback_id);
```

#### Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see orgs they belong to
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

-- Organization members: Users can see members of their orgs
CREATE POLICY "Users can view members of their organizations" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Projects: Users can see projects in their orgs
CREATE POLICY "Users can view projects in their organizations" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = projects.organization_id
      AND user_id = auth.uid()
    )
  );

-- Add similar policies for INSERT, UPDATE, DELETE based on roles
```

#### Storage Setup

1. Go to Storage in Supabase dashboard
2. Create two buckets:
   - `feedback-media` (public)
   - `organization-assets` (public)

### 3. Environment Variables

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Session
SESSION_SECRET=generate-random-32-char-string

# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres

# Development
VITE_PORT=5173
```

### 4. Run the Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Initial User Setup

### Option 1: Register Through UI

1. Go to `/register`
2. Create an account
3. Organization will be created automatically

### Option 2: Manual Database Setup

If you need to fix user roles:

```sql
-- Make yourself an owner
UPDATE organization_members
SET role = 'owner'
WHERE user_id = 'your-user-id';
```

## Known Issues & Fixes

### 1. Permission Errors

**Issue**: "You do not have permission to create projects"

**Fix**: Update your user role in the database:

```sql
UPDATE organization_members
SET role = 'owner'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

### 2. Auth.users Access Error

**Issue**: Cannot access auth.users table from client

**Status**: Known limitation. Team page shows placeholders for other users.

### 3. Widget CORS Issues

**Fix**: Add your domain to allowed_domains in projects table:

```sql
UPDATE projects
SET allowed_domains = ARRAY['localhost:3000', 'your-domain.com']
WHERE id = 'project-id';
```

## Testing the Widget

1. Create a project in the dashboard
2. Copy the API key
3. Create a test HTML file:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Widget Test</title>
  </head>
  <body>
    <h1>Test Page</h1>

    <script>
      window.vibeQAConfig = {
        projectKey: 'proj_your_api_key_here',
        apiUrl: 'http://localhost:5173',
      };
    </script>
    <script src="http://localhost:5173/widget.js"></script>
  </body>
</html>
```

4. Open the HTML file and test the widget

## Production Deployment (Basic)

### 1. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### 2. Environment Variables

Set all variables from `.env.local` in your hosting platform

### 3. Update Supabase URLs

- Add your production domain to Supabase Auth settings
- Update CORS settings for your domain

### 4. Widget Distribution

Currently, the widget is served from the same domain. For production:

1. Build widget separately
2. Upload to CDN
3. Update embed code to use CDN URL

## Monitoring & Logs

### Supabase Dashboard

- Monitor database queries
- Check auth logs
- View storage usage

### Application Logs

- Browser console for client errors
- Vercel logs for server errors

## Backup & Recovery

### Database Backup

```bash
# Using Supabase CLI
supabase db dump > backup.sql
```

### Restore

```bash
# Restore from backup
psql DATABASE_URL < backup.sql
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Rotate API keys regularly
- [ ] Enable 2FA on Supabase
- [ ] Review RLS policies
- [ ] Set up proper CORS policies
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production
- [ ] Set secure session configuration

## Getting Help

1. Check `/docs` folder for more documentation
2. Review error logs in browser console
3. Check Supabase logs for database errors
4. Create issues in the repository

## Next Steps

Once MVP is running:

1. Test all features thoroughly
2. Set up error monitoring (Sentry)
3. Configure analytics
4. Plan for scaling
5. Implement missing features from roadmap
