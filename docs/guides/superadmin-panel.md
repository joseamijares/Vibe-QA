# Superadmin Panel Guide

## Overview

The superadmin panel provides platform-wide administrative capabilities for the VibeQA support team. Only the user `support@vibeqa.app` with the `superadmin` role can access these features.

## Access Requirements

- **Email**: support@vibeqa.app
- **Role**: superadmin
- **Access URL**: `/dashboard/superadmin`

## Features Implemented

### 1. User Management (`/dashboard/superadmin/users`)

- **View All Users**: List all platform users with their organization memberships
- **Search & Filter**: Search by email/organization, filter by role
- **Create Users**: Add new users with auto-confirmed email
- **Delete Users**: Remove users from the platform (with audit logging)
- **View Organization Memberships**: See which organizations users belong to

### 2. Subscription Management (`/dashboard/superadmin/subscriptions`)

- **View All Subscriptions**: Monitor all active, trial, and canceled subscriptions
- **MRR Tracking**: Real-time Monthly Recurring Revenue display
- **Filter Options**: By status (active, trial, canceled) and plan type
- **Cancel Subscriptions**: Manually cancel subscriptions when needed
- **Subscription Details**: View billing periods, Stripe IDs, and creation dates

### 3. Coupon Management (`/dashboard/superadmin/coupons`)

- **Create Coupons**: Generate discount codes with:
  - Percentage or fixed amount discounts
  - Usage limits and expiration dates
  - Auto-generated coupon codes
- **Track Usage**: Monitor how many times each coupon has been used
- **Manage Status**: Active, expired, or depleted coupons
- **Delete Coupons**: Remove coupons that are no longer needed

## Database Schema

### New Tables Created

1. **coupons**: Stores discount codes and their properties
2. **coupon_usage**: Tracks when and by whom coupons are used
3. **system_metrics**: Stores app performance and usage metrics
4. **revenue_reports**: Caches revenue calculations
5. **superadmin_audit_log**: Logs all superadmin actions for security

### New Functions

- `get_all_users_with_organizations()`: Fetches users with their org memberships
- `validate_coupon(code)`: Checks if a coupon is valid
- `apply_coupon()`: Records coupon usage
- `calculate_revenue_metrics()`: Computes MRR and other revenue data

## Security Features

### Authentication & Authorization

- All superadmin endpoints check for `is_superadmin()` before allowing access
- Edge Functions validate the user's authentication token
- Frontend routes redirect non-superadmins to the dashboard

### Audit Logging

All superadmin actions are logged in `superadmin_audit_log` including:
- User creation/deletion
- Subscription modifications
- Coupon management
- Resource access

### RLS Policies

Special Row Level Security policies allow superadmin to:
- View all organizations
- Access all user data
- Manage all subscriptions
- Bypass normal permission checks

## Implementation Details

### Frontend Routes

```
/dashboard/superadmin/          # Main superadmin dashboard
/dashboard/superadmin/users     # User management
/dashboard/superadmin/subscriptions  # Subscription overview
/dashboard/superadmin/coupons   # Coupon management
/dashboard/superadmin/metrics   # System metrics (pending)
/dashboard/superadmin/revenue   # Revenue analytics (pending)
```

### Edge Functions

- **superadmin-users**: Handles user CRUD operations using Supabase Admin API
- Additional functions needed for metrics and revenue (pending)

### UI Components

- Consistent card-based layout
- Real-time statistics display
- Advanced filtering and search
- Confirmation dialogs for destructive actions
- Toast notifications for all operations

## Pending Features

The following features are designed but not yet implemented:

### System Metrics Dashboard
- Database size and table statistics
- API call volume and patterns
- Storage usage by organization
- Active user counts and trends

### Revenue Analytics
- Monthly/Annual Recurring Revenue (MRR/ARR)
- Churn rate calculations
- Growth trends and projections
- Revenue by plan breakdown

## Deployment Steps

1. **Apply Database Migration**:
   ```bash
   npx supabase db push
   ```

2. **Deploy Edge Functions**:
   ```bash
   npx supabase functions deploy superadmin-users
   ```

3. **Verify Superadmin Access**:
   - Log in as support@vibeqa.app
   - Navigate to /dashboard/superadmin
   - Verify the Shield icon appears in navigation

## Usage Guidelines

### Creating Coupons

1. Navigate to Coupons section
2. Click "Create Coupon"
3. Choose discount type (percentage or fixed)
4. Set usage limits and expiration
5. Generate or enter custom code

### Managing Users

1. Use search to find specific users
2. Filter by role to see admins/owners
3. Delete users only when necessary
4. All deletions are logged

### Monitoring Subscriptions

1. Check MRR at the top of the page
2. Filter by status to find issues
3. Cancel subscriptions carefully
4. Monitor trial conversions

## Best Practices

1. **Always verify actions** before executing (especially deletions)
2. **Monitor audit logs** regularly for unusual activity
3. **Use descriptive coupon codes** for easy tracking
4. **Document major actions** in team communications
5. **Backup data** before bulk operations

## Troubleshooting

### Access Denied
- Verify you're logged in as support@vibeqa.app
- Check that the superadmin role is properly assigned
- Ensure the migration has been applied

### Edge Function Errors
- Check Supabase service role key is set
- Verify CORS settings in Edge Functions
- Check function logs in Supabase dashboard

### Missing Data
- Ensure RLS policies are properly configured
- Check that all migrations have been applied
- Verify database connections

## Future Enhancements

1. **Bulk Operations**: Select multiple users/subscriptions for batch actions
2. **Export Functionality**: Download user lists, revenue reports as CSV
3. **Advanced Analytics**: Cohort analysis, LTV calculations
4. **Automated Alerts**: Notify on suspicious activity or metric thresholds
5. **Role Management**: Ability to change user roles across organizations