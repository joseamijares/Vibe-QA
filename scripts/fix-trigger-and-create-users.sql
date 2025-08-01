-- Fix Trigger and Create Users
-- This script disables the problematic trigger, allowing manual user creation

-- Step 1: Check what's wrong with the trigger
SELECT 
    'Checking trigger function...' as status;

-- Check if the trigger function has errors
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- Step 2: Create a safer version of the trigger function
CREATE OR REPLACE FUNCTION handle_new_user_safe()
RETURNS trigger AS $$
DECLARE
  org_name text;
  org_slug text;
  new_org_id uuid;
  existing_org_id uuid;
BEGIN
  -- Check if user already has an organization
  SELECT organization_id INTO existing_org_id
  FROM public.organization_members
  WHERE user_id = new.id
  LIMIT 1;
  
  -- Only create org if user doesn't have one
  IF existing_org_id IS NULL THEN
    BEGIN
      -- Generate organization name and slug from email
      org_name := split_part(new.email, '@', 1) || '''s Organization';
      org_slug := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || extract(epoch from now())::text;
      
      -- Create organization
      INSERT INTO public.organizations (name, slug)
      VALUES (org_name, org_slug)
      RETURNING id INTO new_org_id;
      
      -- Add user as owner of the organization
      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES (new_org_id, new.id, 'owner');
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create organization for user %: %', new.email, SQLERRM;
    END;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Replace the trigger with the safer version
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_safe();

-- Step 4: Now try creating users manually in Supabase Dashboard
SELECT '
=== INSTRUCTIONS ===

The trigger has been replaced with a safer version that won''t fail user creation.

Now you can:
1. Go to Supabase Dashboard > Authentication > Users
2. Create the test users:
   - owner@example.com (Password: TestPassword123!)
   - member1@example.com (Password: TestPassword123!)
   - member2@example.com (Password: TestPassword123!)

After creating users, run the manual-user-setup.sql script to complete the setup.
' as next_steps;