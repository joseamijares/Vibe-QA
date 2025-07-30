-- Fix User Organization Script
-- Run this in Supabase Dashboard SQL Editor

-- Step 1: Find your user ID (replace with your email)
DO $$
DECLARE
    v_user_id uuid;
    v_user_email text := 'YOUR_EMAIL_HERE'; -- REPLACE WITH YOUR EMAIL
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
            split_part(v_user_email, '@', 1) || '''s Organization',
            lower(regexp_replace(split_part(v_user_email, '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || extract(epoch from now())::text
        )
        RETURNING id INTO v_org_id;
        
        -- Add user as owner
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_user_id, 'owner');
        
        -- Log the activity
        INSERT INTO activity_logs (organization_id, user_id, action, resource_type, resource_id)
        VALUES (v_org_id, v_user_id, 'organization_created_via_fix', 'organization', v_org_id);
        
        RAISE NOTICE 'Created organization and added user % as owner', v_user_email;
    END IF;
END $$;

-- Step 2: Verify the fix
-- This will show your organization membership
SELECT 
    u.email,
    om.role,
    o.name as organization_name,
    o.slug as organization_slug,
    om.joined_at
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'YOUR_EMAIL_HERE'; -- REPLACE WITH YOUR EMAIL