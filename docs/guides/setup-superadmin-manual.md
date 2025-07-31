# Manual Superadmin Setup Instructions

Since the database migration has been applied, you now need to:

1. **Create the user** (support@vibeqa.app) in Supabase Auth
2. **Run the setup SQL** to configure superadmin permissions

## Step 1: Create User in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication → Users**
3. Click **"Create new user"**
4. Fill in:
   - Email: `support@vibeqa.app`
   - Password: Choose a strong password (save it securely!)
   - Check: **"Auto Confirm Email"**
5. Click **"Create user"**

## Step 2: Run Setup SQL

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `scripts/setup-support-user.sql`
4. Click **"Run"**

## Step 3: Verify Setup

After running the SQL, you should see output confirming:
- User: support@vibeqa.app
- Role: superadmin
- Organization: VibeQA Support
- Subscription: Enterprise (unlimited)

## What This Creates

- **Organization**: "VibeQA Support" with slug `vibeqa-support`
- **Role**: superadmin (all permissions enabled)
- **Subscription**: Enterprise plan with unlimited everything
- **Expiry**: Never (100 years)
- **Test Project**: "Internal Testing" for testing purposes

## Test the Setup

1. Login at `/login` with support@vibeqa.app
2. Navigate to `/dashboard/settings/billing`
3. You should now have access without permission errors
4. You'll see "Enterprise" plan with unlimited limits

## Alternative: Run SQL via CLI

If you have database connection details, you can also run:

```bash
# Using psql directly
psql "postgresql://[user]:[password]@[host]:[port]/[database]" -f scripts/setup-support-user.sql

# Or copy the SQL content and run in any PostgreSQL client
```

## Troubleshooting

### "User not found" error
- Make sure you created the user in Supabase Auth first
- The email must be exactly `support@vibeqa.app`

### "Organization already exists" error
- The script handles existing organizations
- It will update the role if needed

### Still getting permission errors
- Clear your browser cache/cookies
- Log out and log back in
- Check that the user role is 'superadmin' in organization_members table