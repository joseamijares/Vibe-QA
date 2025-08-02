-- Fix missing organization for user owener@example.com
-- User ID: 271e7c40-74a1-464b-bfa4-78e7bf8376aa

-- First, check if user exists in auth.users
SELECT 
    id, 
    email, 
    created_at 
FROM auth.users 
WHERE id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa';

-- Check if user has any organization membership
SELECT 
    om.*,
    o.name as org_name
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa';

-- Check if there are any organizations created by this user
SELECT 
    id,
    name,
    created_by,
    created_at,
    trial_ends_at
FROM organizations
WHERE created_by = '271e7c40-74a1-464b-bfa4-78e7bf8376aa';

-- Create organization and membership for the user
DO $$
DECLARE
    new_org_id uuid;
    user_exists boolean;
    has_membership boolean;
    existing_org_id uuid;
BEGIN
    -- Check if user exists
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa'
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE NOTICE 'User does not exist in auth.users';
        RETURN;
    END IF;
    
    -- Check if user already has a membership
    SELECT EXISTS(
        SELECT 1 FROM organization_members WHERE user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa'
    ) INTO has_membership;
    
    IF has_membership THEN
        RAISE NOTICE 'User already has an organization membership';
        RETURN;
    END IF;
    
    -- Check if user already created an organization
    SELECT id INTO existing_org_id
    FROM organizations
    WHERE created_by = '271e7c40-74a1-464b-bfa4-78e7bf8376aa'
    LIMIT 1;
    
    IF existing_org_id IS NOT NULL THEN
        -- Link user to their existing organization
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (existing_org_id, '271e7c40-74a1-464b-bfa4-78e7bf8376aa', 'owner');
        
        RAISE NOTICE 'Linked user to existing organization: %', existing_org_id;
    ELSE
        -- Create new organization
        INSERT INTO organizations (name, created_by, trial_ends_at)
        VALUES (
            'Owner Organization', -- You can update this name later
            '271e7c40-74a1-464b-bfa4-78e7bf8376aa',
            now() + interval '7 days'
        )
        RETURNING id INTO new_org_id;
        
        -- Add user as owner
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (new_org_id, '271e7c40-74a1-464b-bfa4-78e7bf8376aa', 'owner');
        
        -- Create initial subscription record
        INSERT INTO organization_subscriptions (
            organization_id, 
            plan_id, 
            status, 
            trial_start,
            trial_end
        )
        VALUES (
            new_org_id, 
            'free', 
            'trialing',
            now(),
            now() + interval '7 days'
        );
        
        RAISE NOTICE 'Created new organization: %', new_org_id;
    END IF;
END $$;

-- Verify the fix
SELECT 
    om.*,
    o.name as org_name,
    o.trial_ends_at,
    os.status as subscription_status,
    os.plan_id
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
LEFT JOIN organization_subscriptions os ON os.organization_id = o.id
WHERE om.user_id = '271e7c40-74a1-464b-bfa4-78e7bf8376aa';