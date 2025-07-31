-- Setup support@vibeqa.app as superadmin with enterprise subscription
-- Run this after the 011_superadmin.sql migration
-- FIXED VERSION: Removed references to non-existent columns

DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_existing_org_id uuid;
    v_existing_membership record;
    v_subscription_id uuid;
BEGIN
    -- Step 1: Get user ID for support@vibeqa.app
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'support@vibeqa.app';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User support@vibeqa.app not found. Please create the user first.';
    END IF;
    
    -- Step 2: Check if VibeQA Support organization exists
    SELECT id INTO v_existing_org_id
    FROM organizations
    WHERE slug = 'vibeqa-support';
    
    IF v_existing_org_id IS NOT NULL THEN
        v_org_id := v_existing_org_id;
        RAISE NOTICE 'Using existing VibeQA Support organization';
    ELSE
        -- Create VibeQA Support organization
        INSERT INTO organizations (
            name, 
            slug, 
            settings
        ) VALUES (
            'VibeQA Support',
            'vibeqa-support',
            jsonb_build_object(
                'is_internal', true,
                'created_by', 'system'
            )
        ) RETURNING id INTO v_org_id;
        
        RAISE NOTICE 'Created VibeQA Support organization';
    END IF;
    
    -- Step 3: Check existing membership
    SELECT * INTO v_existing_membership
    FROM organization_members
    WHERE user_id = v_user_id
    AND organization_id = v_org_id;
    
    IF v_existing_membership.id IS NOT NULL THEN
        -- Update existing membership to superadmin (removed updated_at)
        UPDATE organization_members
        SET role = 'superadmin'
        WHERE id = v_existing_membership.id;
        
        RAISE NOTICE 'Updated existing membership to superadmin';
    ELSE
        -- Create new membership as superadmin (removed email_notifications)
        INSERT INTO organization_members (
            organization_id, 
            user_id, 
            role
        ) VALUES (
            v_org_id, 
            v_user_id, 
            'superadmin'
        );
        
        RAISE NOTICE 'Created superadmin membership';
    END IF;
    
    -- Step 4: Set up enterprise subscription
    -- Check if subscription already exists
    SELECT id INTO v_subscription_id
    FROM organization_subscriptions
    WHERE organization_id = v_org_id;
    
    IF v_subscription_id IS NOT NULL THEN
        -- Update existing subscription to enterprise
        UPDATE organization_subscriptions
        SET plan_id = 'enterprise',
            status = 'active',
            current_period_start = now(),
            current_period_end = now() + interval '100 years', -- Never expires
            cancel_at = NULL,
            canceled_at = NULL,
            stripe_customer_id = 'cus_superadmin_' || v_org_id::text,
            stripe_subscription_id = 'sub_superadmin_' || v_org_id::text,
            updated_at = now()
        WHERE id = v_subscription_id;
        
        RAISE NOTICE 'Updated subscription to enterprise plan';
    ELSE
        -- Create new enterprise subscription
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
            now() + interval '100 years', -- Never expires
            'cus_superadmin_' || v_org_id::text,
            'sub_superadmin_' || v_org_id::text
        ) RETURNING id INTO v_subscription_id;
        
        RAISE NOTICE 'Created enterprise subscription';
    END IF;
    
    -- Step 5: Create internal testing project
    IF NOT EXISTS (
        SELECT 1 FROM projects 
        WHERE organization_id = v_org_id 
        AND slug = 'internal-testing'
    ) THEN
        INSERT INTO projects (
            organization_id,
            name,
            slug,
            description,
            settings,
            api_key
        ) VALUES (
            v_org_id,
            'Internal Testing',
            'internal-testing',
            'Internal project for testing and support purposes',
            jsonb_build_object(
                'allow_anonymous', true,
                'allowed_domains', jsonb_build_array('*'),
                'features', jsonb_build_object(
                    'screenshots', true,
                    'voice', true,
                    'text', true
                )
            ),
            'proj_' || encode(gen_random_bytes(16), 'hex')
        );
        
        RAISE NOTICE 'Created internal testing project';
    END IF;
    
    -- Step 6: Log the activity
    INSERT INTO activity_logs (
        organization_id, 
        user_id, 
        action, 
        resource_type, 
        resource_id,
        metadata
    ) VALUES (
        v_org_id, 
        v_user_id, 
        'superadmin_setup_completed', 
        'user', 
        v_user_id,
        jsonb_build_object(
            'setup_date', now(),
            'subscription_id', v_subscription_id,
            'plan', 'enterprise'
        )
    );
    
    RAISE NOTICE 'Superadmin setup completed successfully!';
    RAISE NOTICE 'User: support@vibeqa.app';
    RAISE NOTICE 'Role: superadmin';
    RAISE NOTICE 'Organization: VibeQA Support';
    RAISE NOTICE 'Subscription: Enterprise (unlimited)';
END $$;

-- Verify the setup
SELECT 
    u.email,
    om.role,
    o.name as organization,
    o.slug as org_slug,
    os.plan_id,
    os.status as subscription_status,
    os.current_period_end
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
LEFT JOIN organization_subscriptions os ON o.id = os.organization_id
WHERE u.email = 'support@vibeqa.app';