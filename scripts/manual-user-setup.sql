-- Manual Test User Setup
-- Run this AFTER creating users in Supabase Dashboard

-- Step 1: Create users in Supabase Dashboard with these credentials:
-- owner@example.com - Password: TestPassword123!
-- member1@example.com - Password: TestPassword123!  
-- member2@example.com - Password: TestPassword123!

-- Step 2: Run this script to set up their organizations

-- Setup for owner@example.com and member1@example.com (same org)
DO $$
DECLARE
    v_owner_id uuid;
    v_member1_id uuid;
    v_org_id uuid;
    v_project_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'owner@example.com';
    SELECT id INTO v_member1_id FROM auth.users WHERE email = 'member1@example.com';
    
    IF v_owner_id IS NULL THEN
        RAISE NOTICE 'owner@example.com not found. Please create in Supabase Dashboard first.';
        RETURN;
    END IF;
    
    -- Check if owner already has an organization (from trigger)
    SELECT om.organization_id INTO v_org_id 
    FROM organization_members om
    WHERE om.user_id = v_owner_id
    LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        RAISE NOTICE 'Owner already has organization. Updating it...';
        
        -- Update organization name if needed
        UPDATE organizations 
        SET name = 'Test Organization' 
        WHERE id = v_org_id;
    ELSE
        -- Create new organization
        INSERT INTO organizations (name, slug)
        VALUES ('Test Organization', 'test-org-' || substr(md5(random()::text), 1, 8))
        RETURNING id INTO v_org_id;
        
        -- Add owner
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_owner_id, 'owner');
        
        RAISE NOTICE 'Created Test Organization';
    END IF;
    
    -- Add member1 to the same organization if they exist
    IF v_member1_id IS NOT NULL THEN
        -- Remove from any existing org first
        DELETE FROM organization_members WHERE user_id = v_member1_id;
        
        -- Add to Test Organization as member
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_member1_id, 'member');
        
        RAISE NOTICE 'Added member1@example.com to Test Organization';
    END IF;
    
    -- Create a sample project
    INSERT INTO projects (
        organization_id,
        name,
        slug,
        description,
        api_key
    ) VALUES (
        v_org_id,
        'Test Project Alpha',
        'test-project-alpha-' || substr(md5(random()::text), 1, 8),
        'Main project for testing owner and member collaboration',
        'proj_' || encode(gen_random_bytes(16), 'hex')
    ) RETURNING id INTO v_project_id;
    
    -- Add sample feedback
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
        v_project_id,
        'bug',
        'Login button not working',
        'The login button on the homepage is unresponsive when clicked.',
        'user@example.com',
        'Test User',
        'new',
        'high'
    ),
    (
        v_project_id,
        'suggestion',
        'Add dark mode',
        'It would be great to have a dark mode option for the dashboard.',
        'user2@example.com',
        'Another User',
        'new',
        'medium'
    );
    
    RAISE NOTICE 'Setup complete for Test Organization!';
END $$;

-- Setup for member2@example.com (separate org)
DO $$
DECLARE
    v_member2_id uuid;
    v_org_id uuid;
    v_project_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO v_member2_id FROM auth.users WHERE email = 'member2@example.com';
    
    IF v_member2_id IS NULL THEN
        RAISE NOTICE 'member2@example.com not found. Please create in Supabase Dashboard first.';
        RETURN;
    END IF;
    
    -- Check if already has an organization
    SELECT om.organization_id INTO v_org_id 
    FROM organization_members om
    WHERE om.user_id = v_member2_id
    LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        RAISE NOTICE 'Member2 already has organization. Updating it...';
        
        -- Update organization name
        UPDATE organizations 
        SET name = 'Member Organization' 
        WHERE id = v_org_id;
        
        -- Ensure they're owner
        UPDATE organization_members 
        SET role = 'owner' 
        WHERE user_id = v_member2_id AND organization_id = v_org_id;
    ELSE
        -- Create new organization
        INSERT INTO organizations (name, slug)
        VALUES ('Member Organization', 'member-org-' || substr(md5(random()::text), 1, 8))
        RETURNING id INTO v_org_id;
        
        -- Add as owner
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_member2_id, 'owner');
        
        RAISE NOTICE 'Created Member Organization';
    END IF;
    
    -- Create a sample project
    INSERT INTO projects (
        organization_id,
        name,
        slug,
        description,
        api_key
    ) VALUES (
        v_org_id,
        'Member Project Beta',
        'member-project-beta-' || substr(md5(random()::text), 1, 8),
        'Project owned by member2 in their own organization',
        'proj_' || encode(gen_random_bytes(16), 'hex')
    ) RETURNING id INTO v_project_id;
    
    -- Add sample feedback
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
        v_project_id,
        'bug',
        'Mobile responsive issues',
        'The navigation menu does not work properly on mobile devices.',
        'mobile@example.com',
        'Mobile Tester',
        'in_progress',
        'high'
    );
    
    RAISE NOTICE 'Setup complete for Member Organization!';
END $$;

-- Final verification
SELECT 
    u.email,
    om.role as user_role,
    o.name as organization_name,
    COUNT(DISTINCT p.id) as project_count
FROM auth.users u
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
LEFT JOIN projects p ON p.organization_id = o.id
WHERE u.email IN ('owner@example.com', 'member1@example.com', 'member2@example.com')
GROUP BY u.email, om.role, o.name
ORDER BY u.email;