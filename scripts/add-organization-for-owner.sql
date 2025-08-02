-- Add Organization for owner@example.com
-- Run this in Supabase Dashboard SQL Editor

DO $$
DECLARE
    v_user_id uuid;
    v_user_email text := 'owner@example.com';
    v_org_id uuid;
    v_existing_membership record;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with email: %', v_user_email;
    END IF;
    
    -- Check if user already has an organization membership
    SELECT * INTO v_existing_membership
    FROM organization_members
    WHERE user_id = v_user_id
    LIMIT 1;
    
    IF v_existing_membership.id IS NOT NULL THEN
        -- User already has membership, just update role to owner if needed
        IF v_existing_membership.role != 'owner' THEN
            UPDATE organization_members
            SET role = 'owner'
            WHERE id = v_existing_membership.id;
            
            RAISE NOTICE 'Updated existing membership to owner role for user %', v_user_email;
        ELSE
            RAISE NOTICE 'User % already has owner role in organization', v_user_email;
        END IF;
    ELSE
        -- Create new organization and membership
        -- Generate organization name and slug
        INSERT INTO organizations (name, slug)
        VALUES (
            'Owner''s Organization',
            'owner-org-' || substr(md5(random()::text), 1, 8)
        )
        RETURNING id INTO v_org_id;
        
        -- Add user as owner
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_user_id, 'owner');
        
        -- Initialize trial for the organization
        INSERT INTO organization_trial_status (organization_id)
        VALUES (v_org_id)
        ON CONFLICT (organization_id) DO NOTHING;
        
        -- Log the activity
        INSERT INTO activity_logs (organization_id, user_id, action, resource_type, resource_id)
        VALUES (v_org_id, v_user_id, 'organization_created_via_script', 'organization', v_org_id);
        
        RAISE NOTICE 'Created organization and added user % as owner', v_user_email;
    END IF;
END $$;

-- Verify the setup
SELECT 
    u.email,
    om.role,
    o.name as organization_name,
    o.slug as organization_slug,
    o.subscription_plan,
    o.subscription_status,
    ots.trial_ends_at,
    om.joined_at
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
LEFT JOIN organization_trial_status ots ON o.id = ots.organization_id
WHERE u.email = 'owner@example.com';