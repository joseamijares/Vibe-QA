# Supabase Security Fixes Documentation

## Overview

This document outlines the security issues identified by Supabase's linter and the fixes applied on 2025-08-01.

## Critical Issues Fixed

### 1. Row Level Security (RLS) Not Enabled

**Issue**: Two tables had RLS policies defined but RLS was not enabled:
- `organization_members` - Despite having 7 RLS policies, RLS was disabled
- `app_settings` - Created without enabling RLS

**Fix**: Created migration `20250801_security_fixes.sql` that:
- Enables RLS on both tables
- Adds appropriate RLS policies for `app_settings`:
  - Superadmins can manage all settings
  - System (postgres role) can read settings
  - Authenticated users can read public settings only

### 2. SECURITY DEFINER View Issue

**Issue**: The `organization_trial_status` view was created with `SECURITY DEFINER`, which runs with creator's permissions instead of caller's permissions.

**Fix**: 
- Dropped and recreated the view without `SECURITY DEFINER`
- The view now inherits the caller's permissions naturally
- Granted SELECT permission to authenticated users

### 3. Function Search Path Vulnerability

**Issue**: 23 functions using `SECURITY DEFINER` didn't have `SET search_path = ''`, making them vulnerable to search path injection attacks.

**Fix**: Created migration `20250801_function_security_paths.sql` that adds `SET search_path = ''` to all affected functions:
- `handle_new_user`
- `get_trial_days_remaining`
- `is_organization_in_trial`
- `sync_trial_dates`
- `is_superadmin`
- `generate_project_api_key`
- `increment_feedback_count`
- `track_feedback_usage`
- And 15 more functions...

## Remaining Security Considerations

### Auth Configuration (Lower Priority)

These can be configured in the Supabase dashboard when moving to production:

1. **Leaked Password Protection**
   - Currently disabled
   - Enable in Auth settings to check passwords against HaveIBeenPwned
   - Prevents users from using compromised passwords

2. **Multi-Factor Authentication (MFA)**
   - Currently has insufficient MFA options
   - Consider enabling:
     - TOTP (Time-based One-Time Passwords)
     - SMS verification
     - WebAuthn/FIDO2

## Implementation Notes

### RLS Policy Design

The `app_settings` table RLS policies follow the principle of least privilege:
- Only superadmins can modify settings
- System functions can read all settings (needed for triggers)
- Regular users can only read non-sensitive settings

### SECURITY DEFINER Best Practices

All functions with `SECURITY DEFINER` now include:
```sql
SECURITY DEFINER
SET search_path = ''
```

This prevents malicious users from:
- Creating objects with the same name in their schema
- Hijacking function execution through search path manipulation

## Testing Recommendations

1. **Verify RLS is enabled** on all tables:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

2. **Test app_settings access**:
   - Regular users should only see public settings
   - Superadmins should see all settings
   - Non-authenticated requests should be denied

3. **Test organization_trial_status view**:
   - Should respect user's organization membership
   - Should not expose data from other organizations

## Future Security Enhancements

1. **Regular Security Audits**: Run Supabase linter regularly
2. **API Rate Limiting**: Configure in Supabase dashboard
3. **IP Allowlisting**: For production, consider restricting database access
4. **Audit Logging**: Expand superadmin audit logs to cover more actions
5. **Encryption**: Consider encrypting sensitive settings in `app_settings`

## Migration Rollback

If issues arise, the changes can be reverted:
1. Re-enable SECURITY DEFINER on the view if needed
2. Disable RLS on tables (not recommended)
3. Remove search_path settings (not recommended)

Always test in a staging environment first!