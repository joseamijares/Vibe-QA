# Creating Test Users for Billing

This guide explains how to create test users with different subscription plans for testing billing functionality in VibeQA.

## Prerequisites

- Access to Supabase Dashboard
- Database connection (via SQL Editor)
- Stripe test mode configured

## Test User Scenarios

### 1. Free Plan User

Create a user with the default free plan:

```sql
-- Step 1: Create user in Supabase Auth Dashboard
-- Email: test-free@example.com
-- Password: (set a secure password)

-- Step 2: Run this SQL after user creation
DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'test-free@example.com';
    
    -- Create organization
    INSERT INTO organizations (name, slug)
    VALUES ('Test Free Organization', 'test-free-org-' || extract(epoch from now())::text)
    RETURNING id INTO v_org_id;
    
    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');
    
    -- Free plan is default, no subscription record needed
    
    RAISE NOTICE 'Free plan user created successfully!';
END $$;
```

### 2. Basic Plan User ($5/month)

Create a user with an active basic subscription:

```sql
-- Step 1: Create user in Supabase Auth Dashboard
-- Email: test-basic@example.com
-- Password: (set a secure password)

-- Step 2: Run this SQL after user creation
DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'test-basic@example.com';
    
    -- Create organization
    INSERT INTO organizations (name, slug)
    VALUES ('Test Basic Organization', 'test-basic-org-' || extract(epoch from now())::text)
    RETURNING id INTO v_org_id;
    
    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');
    
    -- Create basic subscription
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
        'basic',
        'active',
        now(),
        now() + interval '30 days',
        'cus_test_basic_' || v_org_id::text,
        'sub_test_basic_' || v_org_id::text
    );
    
    RAISE NOTICE 'Basic plan user created successfully!';
END $$;
```

### 3. Full Plan User ($14/month)

Create a user with an active full subscription:

```sql
-- Step 1: Create user in Supabase Auth Dashboard
-- Email: test-full@example.com
-- Password: (set a secure password)

-- Step 2: Run this SQL after user creation
DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'test-full@example.com';
    
    -- Create organization
    INSERT INTO organizations (name, slug)
    VALUES ('Test Full Organization', 'test-full-org-' || extract(epoch from now())::text)
    RETURNING id INTO v_org_id;
    
    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');
    
    -- Create full subscription
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
        'full',
        'active',
        now(),
        now() + interval '30 days',
        'cus_test_full_' || v_org_id::text,
        'sub_test_full_' || v_org_id::text
    );
    
    RAISE NOTICE 'Full plan user created successfully!';
END $$;
```

### 4. User with Canceled Subscription

Create a user with a subscription that will cancel at period end:

```sql
-- Step 1: Create user in Supabase Auth Dashboard
-- Email: test-canceled@example.com
-- Password: (set a secure password)

-- Step 2: Run this SQL after user creation
DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_cancel_date timestamp;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'test-canceled@example.com';
    
    -- Create organization
    INSERT INTO organizations (name, slug)
    VALUES ('Test Canceled Organization', 'test-canceled-org-' || extract(epoch from now())::text)
    RETURNING id INTO v_org_id;
    
    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');
    
    -- Set cancel date to 10 days from now
    v_cancel_date := now() + interval '10 days';
    
    -- Create subscription that will cancel
    INSERT INTO organization_subscriptions (
        organization_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at,
        stripe_customer_id,
        stripe_subscription_id
    ) VALUES (
        v_org_id,
        'basic',
        'active',
        now() - interval '20 days',
        v_cancel_date,
        v_cancel_date,
        'cus_test_canceled_' || v_org_id::text,
        'sub_test_canceled_' || v_org_id::text
    );
    
    RAISE NOTICE 'Canceled subscription user created successfully!';
    RAISE NOTICE 'Subscription will end on: %', v_cancel_date;
END $$;
```

### 5. User Near Usage Limits

Create a user approaching their plan limits:

```sql
-- Step 1: Create user in Supabase Auth Dashboard
-- Email: test-limits@example.com
-- Password: (set a secure password)

-- Step 2: Run this SQL after user creation
DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_project_id uuid;
    i integer;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'test-limits@example.com';
    
    -- Create organization
    INSERT INTO organizations (name, slug)
    VALUES ('Test Limits Organization', 'test-limits-org-' || extract(epoch from now())::text)
    RETURNING id INTO v_org_id;
    
    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');
    
    -- Create basic subscription (3 projects limit)
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
        'basic',
        'active',
        now(),
        now() + interval '30 days',
        'cus_test_limits_' || v_org_id::text,
        'sub_test_limits_' || v_org_id::text
    );
    
    -- Create 2 projects (near the 3 project limit)
    FOR i IN 1..2 LOOP
        INSERT INTO projects (
            organization_id,
            name,
            slug,
            description
        ) VALUES (
            v_org_id,
            'Test Project ' || i,
            'test-project-' || i || '-' || extract(epoch from now())::text,
            'Project for testing limits'
        );
    END LOOP;
    
    -- Create feedback entries to approach monthly limit
    -- Basic plan has 500 feedback/month limit
    SELECT id INTO v_project_id FROM projects WHERE organization_id = v_org_id LIMIT 1;
    
    -- Add 450 feedback entries (90% of limit)
    FOR i IN 1..450 LOOP
        INSERT INTO feedback (
            project_id,
            type,
            message,
            metadata
        ) VALUES (
            v_project_id,
            'text',
            'Test feedback ' || i,
            jsonb_build_object('test', true)
        );
    END LOOP;
    
    RAISE NOTICE 'User near limits created successfully!';
    RAISE NOTICE 'Projects: 2/3, Feedback: 450/500';
END $$;
```

## Quick Test User Creation Script

For rapid testing, here's a script that creates multiple test users at once:

```bash
#!/bin/bash
# save as scripts/create-all-test-users.sh

echo "Creating test users..."

# Array of test users
declare -a users=(
    "test-free@example.com:password123:free"
    "test-basic@example.com:password123:basic"
    "test-full@example.com:password123:full"
    "test-canceled@example.com:password123:canceled"
    "test-limits@example.com:password123:limits"
)

# Create each user
for user_data in "${users[@]}"; do
    IFS=':' read -r email password type <<< "$user_data"
    echo "Creating $type user: $email"
    
    # You would need to implement the user creation via Supabase Admin API
    # Then run the appropriate SQL script for each type
done

echo "Test users created!"
```

## Testing Different Scenarios

### 1. **Upgrade Flow**
- Login as `test-free@example.com`
- Navigate to billing page
- Test upgrade to Basic or Full plan

### 2. **Downgrade Flow**
- Login as `test-full@example.com`
- Test downgrading to Basic plan
- Verify feature restrictions

### 3. **Usage Limits**
- Login as `test-limits@example.com`
- Try creating a 3rd project (should hit limit)
- Check feedback count warnings

### 4. **Cancellation**
- Login as `test-canceled@example.com`
- View cancellation notice
- Test reactivation

### 5. **Superadmin Access**
- Login as `support@vibeqa.app`
- Verify unlimited access
- Test viewing all organizations

## Stripe Test Cards

When testing payment flows, use these Stripe test cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

Use any future expiry date and any 3-digit CVC.

## Cleanup

To remove test users and their data:

```sql
-- Remove all test users and their organizations
DO $$
DECLARE
    test_user record;
    org_id uuid;
BEGIN
    -- Find all test users
    FOR test_user IN 
        SELECT id, email FROM auth.users 
        WHERE email LIKE 'test-%@example.com'
    LOOP
        -- Get their organizations
        FOR org_id IN 
            SELECT organization_id FROM organization_members 
            WHERE user_id = test_user.id
        LOOP
            -- Delete organization (cascades to all related data)
            DELETE FROM organizations WHERE id = org_id;
        END LOOP;
        
        -- Note: You cannot delete auth.users from SQL
        -- Use Supabase Dashboard to delete the user
        RAISE NOTICE 'Cleaned up data for: %', test_user.email;
    END LOOP;
END $$;
```

## Notes

- All test subscriptions use fake Stripe IDs (prefixed with `test_`)
- These won't sync with actual Stripe, they're for UI testing only
- For full integration testing, use Stripe test mode with real API calls
- Remember to use test Stripe keys in development