-- VibeQA Test User Creation Function
-- This creates a reusable function for creating test users with proper organizations
-- Completely separate from superadmin functionality

-- Drop function if exists
DROP FUNCTION IF EXISTS create_test_user(text, text, user_role, text, uuid);

-- Create the test user creation function
CREATE OR REPLACE FUNCTION create_test_user(
    user_email text,
    user_password text,
    user_role_param user_role DEFAULT 'member',
    org_name text DEFAULT NULL,
    existing_org_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_org_slug text;
    v_existing_user_id uuid;
    v_result jsonb;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_existing_user_id FROM auth.users WHERE email = user_email;
    
    IF v_existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'User with email % already exists', user_email;
    END IF;
    
    -- Create the user
    v_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at,
        role
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        user_email,
        crypt(user_password, gen_salt('bf')),
        now(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        false,
        now(),
        now(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        'authenticated'
    );
    
    -- Create identity for the user
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object(
            'sub', v_user_id::text,
            'email', user_email,
            'email_verified', true,
            'provider', 'email'
        ),
        'email',
        now(),
        now(),
        now()
    );
    
    -- Handle organization logic
    IF existing_org_id IS NOT NULL THEN
        -- Join existing organization
        v_org_id := existing_org_id;
        
        -- Verify organization exists
        IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = v_org_id) THEN
            RAISE EXCEPTION 'Organization with id % does not exist', v_org_id;
        END IF;
        
        -- Add user to organization
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_user_id, user_role_param);
        
    ELSIF org_name IS NOT NULL THEN
        -- Create new organization
        v_org_slug := lower(regexp_replace(org_name, '[^a-z0-9]', '-', 'g')) || '-' || substr(md5(random()::text), 1, 8);
        
        INSERT INTO organizations (name, slug)
        VALUES (org_name, v_org_slug)
        RETURNING id INTO v_org_id;
        
        -- Add user as owner (even if user_role_param is different, creator should be owner)
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_user_id, CASE WHEN user_role_param = 'member' THEN 'owner' ELSE user_role_param END);
        
    ELSE
        -- No organization specified, use default from trigger
        -- The trigger will handle creating an organization
        NULL;
    END IF;
    
    -- Build result
    v_result := jsonb_build_object(
        'user_id', v_user_id,
        'email', user_email,
        'organization_id', v_org_id,
        'role', user_role_param,
        'success', true,
        'message', 'User created successfully'
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback by returning error
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to postgres role
GRANT EXECUTE ON FUNCTION create_test_user TO postgres;

-- Create the three test users
DO $$
DECLARE
    v_result jsonb;
    v_org1_id uuid;
BEGIN
    RAISE NOTICE 'Creating test users...';
    
    -- Create owner with new organization
    v_result := create_test_user(
        'owner@example.com',
        'TestPassword123!',
        'owner',
        'Test Organization'
    );
    
    IF (v_result->>'success')::boolean THEN
        v_org1_id := (v_result->>'organization_id')::uuid;
        RAISE NOTICE 'Created owner@example.com: %', v_result;
    ELSE
        RAISE NOTICE 'Failed to create owner@example.com: %', v_result->>'error';
    END IF;
    
    -- Create member1 in the same organization
    IF v_org1_id IS NOT NULL THEN
        v_result := create_test_user(
            'member1@example.com',
            'TestPassword123!',
            'member',
            NULL,
            v_org1_id
        );
        
        IF (v_result->>'success')::boolean THEN
            RAISE NOTICE 'Created member1@example.com: %', v_result;
        ELSE
            RAISE NOTICE 'Failed to create member1@example.com: %', v_result->>'error';
        END IF;
    END IF;
    
    -- Create member2 with their own organization
    v_result := create_test_user(
        'member2@example.com',
        'TestPassword123!',
        'owner',  -- They're owner of their own org
        'Member Organization'
    );
    
    IF (v_result->>'success')::boolean THEN
        RAISE NOTICE 'Created member2@example.com: %', v_result;
    ELSE
        RAISE NOTICE 'Failed to create member2@example.com: %', v_result->>'error';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST USERS SUMMARY ===';
    RAISE NOTICE '1. owner@example.com - Owner of "Test Organization"';
    RAISE NOTICE '2. member1@example.com - Member in "Test Organization"';
    RAISE NOTICE '3. member2@example.com - Owner of "Member Organization"';
    RAISE NOTICE 'Password for all: TestPassword123!';
    
END $$;

-- Add sample projects and feedback
DO $$
DECLARE
    v_org1_id uuid;
    v_org2_id uuid;
    v_project1_id uuid;
    v_project2_id uuid;
BEGIN
    -- Get organization IDs
    SELECT o.id INTO v_org1_id 
    FROM organizations o 
    WHERE o.name = 'Test Organization' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    SELECT o.id INTO v_org2_id 
    FROM organizations o 
    WHERE o.name = 'Member Organization' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Create projects if organizations exist
    IF v_org1_id IS NOT NULL THEN
        INSERT INTO projects (
            organization_id,
            name,
            slug,
            description,
            api_key
        ) VALUES (
            v_org1_id,
            'Test Project Alpha',
            'test-project-alpha-' || substr(md5(random()::text), 1, 8),
            'Main project for testing owner and member collaboration',
            'proj_' || encode(gen_random_bytes(16), 'hex')
        ) RETURNING id INTO v_project1_id;
        
        -- Add sample feedback
        IF v_project1_id IS NOT NULL THEN
            INSERT INTO feedback (
                project_id,
                type,
                title,
                description,
                reporter_email,
                reporter_name,
                status,
                priority
            ) VALUES 
            (
                v_project1_id,
                'bug',
                'Login button not working',
                'The login button on the homepage is unresponsive when clicked.',
                'user@example.com',
                'Test User',
                'new',
                'high'
            ),
            (
                v_project1_id,
                'suggestion',
                'Add dark mode',
                'It would be great to have a dark mode option for the dashboard.',
                'user2@example.com',
                'Another User',
                'new',
                'medium'
            );
        END IF;
    END IF;
    
    IF v_org2_id IS NOT NULL THEN
        INSERT INTO projects (
            organization_id,
            name,
            slug,
            description,
            api_key
        ) VALUES (
            v_org2_id,
            'Member Project Beta',
            'member-project-beta-' || substr(md5(random()::text), 1, 8),
            'Project owned by member2 in their own organization',
            'proj_' || encode(gen_random_bytes(16), 'hex')
        ) RETURNING id INTO v_project2_id;
        
        -- Add sample feedback
        IF v_project2_id IS NOT NULL THEN
            INSERT INTO feedback (
                project_id,
                type,
                title,
                description,
                reporter_email,
                reporter_name,
                status,
                priority
            ) VALUES 
            (
                v_project2_id,
                'bug',
                'Mobile responsive issues',
                'The navigation menu does not work properly on mobile devices.',
                'mobile@example.com',
                'Mobile Tester',
                'in_progress',
                'high'
            );
        END IF;
    END IF;
    
    RAISE NOTICE 'Sample projects and feedback created!';
END $$;

-- Verify the users were created
SELECT 
    u.email,
    u.created_at,
    om.role,
    o.name as organization_name
FROM auth.users u
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE u.email IN ('owner@example.com', 'member1@example.com', 'member2@example.com')
ORDER BY u.email;