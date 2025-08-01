-- Test if the organization_trial_status view is accessible
-- This simulates what the client-side query would do

-- First, set the auth context to simulate the user
-- Replace the UUID with the actual user_id from the first query result
SET LOCAL "request.jwt.claims" = '{"sub": "271e7c40-74a1-464b-bfa4-78e7bf8376aa"}';

-- Now try to query the view as that user would
SELECT * FROM organization_trial_status
WHERE organization_id = 'b5cb5b0b-831f-4782-a894-81a9ccbd3976';

-- Also test if the underlying tables are accessible
SELECT 'Direct organization access' as test;
SELECT * FROM organizations
WHERE id = 'b5cb5b0b-831f-4782-a894-81a9ccbd3976';

SELECT 'Direct subscription access' as test;
SELECT * FROM organization_subscriptions
WHERE organization_id = 'b5cb5b0b-831f-4782-a894-81a9ccbd3976';

-- Test the functions directly
SELECT 'Direct function calls' as test;
SELECT 
  is_organization_in_trial('b5cb5b0b-831f-4782-a894-81a9ccbd3976') as is_in_trial,
  get_trial_days_remaining('b5cb5b0b-831f-4782-a894-81a9ccbd3976') as days_remaining;