# Creating a Superadmin User in VibeQA

This guide explains how to create a superadmin user with the email `support@vibeqa.app` for the VibeQA platform.

## Overview

Currently, VibeQA uses an organization-based permission system with four roles:
- **Owner**: Full control over the organization
- **Admin**: Administrative access
- **Member**: Regular member access
- **Viewer**: Read-only access

While a dedicated Super Admin Module is planned (see `/docs/features/app-functionality-plan.md`), the current approach is to create a support organization with owner privileges.

## Prerequisites

- Node.js installed ([Download](https://nodejs.org))
- Access to the VibeQA project
- Supabase service role key (from your project settings)

## Methods to Create Superadmin

### Method 1: Fully Automated Script (Recommended)

This method creates the superadmin user programmatically without needing to access the Supabase Dashboard.

#### Step 1: Set up Service Role Key

1. Go to your [Supabase Project Settings](https://app.supabase.com)
2. Navigate to **Settings → API**
3. Copy the `service_role` key (under "Project API keys")
4. Add it to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```

⚠️ **Important**: Keep this key secret! It has full admin access to your database.

#### Step 2: Run the Automated Script

```bash
# From the project root directory
./scripts/create-superadmin-auto.sh
```

The script will:
1. Check for required environment variables
2. Create the user with a secure generated password
3. Set up the organization and permissions
4. Create an internal testing project
5. Display the generated password (save it securely!)

### Method 2: Dashboard + Script (Alternative)

If you prefer to create the user manually in the dashboard:

#### Step 1: Create User in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication → Users**
3. Click **"Create new user"**
4. Enter email: `support@vibeqa.app`
5. Set a secure password (save this securely!)
6. Check **"Auto Confirm Email"**
7. Click **"Create user"**

#### Step 2: Run the Setup Script

```bash
# From the project root directory
./scripts/create-superadmin-user.sh
```

### Method 3: Manual Creation

#### Step 1: Create User in Supabase Dashboard

Follow the same steps as Method 1, Step 1 above.

**Note**: The automated script uses the Supabase Admin API via the service role key, which works with any Supabase CLI version.

#### Step 2: Run the SQL Setup Script

```bash
# Using Supabase CLI
supabase db execute -f scripts/create-superadmin.sql

# Or using psql directly
psql $DATABASE_URL -f scripts/create-superadmin.sql
```

## What the Setup Creates

1. **User Account**
   - Email: `support@vibeqa.app`
   - Auto-confirmed email status

2. **Organization**
   - Name: "VibeQA Support"
   - Slug: `vibeqa-support`
   - Marked as internal organization

3. **Permissions**
   - User is set as "owner" of the organization
   - Full access to all organization features

4. **Internal Project**
   - Name: "Internal Testing"
   - Slug: `internal-testing`
   - For testing and support purposes

## Accessing the Superadmin Account

After creation, the superadmin can log in at:
- Local: `http://localhost:5173/login`
- Production: `https://app.vibeqa.app/login`

Use the email `support@vibeqa.app` and the password you set during creation.

## Security Considerations

1. **Password Security**
   - Use a strong, unique password
   - Store it securely (password manager recommended)
   - Never commit passwords to version control

2. **Access Control**
   - This account has full owner privileges
   - Limit access to trusted personnel only
   - Consider implementing 2FA when available

3. **Audit Trail**
   - All actions are logged in the `activity_logs` table
   - The setup process creates an audit entry

## Troubleshooting

### User Already Exists
If the user already exists in Supabase Auth, the script will continue with organization setup.

### Organization Already Exists
The script checks for existing organizations and will not create duplicates.

### Permission Errors
Ensure you have:
- Proper database permissions
- Supabase service role key configured
- Correct project selected in Supabase CLI

## Future Enhancements

The app functionality plan includes a dedicated Super Admin Module with:
- Platform-wide management dashboard
- User impersonation capabilities
- System configuration controls
- Financial management tools
- Compliance and legal tools

These features will require database schema updates and are planned for a future release.

## Related Documentation

- [App Functionality Plan](/docs/features/app-functionality-plan.md)
- [Database Schema](/docs/database-setup.md)
- [Authentication Setup](/docs/deployment/authentication.md)