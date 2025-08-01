-- Test script to verify usage limit enforcement

-- 1. Create a test organization with Basic plan (500 feedback/month limit)
do $$
declare
    test_org_id uuid;
    test_project_id uuid;
    test_user_id uuid;
begin
    -- Create test user
    test_user_id := gen_random_uuid();
    
    -- Create test organization with Basic plan
    insert into public.organizations (id, name, slug, subscription_plan_id)
    values (gen_random_uuid(), 'Test Limit Org', 'test-limit-org', 'basic')
    returning id into test_org_id;
    
    -- Create a test project
    insert into public.projects (id, organization_id, name, slug, api_key)
    values (gen_random_uuid(), test_org_id, 'Test Project', 'test-project', 'test_api_key_123')
    returning id into test_project_id;
    
    -- Simulate feedback count near limit (499 out of 500)
    insert into public.organization_usage (organization_id, month, feedback_count)
    values (test_org_id, date_trunc('month', now())::date, 499)
    on conflict (organization_id, month)
    do update set feedback_count = 499;
    
    -- Test 1: Check if we can submit feedback (should return true - under limit)
    raise notice 'Test 1 - Can submit at 499/500: %', can_submit_feedback(test_org_id);
    
    -- Add one more feedback to reach limit
    update public.organization_usage
    set feedback_count = 500
    where organization_id = test_org_id and month = date_trunc('month', now())::date;
    
    -- Test 2: Check if we can submit feedback (should return false - at limit)
    raise notice 'Test 2 - Can submit at 500/500: %', can_submit_feedback(test_org_id);
    
    -- Test 3: Test project limit for Basic plan (3 projects)
    -- Create 2 more projects (total will be 3)
    insert into public.projects (organization_id, name, slug, api_key)
    values 
        (test_org_id, 'Test Project 2', 'test-project-2', 'test_api_key_456'),
        (test_org_id, 'Test Project 3', 'test-project-3', 'test_api_key_789');
    
    -- Check if we can create more projects (should return false - at limit)
    raise notice 'Test 3 - Can create project at 3/3: %', can_create_project(test_org_id);
    
    -- Test 4: Check organization limits
    raise notice 'Test 4 - Organization limits:';
    for r in select * from get_organization_limits(test_org_id) loop
        raise notice '  Plan: %, Project limit: %, Current projects: %', r.plan_id, r.project_limit, r.current_projects;
        raise notice '  Feedback limit: %, Current feedback: %', r.feedback_limit, r.current_feedback;
    end loop;
    
    -- Clean up test data
    delete from public.feedback where project_id = test_project_id;
    delete from public.projects where organization_id = test_org_id;
    delete from public.organization_usage where organization_id = test_org_id;
    delete from public.organizations where id = test_org_id;
    
    raise notice 'Test completed and cleaned up successfully';
end $$;

-- Test feedback count increment trigger
do $$
declare
    test_org_id uuid;
    test_project_id uuid;
    initial_count integer;
    final_count integer;
begin
    -- Create test organization
    insert into public.organizations (id, name, slug, subscription_plan_id)
    values (gen_random_uuid(), 'Test Trigger Org', 'test-trigger-org', 'free')
    returning id into test_org_id;
    
    -- Create test project
    insert into public.projects (id, organization_id, name, slug, api_key)
    values (gen_random_uuid(), test_org_id, 'Test Project', 'test-trigger-project', 'test_trigger_key')
    returning id into test_project_id;
    
    -- Get initial count (should be null or 0)
    select coalesce(feedback_count, 0) into initial_count
    from public.organization_usage
    where organization_id = test_org_id and month = date_trunc('month', now())::date;
    
    raise notice 'Initial feedback count: %', initial_count;
    
    -- Insert feedback (trigger should increment count)
    insert into public.feedback (project_id, type, title, description, status, priority)
    values (test_project_id, 'bug', 'Test Bug', 'Test description', 'new', 'medium');
    
    -- Get final count (should be initial + 1)
    select feedback_count into final_count
    from public.organization_usage
    where organization_id = test_org_id and month = date_trunc('month', now())::date;
    
    raise notice 'Final feedback count: %', final_count;
    raise notice 'Trigger working: %', (final_count = initial_count + 1);
    
    -- Clean up
    delete from public.feedback where project_id = test_project_id;
    delete from public.projects where organization_id = test_org_id;
    delete from public.organization_usage where organization_id = test_org_id;
    delete from public.organizations where id = test_org_id;
end $$;