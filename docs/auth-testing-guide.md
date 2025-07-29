# Authentication System Testing Guide

This guide helps verify that all authentication improvements are working correctly.

## Prerequisites

1. Run the cleanup script in Supabase SQL Editor:
   ```sql
   -- Run scripts/cleanup-duplicate-rls-policy.sql
   ```

2. Ensure the development server is running:
   ```bash
   npm run dev
   ```

## Test 1: Basic Authentication Flow

### Login Test
1. Navigate to http://localhost:5173/login
2. Login with superadmin credentials: `support@vibeqa.app`
3. **Expected**: 
   - Smooth redirect to dashboard
   - No console errors
   - Dashboard loads completely

### Session Persistence Test
1. After logging in, refresh the page (F5)
2. **Expected**:
   - Dashboard remains loaded
   - No white screen
   - Session is maintained

### Logout Test
1. Click on user menu in sidebar
2. Click "Sign out"
3. **Expected**:
   - Redirect to login page
   - Session cleared

## Test 2: Role-Based Access Control

### Admin Access Test (with superadmin user)
1. Navigate to Team page (/dashboard/team)
2. **Expected**: Page loads normally
3. Navigate to Settings page (/dashboard/settings)
4. **Expected**: Page loads normally

### Member Access Test (if you have a regular member account)
1. Login with a member account
2. Try to access /dashboard/team
3. **Expected**: "Access Denied" message
4. Try to access /dashboard/settings
5. **Expected**: "Access Denied" message

## Test 3: Error Handling

### Invalid Credentials Test
1. Go to login page
2. Enter wrong password
3. **Expected**: 
   - Error message: "Invalid email or password. Please try again."
   - No generic error messages

### Network Error Test
1. Open browser dev tools
2. Go to Network tab
3. Set throttling to "Offline"
4. Try to login
5. **Expected**:
   - Error title: "Connection Error"
   - Helpful message about checking internet connection

## Test 4: Performance

### Lazy Loading Test
1. Open Network tab in dev tools
2. Clear browser cache
3. Navigate to login page
4. **Expected**: 
   - Smaller initial bundle size
   - Dashboard components load on demand

### Session Refresh Test
1. Login successfully
2. Open browser console
3. Wait for ~59 minutes (or modify the refresh timer to test sooner)
4. **Expected**:
   - Session automatically refreshes
   - No logout occurs

## Test 5: Navigation

### All Pages Test
Navigate through each menu item and verify they load:
- [ ] Dashboard
- [ ] Projects
- [ ] Feedback
- [ ] Team (admin only)
- [ ] Settings (admin only)

### New Project Test
1. Click "New Project" button
2. **Expected**: 
   - For admins: Form loads
   - For members: "Access Denied"

## Test 6: Console Check

Throughout all tests, monitor the browser console for:
- [ ] No 500 errors
- [ ] No RLS policy errors
- [ ] No React warnings
- [ ] No unhandled promise rejections

## Troubleshooting

If you encounter issues:

1. **White screen on dashboard**:
   - Check browser console for errors
   - Verify RLS policies are applied
   - Check organization_members table has proper data

2. **Login loops**:
   - Clear browser cache and cookies
   - Check Supabase Auth settings

3. **500 errors**:
   - Review RLS policies
   - Check for recursive queries
   - Verify user has organization membership

## Success Criteria

The authentication system is working correctly when:
- ✅ Login/logout works smoothly
- ✅ Sessions persist across refreshes
- ✅ Role-based access control is enforced
- ✅ Error messages are user-friendly
- ✅ No console errors during normal operation
- ✅ Performance is improved with lazy loading