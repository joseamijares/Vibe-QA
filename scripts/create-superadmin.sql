-- Create Superadmin User Script for VibeQA
-- This script creates a superadmin user with email support@vibeqa.app
-- and sets up the necessary organization and permissions

-- Note: The user must first be created in Supabase Auth
-- You can do this via Supabase Dashboard or using the Supabase CLI:
-- supabase auth admin create-user --email support@vibeqa.app --password [secure-password]

-- After creating the auth user, run this script to set up the organization and permissions

DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_project_id UUID;
BEGIN
    -- Get the user ID from auth.users (assumes user already exists)
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'support@vibeqa.app'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email support@vibeqa.app not found. Please create the user in Supabase Auth first.';
    END IF;
    
    -- Check if organization already exists
    SELECT id INTO v_org_id
    FROM organizations
    WHERE slug = 'vibeqa-support'
    LIMIT 1;
    
    IF v_org_id IS NULL THEN
        -- Create the support organization
        INSERT INTO organizations (name, slug, settings)
        VALUES (
            'VibeQA Support',
            'vibeqa-support',
            jsonb_build_object(
                'is_internal', true,
                'created_by', 'system',
                'purpose', 'Internal support and administration'
            )
        )
        RETURNING id INTO v_org_id;
        
        RAISE NOTICE 'Created organization: VibeQA Support (%)' , v_org_id;
    ELSE
        RAISE NOTICE 'Organization already exists: %', v_org_id;
    END IF;
    
    -- Check if user is already a member of the organization
    IF NOT EXISTS (
        SELECT 1 
        FROM organization_members 
        WHERE organization_id = v_org_id 
        AND user_id = v_user_id
    ) THEN
        -- Add user as owner of the organization
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_user_id, 'owner');
        
        RAISE NOTICE 'Added user as owner of organization';
    ELSE
        -- Update role to owner if not already
        UPDATE organization_members
        SET role = 'owner'
        WHERE organization_id = v_org_id 
        AND user_id = v_user_id
        AND role != 'owner';
        
        RAISE NOTICE 'User is already a member of the organization';
    END IF;
    
    -- Create a default project for the support organization
    SELECT id INTO v_project_id
    FROM projects
    WHERE organization_id = v_org_id
    AND slug = 'internal-testing'
    LIMIT 1;
    
    IF v_project_id IS NULL THEN
        INSERT INTO projects (
            organization_id,
            name,
            slug,
            description,
            settings,
            is_active
        )
        VALUES (
            v_org_id,
            'Internal Testing',
            'internal-testing',
            'Project for internal testing and support purposes',
            jsonb_build_object(
                'allow_anonymous_feedback', true,
                'require_email', false
            ),
            true
        )
        RETURNING id INTO v_project_id;
        
        RAISE NOTICE 'Created internal testing project: %', v_project_id;
    END IF;
    
    -- Log the activity
    INSERT INTO activity_logs (
        organization_id,
        user_id,
        action,
        resource_type,
        resource_id,
        metadata
    )
    VALUES (
        v_org_id,
        v_user_id,
        'superadmin_setup',
        'user',
        v_user_id,
        jsonb_build_object(
            'email', 'support@vibeqa.app',
            'setup_date', NOW(),
            'setup_by', 'system_script'
        )
    );
    
    RAISE NOTICE 'Superadmin setup completed successfully!';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Organization ID: %', v_org_id;
    RAISE NOTICE 'Project ID: %', v_project_id;
    
END $$;

-- Verify the setup
SELECT 
    u.email,
    u.id as user_id,
    o.name as organization_name,
    o.slug as organization_slug,
    om.role,
    om.joined_at
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'support@vibeqa.app';