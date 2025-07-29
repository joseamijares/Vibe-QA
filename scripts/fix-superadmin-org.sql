-- ====================================
-- Fix Organization for Superadmin User
-- ====================================
-- This script creates an organization and membership for manually created users
-- who don't have an organization yet (like support@vibeqa.app)

DO $$
DECLARE
    support_user_id uuid;
    org_id uuid;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO support_user_id 
    FROM auth.users 
    WHERE email = 'support@vibeqa.app'
    LIMIT 1;
    
    IF support_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found user support@vibeqa.app with ID: %', support_user_id;
        
        -- Check if user already has an organization
        SELECT organization_id INTO org_id
        FROM organization_members
        WHERE user_id = support_user_id
        LIMIT 1;
        
        IF org_id IS NULL THEN
            RAISE NOTICE 'User has no organization, creating one...';
            
            -- Create organization for the user
            org_id := create_organization_for_user(
                support_user_id,
                'VibeQA Support',
                'vibeqa-support'
            );
            
            -- Update the role to owner (superadmin)
            UPDATE organization_members 
            SET role = 'owner' 
            WHERE user_id = support_user_id 
            AND organization_id = org_id;
            
            -- Create a default project for the organization
            INSERT INTO projects (organization_id, name, slug, description)
            VALUES (
                org_id,
                'Support Dashboard',
                'support-dashboard',
                'Internal project for VibeQA support team'
            );
            
            RAISE NOTICE 'Successfully created organization for support@vibeqa.app';
            RAISE NOTICE 'Organization ID: %', org_id;
            RAISE NOTICE 'You can now log in and access the dashboard!';
        ELSE
            RAISE NOTICE 'User already has organization: %', org_id;
            
            -- Ensure they have owner role
            UPDATE organization_members 
            SET role = 'owner' 
            WHERE user_id = support_user_id 
            AND organization_id = org_id;
            
            RAISE NOTICE 'Updated role to owner for existing organization';
        END IF;
    ELSE
        RAISE NOTICE 'ERROR: User support@vibeqa.app not found in auth.users';
        RAISE NOTICE 'Please ensure the user is created in Supabase Auth first';
    END IF;
END $$;

-- Verify the setup
SELECT 
    u.email,
    u.id as user_id,
    o.name as organization_name,
    o.slug as organization_slug,
    om.role,
    om.created_at as member_since
FROM auth.users u
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'support@vibeqa.app';