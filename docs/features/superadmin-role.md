# Superadmin Role Implementation

## Overview

The superadmin role is a system-level administrative role with complete access to all features and data across the entire VibeQA platform. This role is designed for platform administrators and support staff who need unrestricted access for maintenance, troubleshooting, and user assistance.

## Implementation Details

### Database Schema

The superadmin role is implemented as a special user role in the `organization_members` table:

```sql
-- User roles enum
CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'admin', 'member', 'viewer');
```

### Permission System

The superadmin role bypasses all permission checks and has access to:

#### All Permissions
```typescript
// From usePermissions hook
if (role === 'superadmin') {
  return {
    canManageTeam: true,
    canManageProjects: true,
    canManageFeedback: true,
    canViewFeedback: true,
    canManageOrganization: true,
    canDeleteOrganization: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canUpdateMemberRoles: true,
    canCreateComments: true,
    canDeleteFeedback: true,
    canExportData: true,
    canManageIntegrations: true,
    canViewAnalytics: true,
    canManageBilling: true,
  };
}
```

### Access Control

Superadmins have:
- Access to all organizations without being a member
- Ability to view and modify all data
- Bypass trial and subscription restrictions
- Access to special superadmin dashboard routes

### Superadmin Dashboard

Located at `/dashboard/superadmin`, the superadmin dashboard provides:
- System overview and statistics
- User management interface
- Organization management
- Subscription and billing overview
- System health monitoring (planned)
- Audit logs (planned)

## Creating a Superadmin

### Manual Database Method

1. First, ensure the user exists in the auth.users table
2. Add them to an organization with superadmin role:

```sql
-- Add user as superadmin to an organization
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES ('[organization-id]', '[user-id]', 'superadmin');
```

### Using the Setup Script

A convenience script is available at `/scripts/create-superadmin.sql`:

```sql
-- Create or update a user to be a superadmin
-- Replace with actual user email and organization
DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@example.com';
  
  -- Get or create an admin organization
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  
  -- Add as superadmin
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'superadmin')
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET role = 'superadmin';
END $$;
```

## Security Considerations

### Access Control
- Superadmin role should only be granted to trusted platform administrators
- Regular auditing of superadmin accounts should be performed
- Consider implementing two-factor authentication for superadmin accounts

### Data Protection
- All superadmin actions should be logged (audit log implementation pending)
- Implement session timeout for superadmin sessions
- Use separate authentication flow for superadmin access (planned)

### Best Practices
1. Limit the number of superadmin accounts
2. Use dedicated admin accounts rather than personal accounts
3. Regularly review and revoke unused superadmin access
4. Implement IP allowlisting for superadmin access (planned)

## UI/UX Considerations

### Visual Indicators
- Superadmin users see a special badge or indicator in the UI
- Different color scheme or theme for superadmin mode (planned)
- Clear indication when viewing other organizations' data

### Navigation
- Additional menu items for superadmin features
- Quick organization switcher
- Access to all routes without restrictions

## Future Enhancements

### Planned Features
1. **Audit Logging**
   - Track all superadmin actions
   - Searchable audit trail
   - Export capabilities

2. **Advanced User Management**
   - Bulk user operations
   - User impersonation (with audit trail)
   - Account suspension/reactivation

3. **System Administration**
   - Database maintenance tools
   - Cache management
   - Performance monitoring

4. **Support Tools**
   - Direct database query interface (read-only)
   - Debug mode for troubleshooting
   - Log viewer

### Security Enhancements
1. **Two-Factor Authentication**
   - Mandatory 2FA for superadmin accounts
   - Hardware key support

2. **Access Controls**
   - IP allowlisting
   - Time-based access restrictions
   - Approval workflow for sensitive actions

3. **Monitoring**
   - Real-time alerts for superadmin actions
   - Anomaly detection
   - Regular access reviews

## Testing

### Manual Testing Checklist
- [ ] Verify superadmin can access all organizations
- [ ] Test all permission-gated features
- [ ] Confirm trial/subscription bypasses work
- [ ] Check superadmin dashboard access
- [ ] Verify regular users cannot access superadmin features

### Automated Tests (To Be Implemented)
- Unit tests for permission checks
- Integration tests for superadmin routes
- E2E tests for superadmin workflows

## Troubleshooting

### Common Issues

**Q: Superadmin cannot access certain features**
A: Check that the role is correctly set in organization_members table

**Q: Regular user gained superadmin access**
A: Immediately revoke access and audit recent database changes

**Q: Superadmin dashboard not loading**
A: Verify the user has superadmin role and routes are properly configured

## Related Documentation

- [User Roles and Permissions](/docs/features/user-roles.md)
- [Creating Test Users Guide](/docs/guides/create-test-users.md)
- [Database Schema](/docs/database/schema.md)