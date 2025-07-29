-- ====================================
-- Cleanup Duplicate Organizations
-- ====================================
-- This script removes duplicate organizations for users who have multiple
-- It keeps the organization specified by name/slug and removes others

-- First, let's see what we have for the support user
SELECT 
    u.email,
    o.id as org_id,
    o.name as org_name,
    o.slug as org_slug,
    om.joined_at,
    (SELECT COUNT(*) FROM projects WHERE organization_id = o.id) as project_count,
    (SELECT COUNT(*) FROM feedback f JOIN projects p ON f.project_id = p.id WHERE p.organization_id = o.id) as feedback_count
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'support@vibeqa.app'
ORDER BY om.joined_at;

-- To delete the duplicate organizations (keeping only 'VibeQA Support')
-- UNCOMMENT AND RUN THE FOLLOWING AFTER REVIEWING THE ABOVE RESULTS:

/*
DO $$
DECLARE
    support_user_id uuid;
    keep_org_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO support_user_id 
    FROM auth.users 
    WHERE email = 'support@vibeqa.app'
    LIMIT 1;
    
    -- Get the organization we want to keep
    SELECT o.id INTO keep_org_id
    FROM organizations o
    JOIN organization_members om ON o.id = om.organization_id
    WHERE om.user_id = support_user_id
    AND o.slug = 'vibeqa-support'
    LIMIT 1;
    
    IF keep_org_id IS NOT NULL THEN
        -- Delete user from other organizations
        DELETE FROM organization_members
        WHERE user_id = support_user_id
        AND organization_id != keep_org_id;
        
        -- Delete organizations that now have no members
        DELETE FROM organizations o
        WHERE NOT EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = o.id
        )
        AND o.id != keep_org_id;
        
        RAISE NOTICE 'Cleanup complete. Kept organization: %', keep_org_id;
    ELSE
        RAISE NOTICE 'Could not find VibeQA Support organization';
    END IF;
END $$;
*/

-- Verify final state
SELECT 
    u.email,
    COUNT(om.organization_id) as org_count,
    STRING_AGG(o.name, ', ' ORDER BY om.joined_at) as organizations
FROM auth.users u
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'support@vibeqa.app'
GROUP BY u.email;