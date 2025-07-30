-- Check and Fix User Organization Script
-- This script checks your current state and fixes any issues

-- IMPORTANT: Replace 'YOUR_EMAIL_HERE' with your actual email address!

-- Step 1: Check current user state
WITH user_check AS (
    SELECT 
        u.id as user_id,
        u.email,
        u.created_at as user_created,
        om.id as membership_id,
        om.role,
        om.organization_id,
        o.name as org_name,
        o.slug as org_slug
    FROM auth.users u
    LEFT JOIN organization_members om ON u.id = om.user_id
    LEFT JOIN organizations o ON om.organization_id = o.id
    WHERE u.email = 'YOUR_EMAIL_HERE'
)
SELECT 
    'Current Status:' as info,
    CASE 
        WHEN user_id IS NULL THEN 'ERROR: User not found!'
        WHEN membership_id IS NULL THEN 'ERROR: No organization membership!'
        WHEN role IS NULL THEN 'ERROR: No role assigned!'
        WHEN role != 'owner' THEN 'WARNING: User is ' || role || ', not owner'
        ELSE 'OK: User is ' || role || ' of ' || org_name
    END as status,
    user_id,
    email,
    role,
    org_name,
    org_slug
FROM user_check;

-- Step 2: If you see errors above, uncomment and run this fix:
/*
-- Fix for missing organization/membership
DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;
    
    -- Check if user has membership
    IF NOT EXISTS (SELECT 1 FROM organization_members WHERE user_id = v_user_id) THEN
        -- Create organization
        INSERT INTO organizations (name, slug)
        VALUES (
            split_part('YOUR_EMAIL_HERE', '@', 1) || '''s Organization',
            lower(regexp_replace(split_part('YOUR_EMAIL_HERE', '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || extract(epoch from now())::text
        )
        RETURNING id INTO v_org_id;
        
        -- Add as owner
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_user_id, 'owner');
        
        RAISE NOTICE 'Created organization and added user as owner';
    ELSE
        -- Update existing membership to owner
        UPDATE organization_members 
        SET role = 'owner' 
        WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Updated existing membership to owner';
    END IF;
END $$;

-- Verify the fix worked
SELECT 
    u.email,
    om.role,
    o.name as organization,
    'Fixed!' as status
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'YOUR_EMAIL_HERE';
*/