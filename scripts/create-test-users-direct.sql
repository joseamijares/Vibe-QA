-- VibeQA Test Users Creation Script (Direct SQL Method)
-- This script creates test users directly in the database, bypassing the trigger temporarily
--
-- Run this script in Supabase SQL Editor

BEGIN;

-- Step 1: Temporarily disable the user creation trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Step 2: Create test users directly
DO $$
DECLARE
    v_owner_id uuid;
    v_member1_id uuid;
    v_member2_id uuid;
    v_org1_id uuid;
    v_org2_id uuid;
    v_project1_id uuid;
    v_project2_id uuid;
BEGIN
    -- Clean up any existing test users first
    DELETE FROM auth.users WHERE email IN ('owner@example.com', 'member1@example.com', 'member2@example.com');
    
    -- Create owner user
    v_owner_id := gen_random_uuid();
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        v_owner_id,
        'owner@example.com',
        crypt('TestPassword123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        false,
        'authenticated'
    );

    -- Create member1 user
    v_member1_id := gen_random_uuid();
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        v_member1_id,
        'member1@example.com',
        crypt('TestPassword123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        false,
        'authenticated'
    );

    -- Create member2 user
    v_member2_id := gen_random_uuid();
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        v_member2_id,
        'member2@example.com',
        crypt('TestPassword123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        false,
        'authenticated'
    );

    -- Create identities for the users (required for auth to work properly)
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES 
        (v_owner_id, v_owner_id, jsonb_build_object('sub', v_owner_id, 'email', 'owner@example.com'), 'email', now(), now(), now()),
        (v_member1_id, v_member1_id, jsonb_build_object('sub', v_member1_id, 'email', 'member1@example.com'), 'email', now(), now(), now()),
        (v_member2_id, v_member2_id, jsonb_build_object('sub', v_member2_id, 'email', 'member2@example.com'), 'email', now(), now(), now());

    RAISE NOTICE 'Users created successfully!';
    
    -- Create Organization 1
    INSERT INTO organizations (name, slug)
    VALUES ('Test Organization', 'test-org-' || substr(md5(random()::text), 1, 8))
    RETURNING id INTO v_org1_id;
    
    -- Add owner to organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org1_id, v_owner_id, 'owner');
    
    -- Add member1 to same organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org1_id, v_member1_id, 'member');
    
    -- Create Organization 2
    INSERT INTO organizations (name, slug)
    VALUES ('Member Organization', 'member-org-' || substr(md5(random()::text), 1, 8))
    RETURNING id INTO v_org2_id;
    
    -- Add member2 as owner of their own organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org2_id, v_member2_id, 'owner');
    
    -- Create projects
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
    
    -- Add sample feedback for project 1
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
    
    -- Add sample feedback for project 2
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
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST USERS CREATED SUCCESSFULLY ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. OWNER USER:';
    RAISE NOTICE '   Email: owner@example.com';
    RAISE NOTICE '   Password: TestPassword123!';
    RAISE NOTICE '   Organization: Test Organization';
    RAISE NOTICE '   Role: Owner';
    RAISE NOTICE '';
    RAISE NOTICE '2. MEMBER USER 1:';
    RAISE NOTICE '   Email: member1@example.com';
    RAISE NOTICE '   Password: TestPassword123!';
    RAISE NOTICE '   Organization: Test Organization (same as owner)';
    RAISE NOTICE '   Role: Member';
    RAISE NOTICE '';
    RAISE NOTICE '3. MEMBER USER 2:';
    RAISE NOTICE '   Email: member2@example.com';
    RAISE NOTICE '   Password: TestPassword123!';
    RAISE NOTICE '   Organization: Member Organization';
    RAISE NOTICE '   Role: Owner (of their own org)';
    RAISE NOTICE '';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating users: %', SQLERRM;
        RAISE;
END $$;

-- Step 3: Re-enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

COMMIT;

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