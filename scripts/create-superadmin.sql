-- Generic script to create a superadmin user
-- This assumes the user already exists in auth.users
-- Replace 'YOUR_EMAIL_HERE' with the actual email address

DO $$
DECLARE
    v_user_email text := 'YOUR_EMAIL_HERE'; -- CHANGE THIS
    v_user_id uuid;
    v_org_id uuid;
    v_org_name text;
    v_org_slug text;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found. Please create the user in Supabase Auth first.', v_user_email;
    END IF;
    
    -- Generate org details
    v_org_name := split_part(v_user_email, '@', 1) || ' Support';
    v_org_slug := lower(regexp_replace(split_part(v_user_email, '@', 1), '[^a-z0-9]', '-', 'g')) || '-support-' || extract(epoch from now())::text;
    
    -- Create organization
    INSERT INTO organizations (name, slug, settings)
    VALUES (
        v_org_name,
        v_org_slug,
        jsonb_build_object('is_internal', true)
    )
    RETURNING id INTO v_org_id;
    
    -- Add user as superadmin
    INSERT INTO organization_members (
        organization_id, 
        user_id, 
        role,
        email_notifications
    ) VALUES (
        v_org_id, 
        v_user_id, 
        'superadmin',
        jsonb_build_object(
            'feedback', true,
            'team_updates', true,
            'billing', true
        )
    );
    
    -- Create enterprise subscription
    INSERT INTO organization_subscriptions (
        organization_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        stripe_customer_id,
        stripe_subscription_id
    ) VALUES (
        v_org_id,
        'enterprise',
        'active',
        now(),
        now() + interval '100 years',
        'cus_superadmin_' || v_org_id::text,
        'sub_superadmin_' || v_org_id::text
    );
    
    -- Log the activity
    INSERT INTO activity_logs (
        organization_id, 
        user_id, 
        action, 
        resource_type, 
        resource_id
    ) VALUES (
        v_org_id, 
        v_user_id, 
        'superadmin_created', 
        'user', 
        v_user_id
    );
    
    RAISE NOTICE 'Superadmin created successfully!';
    RAISE NOTICE 'User: %', v_user_email;
    RAISE NOTICE 'Organization: %', v_org_name;
    RAISE NOTICE 'Role: superadmin';
END $$;