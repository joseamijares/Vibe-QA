-- Setup Test Project for Widget Development
-- Run this script in your Supabase SQL editor

-- First, check if a test organization exists
DO $$
DECLARE
    test_org_id UUID;
    test_project_id UUID;
BEGIN
    -- Check for existing test organization
    SELECT id INTO test_org_id 
    FROM organizations 
    WHERE slug = 'test-org' 
    LIMIT 1;
    
    -- If no test org exists, create one
    IF test_org_id IS NULL THEN
        INSERT INTO organizations (name, slug, settings)
        VALUES (
            'Test Organization',
            'test-org',
            '{"description": "Organization for testing widget integration"}'::jsonb
        )
        RETURNING id INTO test_org_id;
        
        RAISE NOTICE 'Created test organization with ID: %', test_org_id;
    ELSE
        RAISE NOTICE 'Using existing test organization with ID: %', test_org_id;
    END IF;
    
    -- Check if test project exists
    SELECT id INTO test_project_id
    FROM projects
    WHERE organization_id = test_org_id
    AND slug = 'test-project'
    LIMIT 1;
    
    -- If no test project exists, create one
    IF test_project_id IS NULL THEN
        INSERT INTO projects (
            organization_id,
            name,
            slug,
            description,
            api_key,
            is_active,
            allowed_domains,
            settings
        ) VALUES (
            test_org_id,
            'Test Project',
            'test-project',
            'Project for testing widget feedback submission',
            'proj_test123456789',
            true,
            ARRAY['localhost:5173', 'localhost:3000', 'localhost:4173'],
            '{
                "feedbackTypes": ["bug", "suggestion", "praise", "other"],
                "emailNotifications": true,
                "autoAssign": false
            }'::jsonb
        )
        RETURNING id INTO test_project_id;
        
        RAISE NOTICE 'Created test project with ID: %', test_project_id;
        RAISE NOTICE 'API Key: proj_test123456789';
    ELSE
        -- Update the API key to ensure it matches our test configuration
        UPDATE projects 
        SET api_key = 'proj_test123456789',
            is_active = true,
            allowed_domains = ARRAY['localhost:5173', 'localhost:3000', 'localhost:4173']
        WHERE id = test_project_id;
        
        RAISE NOTICE 'Updated existing test project with ID: %', test_project_id;
        RAISE NOTICE 'API Key: proj_test123456789';
    END IF;
    
    -- Create a test user if needed (optional - for dashboard access)
    -- This assumes you have a user in auth.users you want to associate
    -- Uncomment and modify the user_id if you want to add a test user to the organization
    /*
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (test_org_id, 'YOUR-AUTH-USER-ID', 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    */
    
END $$;

-- Verify the setup
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.api_key,
    p.is_active,
    p.allowed_domains,
    o.name as organization_name,
    o.slug as organization_slug
FROM projects p
JOIN organizations o ON p.organization_id = o.id
WHERE p.api_key = 'proj_test123456789';

-- Show some sample queries for testing
/*
-- To view all feedback for the test project:
SELECT * FROM feedback 
WHERE project_id = (SELECT id FROM projects WHERE api_key = 'proj_test123456789')
ORDER BY created_at DESC;

-- To clean up test feedback:
DELETE FROM feedback 
WHERE project_id = (SELECT id FROM projects WHERE api_key = 'proj_test123456789');
*/