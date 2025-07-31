# Superadmin Panel Implementation Guide

## Overview

The superadmin panel provides platform-wide administration capabilities for the support@vibeqa.app user. This guide documents the implementation details, security measures, and usage instructions.

## Features

The superadmin panel includes:

1. **User Management** - Add/remove users, view organization memberships
2. **Subscription Management** - Review subscriptions, cancel subscriptions, track MRR
3. **Coupon Management** - Create discount coupons, track usage
4. **System Metrics** - Monitor server performance, API usage, platform health
5. **Revenue Analytics** - Track revenue growth, customer metrics, financial reports
6. **Audit Logging** - All superadmin actions are logged for security

## Access Control

### Role-Based Access
- Only users with the `superadmin` role can access the panel
- The superadmin email is: `support@vibeqa.app`
- All routes are protected with role checks at multiple levels:
  - Frontend route protection
  - API/Edge Function verification
  - Database RLS policies

### Security Implementation
```typescript
// Frontend protection
<ProtectedRoute requiredRole={['superadmin']}>
  <SuperadminDashboard />
</ProtectedRoute>

// Backend verification
const { data: membership } = await supabase
  .from('organization_members')
  .select('role')
  .eq('user_id', user.id)
  .eq('role', 'superadmin')
  .single();
```

## Database Schema

### New Tables Created

1. **coupons** - Discount coupon management
   - Supports percentage and fixed amount discounts
   - Usage limits and expiration dates
   - Automatic status updates

2. **coupon_usage** - Tracks coupon redemptions
   - Links coupons to organizations
   - Prevents duplicate usage

3. **system_metrics** - Performance and usage metrics
   - CPU, memory, storage usage
   - Active users, API calls
   - Feedback submission counts

4. **revenue_reports** - Monthly financial reports
   - MRR, ARR calculations
   - Customer growth metrics
   - ARPU tracking

5. **superadmin_audit_log** - Security audit trail
   - Records all superadmin actions
   - Includes user, action, and metadata

## Edge Functions

### superadmin-users
Manages user operations with Supabase Admin API:
- Create new users
- Delete users
- List all users with organization data

### record-metrics
Records system performance metrics:
- Calculates usage statistics
- Monitors resource utilization
- Runs periodically or on-demand

## Frontend Pages

### /dashboard/superadmin
Main dashboard with navigation cards and quick stats

### /dashboard/superadmin/users
- Search and filter users
- Add new users with email/password
- Delete users (with confirmation)
- View organization memberships

### /dashboard/superadmin/subscriptions
- View all subscriptions with MRR
- Filter by status and plan
- Cancel subscriptions
- Export subscription data

### /dashboard/superadmin/coupons
- Create discount coupons
- Auto-generate coupon codes
- Track usage and expiration
- Delete unused coupons

### /dashboard/superadmin/metrics
- Real-time system health monitoring
- Resource usage charts (CPU, memory, storage)
- Platform activity metrics
- Historical data visualization

### /dashboard/superadmin/revenue
- MRR/ARR growth charts
- Revenue by plan breakdown
- Customer acquisition/churn metrics
- Export revenue reports

## Implementation Details

### Component Structure
```
src/pages/dashboard/superadmin/
├── SuperadminDashboard.tsx    # Main navigation
├── SuperadminUsers.tsx        # User management
├── SuperadminSubscriptions.tsx # Subscription management
├── SuperadminCoupons.tsx      # Coupon management
├── SuperadminMetrics.tsx      # System metrics
└── SuperadminRevenue.tsx      # Revenue analytics
```

### Route Configuration
```typescript
// All routes require superadmin role
<Route path="/dashboard/superadmin" component={ProtectedSuperadminDashboard} />
<Route path="/dashboard/superadmin/users" component={ProtectedSuperadminUsers} />
// ... etc
```

### Audit Logging
All destructive actions are logged:
```sql
-- Example trigger for user deletion
CREATE TRIGGER audit_superadmin_user_delete
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION log_superadmin_action();
```

## Usage Instructions

### Setting Up the Superadmin User

1. Run the setup script:
```bash
./scripts/create-superadmin-auto.sh
```

Or manually:
```sql
-- Set user as superadmin
UPDATE organization_members 
SET role = 'superadmin'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'support@vibeqa.app'
);
```

### Creating Coupons

1. Navigate to Superadmin > Coupons
2. Click "Create Coupon"
3. Set discount type (percentage or fixed amount)
4. Generate or enter coupon code
5. Set usage limits and expiration

### Monitoring System Health

1. Navigate to Superadmin > System Metrics
2. View real-time resource usage
3. Check historical trends
4. Set up alerts for critical thresholds

### Revenue Tracking

1. Navigate to Superadmin > Revenue Analytics
2. Select time range (3m, 6m, 12m)
3. Export data as CSV for reporting
4. Monitor key metrics:
   - Monthly Recurring Revenue (MRR)
   - Customer acquisition cost
   - Churn rate
   - Average Revenue Per User (ARPU)

## Security Best Practices

1. **Limited Access**: Only grant superadmin role to trusted support staff
2. **Audit Everything**: All actions are logged with timestamps and user info
3. **Regular Reviews**: Periodically review audit logs for suspicious activity
4. **Secure Storage**: Sensitive data is encrypted at rest
5. **API Protection**: All Edge Functions verify superadmin role

## Troubleshooting

### Common Issues

1. **"Access denied" error**
   - Verify user has superadmin role
   - Check organization_members table
   - Ensure proper authentication

2. **Metrics not updating**
   - Check Edge Function logs
   - Verify cron job is running
   - Check database permissions

3. **Charts not displaying**
   - Ensure recharts is installed
   - Check for data in tables
   - Verify date ranges

### Debug Commands

```bash
# Check superadmin role
SELECT * FROM organization_members WHERE role = 'superadmin';

# View recent audit logs
SELECT * FROM superadmin_audit_log ORDER BY created_at DESC LIMIT 10;

# Check metrics recording
SELECT * FROM system_metrics ORDER BY recorded_at DESC LIMIT 20;
```

## Future Enhancements

1. **Email Notifications**: Alert on critical metrics
2. **Custom Reports**: Build custom analytics dashboards
3. **Bulk Operations**: Import/export users in bulk
4. **API Rate Limiting**: Implement rate limits with monitoring
5. **Advanced Analytics**: Cohort analysis, retention metrics