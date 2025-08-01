-- Verify Test Users Creation
-- Run this query to check if the test users were created successfully

-- Check users and their organizations
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    om.role as user_role,
    o.id as org_id,
    o.name as organization_name,
    o.slug as organization_slug
FROM auth.users u
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE u.email IN ('owner@example.com', 'member1@example.com', 'member2@example.com')
ORDER BY u.email;

-- Check projects created
SELECT 
    p.name as project_name,
    p.slug as project_slug,
    p.api_key,
    o.name as organization_name,
    COUNT(f.id) as feedback_count
FROM projects p
JOIN organizations o ON p.organization_id = o.id
LEFT JOIN feedback f ON f.project_id = p.id
WHERE o.name IN ('Test Organization', 'Member Organization')
GROUP BY p.id, p.name, p.slug, p.api_key, o.name
ORDER BY o.name, p.name;

-- Summary of what was created
SELECT 
    'Total Test Users' as metric,
    COUNT(DISTINCT u.id)::text as value
FROM auth.users u
WHERE u.email IN ('owner@example.com', 'member1@example.com', 'member2@example.com')

UNION ALL

SELECT 
    'Total Organizations' as metric,
    COUNT(DISTINCT o.id)::text as value
FROM organizations o
WHERE o.name IN ('Test Organization', 'Member Organization')

UNION ALL

SELECT 
    'Total Projects' as metric,
    COUNT(DISTINCT p.id)::text as value
FROM projects p
JOIN organizations o ON p.organization_id = o.id
WHERE o.name IN ('Test Organization', 'Member Organization')

UNION ALL

SELECT 
    'Total Feedback Items' as metric,
    COUNT(*)::text as value
FROM feedback f
JOIN projects p ON f.project_id = p.id
JOIN organizations o ON p.organization_id = o.id
WHERE o.name IN ('Test Organization', 'Member Organization');

-- Test user credentials reminder
SELECT '=== TEST USER CREDENTIALS ===' as info
UNION ALL
SELECT '1. owner@example.com - Password: TestPassword123! (Owner of Test Organization)'
UNION ALL
SELECT '2. member1@example.com - Password: TestPassword123! (Member in Test Organization)'
UNION ALL
SELECT '3. member2@example.com - Password: TestPassword123! (Owner of Member Organization)';