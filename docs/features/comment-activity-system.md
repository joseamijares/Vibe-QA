# Comment & Activity System

## Overview

The comment and activity system provides comprehensive tracking and collaboration features for feedback items. It uses a hybrid approach combining database triggers for automatic activity logging and client-side code for comment management.

## Architecture

### Database Layer

1. **Activity Logs Table** (`activity_logs`)
   - Automatically tracks changes via PostgreSQL triggers
   - Stores action type, user ID, and detailed change information
   - Supports real-time subscriptions

2. **Comments Table** (`comments`)
   - Stores user comments with support for editing and deletion
   - Linked to user profiles for rich display

3. **Profiles Table** (`profiles`)
   - Stores user information (name, email, avatar)
   - Automatically created on user signup
   - Restricted access via RLS policies

### Automatic Activity Tracking

The following actions are automatically logged via database triggers:

- **Status Changes**: Tracks old and new status values
- **Assignment Changes**: Records when feedback is assigned/unassigned
- **Priority Changes**: Logs priority modifications
- **Comment Additions**: Records when comments are added
- **Resolution**: Tracks when feedback is resolved with time calculation

### Security

#### Row Level Security (RLS) Policies

1. **Activity Logs**: Users can only view logs for feedback they have access to
2. **Comments**: Users can create, read comments but only edit/delete their own
3. **Profiles**: Restricted visibility to relevant users only (team members and feedback participants)

#### Recent Security Improvements

- Fixed overly permissive profile access policy
- Added proper comment ownership validation
- Implemented secure delete confirmation flow

## Features

### Comments System

- **Create**: Add text comments to feedback items
- **Edit**: Users can edit their own comments inline
- **Delete**: Users can delete their own comments with confirmation
- **User Profiles**: Display user avatars and names
- **Real-time Updates**: Comments update live via Supabase subscriptions

### Activity Timeline

- **Comprehensive Tracking**: All major actions are logged
- **Visual Timeline**: Clean UI showing chronological activity
- **Action Icons**: Different icons and colors for each action type
- **Relative Timestamps**: Shows "2 hours ago" style timestamps
- **Performance**: Limited to 50 most recent activities

### UI Components

1. **FeedbackDetailDialog**: Enhanced with tabs for Comments and Activity
2. **ActivityTimeline**: Dedicated component for activity display
3. **Comment Thread**: Rich comment display with user avatars
4. **Delete Confirmation**: Custom modal instead of browser confirm()

## Implementation Details

### Hooks

#### useActivityLogs
```typescript
const { activities, loading, error, hasMore } = useActivityLogs(feedbackId);
```
- Fetches activity logs with pagination (50 items)
- Subscribes to real-time updates
- Handles connection errors gracefully

### Constants

All activity actions and feedback states are defined in `src/constants/activity.ts`:

```typescript
export const ACTIVITY_ACTIONS = {
  STATUS_CHANGED: 'status_changed',
  ASSIGNMENT_CHANGED: 'assignment_changed',
  PRIORITY_CHANGED: 'priority_changed',
  COMMENT_ADDED: 'comment_added',
  RESOLVED: 'resolved',
} as const;
```

### Performance Optimizations

1. **Single Query for Comments**: Uses Supabase foreign key joins
2. **Activity Pagination**: Limits to 50 most recent activities
3. **Indexed Queries**: Database indexes on frequently queried columns
4. **Conditional Real-time Updates**: Only fetches when showing recent data

## Usage

### Viewing Comments and Activity

1. Open any feedback item in the dashboard
2. Switch between "Comments" and "Activity" tabs
3. Comments show user avatars and allow inline editing
4. Activity shows a chronological timeline of all changes

### Adding Comments

1. Type in the comment box at the bottom of the comments tab
2. Click the send button or press Enter
3. Comment appears immediately with your profile info

### Editing/Deleting Comments

1. Hover over your own comment to see the menu
2. Click the three dots menu
3. Select Edit to modify inline or Delete to remove
4. Confirm deletion in the modal

## Future Enhancements

### Planned Features

1. **@Mentions**: Tag team members in comments
2. **Rich Text**: Support for markdown in comments
3. **Notifications**: Email/push notifications for mentions and assignments
4. **Auto-assignment Rules**: Automatically assign based on criteria
5. **Activity Filtering**: Filter timeline by action type
6. **Bulk Actions**: Apply comments to multiple feedback items

### Performance Improvements

1. **Virtual Scrolling**: For very long activity timelines
2. **Lazy Loading**: Load older activities on demand
3. **Optimistic Updates**: Show changes immediately before server confirms
4. **Offline Support**: Queue comments when offline

## Migration Notes

When deploying, ensure these migrations are run in order:

1. `20250201_activity_logging_triggers.sql` - Creates triggers and activity_logs table
2. `20250201_add_profiles_table.sql` - Creates profiles table with RLS
3. `20250201_fix_profile_rls_and_activity_limits.sql` - Security fixes

## Best Practices

1. **Always Check Permissions**: Verify user can perform action before showing UI
2. **Handle Errors Gracefully**: Show user-friendly messages for failures
3. **Optimize Queries**: Use joins instead of multiple queries
4. **Test Edge Cases**: Deleted users, long content, network failures
5. **Monitor Performance**: Watch for slow queries with many activities