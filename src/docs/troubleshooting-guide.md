# VibeQA Troubleshooting Guide

## Overview

This guide helps you diagnose and resolve common issues with VibeQA, covering both the main application and the feedback widget.

## Table of Contents

1. [Widget Issues](#widget-issues)
2. [Authentication & Authorization](#authentication--authorization)
3. [Database & Supabase](#database--supabase)
4. [Edge Functions & API](#edge-functions--api)
5. [Development Environment](#development-environment)
6. [Production Deployment](#production-deployment)

## Widget Issues

### Widget Not Appearing

**Symptoms**: The feedback button doesn't show up on the page.

**Possible Causes & Solutions**:

1. **Invalid Project Key**

   ```javascript
   // Check browser console for errors
   // Look for: "Invalid project key" or 401 errors

   // Verify project key in dashboard
   SELECT api_key FROM projects WHERE name = 'Your Project';
   ```

2. **Script Loading Issues**

   ```html
   <!-- Ensure script is loaded after DOM -->
   <script src="..." async></script>

   <!-- Or wait for DOM ready -->
   <script>
     document.addEventListener('DOMContentLoaded', function () {
       // Widget will auto-initialize
     });
   </script>
   ```

3. **CORS Blocking**

   ```javascript
   // Check browser console for CORS errors
   // Ensure domain is whitelisted in project settings
   ```

4. **CSS Conflicts**
   ```css
   /* Widget uses high z-index */
   /* Check if other elements have higher z-index */
   /* Widget default: z-index: 999999 */
   ```

### Widget Styling Issues

**Symptoms**: Widget looks broken or unstyled.

**Solutions**:

1. **Shadow DOM Protection**

   ```javascript
   // Widget uses Shadow DOM - styles are isolated
   // Use configuration to customize:
   window.vibeQAConfig = {
     primaryColor: '#your-color',
     theme: 'light', // or 'dark'
   };
   ```

2. **Position Conflicts**
   ```javascript
   // Change widget position if needed
   window.vibeQAConfig = {
     position: 'bottom-left', // default: 'bottom-right'
   };
   ```

### Feedback Not Submitting

**Symptoms**: Form submits but nothing happens or errors occur.

**Debug Steps**:

1. **Check Network Tab**
   - Open browser DevTools → Network tab
   - Submit feedback
   - Look for failed requests to `/submit-feedback`

2. **Common Errors**:

   ```javascript
   // 401 Unauthorized - Invalid API key
   // 403 Forbidden - Domain not allowed
   // 413 Payload Too Large - File too big (>10MB)
   // 500 Server Error - Check Edge Function logs
   ```

3. **Verify Edge Function**

   ```bash
   # Check if function is deployed
   supabase functions list

   # View function logs
   supabase functions logs submit-feedback
   ```

## Authentication & Authorization

### User Can't Log In

**Symptoms**: Login fails or redirects back to login page.

**Solutions**:

1. **Check Supabase Auth Settings**

   ```sql
   -- Verify user exists
   SELECT * FROM auth.users WHERE email = 'user@example.com';
   ```

2. **Session Issues**

   ```javascript
   // Clear local storage
   localStorage.clear();

   // Check for auth errors in console
   // Look for session refresh failures
   ```

3. **Environment Variables**
   ```bash
   # Verify in .env.local
   NEXT_PUBLIC_SUPABASE_URL=correct_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=correct_key
   ```

### Role Assignment Issues

**Symptoms**: New users don't get proper roles or can't access features.

**Current Workaround**:

```sql
-- Manually assign role if needed
UPDATE organization_members
SET role = 'owner'
WHERE user_id = 'user-uuid'
AND organization_id = 'org-uuid';
```

**Permanent Fix** (TODO):

- Implement database trigger for automatic role assignment
- Add role assignment to user creation flow

### Team Page Email Display

**Symptoms**: Team page shows "Email hidden" for all users except current user.

**Cause**: Client-side cannot access `auth.users` table directly.

**Solution** (TODO):

1. Create Edge Function `get-team-members`
2. Fetch user details server-side
3. Return sanitized user data

## Database & Supabase

### RLS Policy Errors

**Symptoms**: "Permission denied" errors when accessing data.

**Debug Steps**:

1. **Check RLS Policies**

   ```sql
   -- View all policies for a table
   SELECT * FROM pg_policies WHERE tablename = 'projects';

   -- Test specific query as user
   SET ROLE authenticated;
   SET request.jwt.claim.sub = 'user-uuid';
   SELECT * FROM projects;
   ```

2. **Common RLS Issues**
   - User not member of organization
   - Policy using wrong column name
   - Missing policy for operation (INSERT/UPDATE/DELETE)

### Migration Errors

**Symptoms**: Database schema out of sync.

**Solutions**:

1. **Reset Local Database**

   ```bash
   # Stop Supabase
   supabase stop

   # Start fresh
   supabase start

   # Run migrations
   supabase db push
   ```

2. **Fix Migration Conflicts**

   ```bash
   # Check migration status
   supabase migration list

   # Create new migration
   supabase migration new fix_issue
   ```

## Edge Functions & API

### Function Not Found (404)

**Solutions**:

1. **Verify Deployment**

   ```bash
   # List deployed functions
   supabase functions list

   # Redeploy if needed
   supabase functions deploy submit-feedback
   ```

2. **Check URL Format**

   ```javascript
   // Correct format
   https://project-ref.supabase.co/functions/v1/function-name

   // NOT
   https://project-ref.supabase.co/functions/function-name
   ```

### Function Timeout

**Symptoms**: Function takes too long and times out.

**Solutions**:

1. **Optimize Function**
   - Reduce payload size
   - Use streaming for large files
   - Implement pagination

2. **Check Logs**
   ```bash
   supabase functions logs submit-feedback --tail
   ```

### CORS Errors

**Symptoms**: "CORS policy" errors in browser console.

**Solutions**:

1. **Update Edge Function**

   ```typescript
   // Ensure CORS headers in function
   return new Response(JSON.stringify(data), {
     headers: {
       'Content-Type': 'application/json',
       'Access-Control-Allow-Origin': '*',
       'Access-Control-Allow-Headers':
         'authorization, x-client-info, apikey, content-type, x-project-key',
     },
   });
   ```

2. **Handle Preflight**
   ```typescript
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
   ```

## Development Environment

### Vite/Next.js Issues

**Symptoms**: Build errors or dev server not starting.

**Solutions**:

1. **Clean Install**

   ```bash
   # Remove node_modules and lockfile
   rm -rf node_modules package-lock.json

   # Reinstall
   npm install
   ```

2. **Clear Cache**

   ```bash
   # Clear Vite cache
   rm -rf node_modules/.vite

   # Clear Next.js cache
   rm -rf .next
   ```

### TypeScript Errors

**Symptoms**: Type errors preventing build.

**Solutions**:

1. **Regenerate Types**

   ```bash
   # For Supabase types
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```

2. **Check tsconfig**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true
     }
   }
   ```

### Environment Variable Issues

**Symptoms**: Features not working, API calls failing.

**Debug Steps**:

1. **Verify .env.local**

   ```bash
   # Check if file exists
   ls -la .env.local

   # Verify variables are set
   grep SUPABASE .env.local
   ```

2. **Check Variable Names**
   - Client variables must start with `NEXT_PUBLIC_`
   - Server variables don't need prefix
   - No quotes needed in .env files

## Production Deployment

### Widget CDN Issues

**Symptoms**: Widget not loading from CDN.

**Solutions**:

1. **Verify Upload**

   ```bash
   # Check if file exists
   curl https://your-project.supabase.co/storage/v1/object/public/widget-assets/production/widget.js
   ```

2. **Cache Issues**
   ```bash
   # Force cache refresh
   # Add query parameter
   ?v=timestamp
   ```

### Build Failures

**Symptoms**: Production build fails.

**Common Fixes**:

1. **Check Build Logs**

   ```bash
   npm run build
   # Look for specific errors
   ```

2. **Memory Issues**

   ```bash
   # Increase Node memory
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

3. **Dependency Issues**
   ```bash
   # Check for peer dependency warnings
   npm ls
   ```

## Common Error Messages

### "Invalid project key"

- Project doesn't exist
- Project is inactive
- API key is wrong

### "Domain not allowed"

- Domain not in whitelist
- Check Origin header
- Add domain to project settings

### "File too large"

- Max file size is 10MB
- Compress images before upload
- Use image optimization

### "User not found"

- Session expired
- User deleted
- Auth token invalid

## Getting Help

### Debug Checklist

1. Check browser console for errors
2. Check network tab for failed requests
3. Verify environment variables
4. Check Supabase dashboard for service status
5. Review Edge Function logs

### Support Channels

- GitHub Issues: [github.com/vibeqa/vibeqa/issues]
- Documentation: [/src/docs]
- Email: support@vibeqa.com

### Providing Debug Information

When reporting issues, include:

1. Error messages (full text)
2. Browser console output
3. Network request/response
4. Steps to reproduce
5. Environment (dev/prod)
6. Browser and OS
