-- Simple Test Users Creation
-- This script checks what exists and provides clear instructions

-- First, let's check if any test users already exist
DO $$
DECLARE
    v_user_count integer;
    v_owner_id uuid;
    v_member1_id uuid;
    v_member2_id uuid;
BEGIN
    -- Check existing users
    SELECT COUNT(*) INTO v_user_count 
    FROM auth.users 
    WHERE email IN ('owner@example.com', 'member1@example.com', 'member2@example.com');
    
    IF v_user_count > 0 THEN
        RAISE NOTICE 'Found % existing test user(s). Checking their setup...', v_user_count;
        
        -- Get user IDs
        SELECT id INTO v_owner_id FROM auth.users WHERE email = 'owner@example.com';
        SELECT id INTO v_member1_id FROM auth.users WHERE email = 'member1@example.com';
        SELECT id INTO v_member2_id FROM auth.users WHERE email = 'member2@example.com';
        
        -- Check organizations
        IF v_owner_id IS NOT NULL THEN
            RAISE NOTICE 'owner@example.com exists with ID: %', v_owner_id;
            
            -- Check if they have an organization
            IF NOT EXISTS (SELECT 1 FROM organization_members WHERE user_id = v_owner_id) THEN
                RAISE NOTICE '  -> No organization found, the trigger may have failed';
            END IF;
        END IF;
        
        IF v_member1_id IS NOT NULL THEN
            RAISE NOTICE 'member1@example.com exists with ID: %', v_member1_id;
        END IF;
        
        IF v_member2_id IS NOT NULL THEN
            RAISE NOTICE 'member2@example.com exists with ID: %', v_member2_id;
        END IF;
        
    ELSE
        RAISE NOTICE 'No test users found.';
    END IF;
END $$;

-- Check if the create_test_user function exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_test_user') 
        THEN 'create_test_user function EXISTS'
        ELSE 'create_test_user function NOT FOUND'
    END as function_status;

-- Check if the trigger exists and is enabled
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as is_enabled,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
AND c.relname = 'users'
AND t.tgname = 'on_auth_user_created';

-- Manual user creation instructions
SELECT '
=== MANUAL USER CREATION INSTRUCTIONS ===

Since automated creation may have failed, here are the steps to create users manually:

1. Go to Supabase Dashboard > Authentication > Users

2. Click "Add user" and create:
   - Email: owner@example.com
   - Password: TestPassword123!
   
3. After creation, run this SQL to fix their organization:
   
   -- For owner@example.com
   DO $$
   DECLARE
       v_user_id uuid;
       v_org_id uuid;
   BEGIN
       SELECT id INTO v_user_id FROM auth.users WHERE email = ''owner@example.com'';
       
       -- Check if they have an org
       SELECT organization_id INTO v_org_id 
       FROM organization_members 
       WHERE user_id = v_user_id;
       
       IF v_org_id IS NULL THEN
           -- Create org
           INSERT INTO organizations (name, slug)
           VALUES (''Test Organization'', ''test-org-'' || substr(md5(random()::text), 1, 8))
           RETURNING id INTO v_org_id;
           
           -- Add as owner
           INSERT INTO organization_members (organization_id, user_id, role)
           VALUES (v_org_id, v_user_id, ''owner'');
       END IF;
       
       RAISE NOTICE ''Organization setup complete for owner@example.com'';
   END $$;

4. Repeat for member1@example.com and member2@example.com

' as instructions;

-- Alternative: Try creating with a simpler method
-- This uses a more direct approach that might work better
DO $$
DECLARE
    v_result record;
BEGIN
    -- Try to create owner@example.com using the function if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_test_user') THEN
        RAISE NOTICE 'Attempting to create users using create_test_user function...';
        
        -- Create owner
        BEGIN
            SELECT * INTO v_result FROM create_test_user(
                'owner@example.com',
                'TestPassword123!',
                'owner',
                'Test Organization'
            );
            RAISE NOTICE 'Owner creation result: %', v_result;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create owner: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'create_test_user function not found. Please create users manually in Supabase Dashboard.';
    END IF;
END $$;