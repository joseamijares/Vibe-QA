-- VibeQA Test Users Creation Script
-- Creates 3 test users: 1 owner and 2 members (one in same org, one in different org)
-- 
-- IMPORTANT: First create users in Supabase Auth Dashboard with these credentials:
-- 1. owner@example.com - Password: TestPassword123!
-- 2. member1@example.com - Password: TestPassword123!
-- 3. member2@example.com - Password: TestPassword123!
--
-- Then run this SQL script in Supabase SQL Editor

-- Clean up any existing test data first
DO $$
DECLARE
    test_user record;
    org_id uuid;
BEGIN
    -- Find all test users
    FOR test_user IN 
        SELECT id FROM auth.users 
        WHERE email IN ('owner@example.com', 'member1@example.com', 'member2@example.com')
    LOOP
        -- Get their organizations
        FOR org_id IN 
            SELECT organization_id FROM organization_members 
            WHERE user_id = test_user.id
        LOOP
            -- Delete organization (cascades to all related data)
            DELETE FROM organizations WHERE id = org_id;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Cleaned up existing test data';
END $$;

-- Create Organization 1 with Owner and Member1
DO $$
DECLARE
    v_owner_id uuid;
    v_member1_id uuid;
    v_org1_id uuid;
    v_project1_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'owner@example.com';
    SELECT id INTO v_member1_id FROM auth.users WHERE email = 'member1@example.com';
    
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'User owner@example.com not found. Please create in Supabase Auth first.';
    END IF;
    
    IF v_member1_id IS NULL THEN
        RAISE EXCEPTION 'User member1@example.com not found. Please create in Supabase Auth first.';
    END IF;
    
    -- Create Organization 1
    INSERT INTO organizations (name, slug)
    VALUES ('Test Organization', 'test-org-' || extract(epoch from now())::text)
    RETURNING id INTO v_org1_id;
    
    -- Add owner to organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org1_id, v_owner_id, 'owner');
    
    -- Add member1 to same organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org1_id, v_member1_id, 'member');
    
    -- Create a project for this organization
    INSERT INTO projects (
        organization_id,
        name,
        slug,
        description,
        api_key
    ) VALUES (
        v_org1_id,
        'Test Project Alpha',
        'test-project-alpha-' || extract(epoch from now())::text,
        'Main project for testing owner and member collaboration',
        'proj_' || encode(gen_random_bytes(16), 'hex')
    ) RETURNING id INTO v_project1_id;
    
    -- Add some sample feedback
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
    ),
    (
        v_project1_id,
        'praise',
        'Great user interface!',
        'Really loving the clean and intuitive design of the dashboard.',
        'happy@example.com',
        'Happy Customer',
        'resolved',
        'low'
    );
    
    RAISE NOTICE 'Organization 1 created successfully!';
    RAISE NOTICE 'Owner: owner@example.com';
    RAISE NOTICE 'Member: member1@example.com';
    RAISE NOTICE 'Organization ID: %', v_org1_id;
END $$;

-- Create Organization 2 with Member2 as owner
DO $$
DECLARE
    v_member2_id uuid;
    v_org2_id uuid;
    v_project2_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO v_member2_id FROM auth.users WHERE email = 'member2@example.com';
    
    IF v_member2_id IS NULL THEN
        RAISE EXCEPTION 'User member2@example.com not found. Please create in Supabase Auth first.';
    END IF;
    
    -- Create Organization 2
    INSERT INTO organizations (name, slug)
    VALUES ('Member Organization', 'member-org-' || extract(epoch from now())::text)
    RETURNING id INTO v_org2_id;
    
    -- Add member2 as owner of their own organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org2_id, v_member2_id, 'owner');
    
    -- Create a project for this organization
    INSERT INTO projects (
        organization_id,
        name,
        slug,
        description,
        api_key
    ) VALUES (
        v_org2_id,
        'Member Project Beta',
        'member-project-beta-' || extract(epoch from now())::text,
        'Project owned by member2 in their own organization',
        'proj_' || encode(gen_random_bytes(16), 'hex')
    ) RETURNING id INTO v_project2_id;
    
    -- Add some sample feedback
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
    ),
    (
        v_project2_id,
        'other',
        'General feedback',
        'Just wanted to say the app is working well for our team.',
        'team@example.com',
        'Team Lead',
        'new',
        'low'
    );
    
    RAISE NOTICE 'Organization 2 created successfully!';
    RAISE NOTICE 'Owner: member2@example.com';
    RAISE NOTICE 'Organization ID: %', v_org2_id;
END $$;

-- Summary of created users
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST USERS CREATED SUCCESSFULLY ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. OWNER USER:';
    RAISE NOTICE '   Email: owner@example.com';
    RAISE NOTICE '   Password: TestPassword123!';
    RAISE NOTICE '   Organization: Test Organization';
    RAISE NOTICE '   Role: Owner';
    RAISE NOTICE '   Access: Full control of organization';
    RAISE NOTICE '';
    RAISE NOTICE '2. MEMBER USER 1:';
    RAISE NOTICE '   Email: member1@example.com';
    RAISE NOTICE '   Password: TestPassword123!';
    RAISE NOTICE '   Organization: Test Organization (same as owner)';
    RAISE NOTICE '   Role: Member';
    RAISE NOTICE '   Access: Can manage feedback, view projects';
    RAISE NOTICE '';
    RAISE NOTICE '3. MEMBER USER 2:';
    RAISE NOTICE '   Email: member2@example.com';
    RAISE NOTICE '   Password: TestPassword123!';
    RAISE NOTICE '   Organization: Member Organization (different org)';
    RAISE NOTICE '   Role: Owner (of their own org)';
    RAISE NOTICE '   Access: Full control of their organization';
    RAISE NOTICE '';
    RAISE NOTICE 'Test these scenarios:';
    RAISE NOTICE '- Owner vs Member permissions in same org';
    RAISE NOTICE '- Cross-organization isolation';
    RAISE NOTICE '- Team collaboration features';
    RAISE NOTICE '- Role-based UI elements';
END $$;