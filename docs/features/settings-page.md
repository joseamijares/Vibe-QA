# Settings Page Documentation

## Overview

The Settings page provides a comprehensive interface for users to manage their organization, profile, team preferences, API keys, and billing settings. It uses a tabbed interface for easy navigation between different settings categories.

## Location

- **Route**: `/dashboard/settings`
- **Component**: `src/pages/dashboard/SettingsPage.tsx`

## Features

### 1. Organization Settings Tab

Allows administrators to manage organization-wide settings:

- **Organization Name**: Update the display name
- **Organization Slug**: Update the URL-friendly identifier (with uniqueness validation)
- **Logo Upload**: Upload organization logo to Supabase Storage
- **Notification Preferences**:
  - Email notifications for new feedback
  - Weekly summary reports
  - Team invitation notifications
- **Default Feedback Settings**:
  - Auto-assign new feedback to project owner
  - Require screenshot with feedback
  - Allow anonymous feedback submissions

### 2. Profile Settings Tab

Personal user profile management:

- **Full Name**: Update display name
- **Email**: View email address (read-only)
- **Avatar**: Upload profile picture
- **Email Notifications**:
  - New feedback in projects
  - Mentions in comments
  - Feedback assignments
- **Password Change**: Update account password

### 3. Team Settings Tab

Team management preferences:

- **Default Role**: Set default role for new team members (viewer, member, admin)
- **Auto-Accept Domain**: Configure email domain for automatic approval
- **Invitation Settings**: Require approval for join requests
- **Team Limits**: Set maximum number of team members

### 4. API Keys Management Tab

Developer settings and API key management:

- **Project API Keys**: View all project API keys
- **Key Visibility**: Show/hide API keys
- **Copy to Clipboard**: Quick copy functionality
- **Regenerate Keys**: Generate new API keys
- **Usage Tracking**: View API usage statistics (placeholder for future implementation)
- **Documentation Links**: Quick access to API and widget documentation

### 5. Billing Tab

Subscription and payment management:

- **Current Plan**: Display active subscription plan
- **Next Billing Date**: Show upcoming payment date
- **Plan Features**: List included features and limits
- **Billing Portal**: Link to full billing management page

## Implementation Details

### Components Structure

```
src/components/settings/
├── organization-settings.tsx
├── profile-settings.tsx
├── team-settings.tsx
├── api-keys-settings.tsx
└── billing-settings.tsx
```

### Database Requirements

#### Profiles Table (Migration Required)

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    avatar_url TEXT,
    notification_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

Run the migration: `supabase/migrations/20240731_create_profiles_table.sql`

### Settings Storage

- **Organization Settings**: Stored in `organizations.settings` JSONB field
- **Profile Settings**: Stored in `profiles` table
- **Team Settings**: Stored in `organizations.settings.teamSettings`

### Security Features

- **Slug Uniqueness**: Validates organization slug is unique before saving
- **API Key Security**: 
  - Keys are masked by default
  - Security warning displayed
  - Regeneration requires confirmation
- **RLS Policies**: Users can only modify their own profile and organization

### Error Handling

- Silent error handling for non-critical operations
- Toast notifications for user feedback
- Loading states for all async operations
- Validation before saving

## Usage

### For Users

1. Navigate to Settings from the dashboard navigation
2. Click on the desired tab
3. Make changes to settings
4. Click "Save Changes" or equivalent button
5. Receive confirmation via toast notification

### For Developers

#### Adding New Settings

1. Create a new component in `src/components/settings/`
2. Add a new tab in `SettingsPage.tsx`
3. Update the database schema if needed
4. Add appropriate validation and error handling

#### Accessing Settings

```typescript
// Organization settings
const { organization } = useOrganization();
const settings = organization?.settings;

// Profile settings
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

## Known Limitations

1. API usage tracking is currently placeholder data
2. Some notification preferences are not yet connected to actual email sending
3. Team member count limits are not enforced in other parts of the application

## Future Enhancements

1. Implement actual API usage tracking
2. Add two-factor authentication settings
3. Add more granular notification preferences
4. Implement audit logs for settings changes
5. Add import/export settings functionality