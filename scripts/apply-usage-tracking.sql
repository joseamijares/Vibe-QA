-- Check if the functions already exist and create them if they don't

-- Function to check if organization can create more projects
DROP FUNCTION IF EXISTS can_create_project(uuid);
CREATE OR REPLACE FUNCTION can_create_project(org_id uuid)
RETURNS boolean AS $$
DECLARE
    current_count integer;
    plan_limit integer;
BEGIN
    -- Get current project count
    SELECT count(*) INTO current_count 
    FROM public.projects 
    WHERE organization_id = org_id;
    
    -- Get plan limit
    SELECT (sp.limits->>'projects')::integer INTO plan_limit
    FROM public.organizations o
    LEFT JOIN public.subscription_plans sp ON sp.id = COALESCE(
        (SELECT plan_id FROM public.organization_subscriptions WHERE organization_id = o.id),
        o.subscription_plan_id,
        'free'
    )
    WHERE o.id = org_id;
    
    -- -1 means unlimited
    IF plan_limit = -1 THEN
        RETURN true;
    END IF;
    
    RETURN current_count < plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if organization can submit more feedback
DROP FUNCTION IF EXISTS can_submit_feedback(uuid);
CREATE OR REPLACE FUNCTION can_submit_feedback(org_id uuid)
RETURNS boolean AS $$
DECLARE
    current_count integer;
    plan_limit integer;
BEGIN
    -- Get current month's feedback count
    SELECT COALESCE(feedback_count, 0) INTO current_count
    FROM public.organization_usage
    WHERE organization_id = org_id 
    AND month = date_trunc('month', now())::date;
    
    -- Get plan limit
    SELECT (sp.limits->>'feedbackPerMonth')::integer INTO plan_limit
    FROM public.organizations o
    LEFT JOIN public.subscription_plans sp ON sp.id = COALESCE(
        (SELECT plan_id FROM public.organization_subscriptions WHERE organization_id = o.id),
        o.subscription_plan_id,
        'free'
    )
    WHERE o.id = org_id;
    
    -- -1 means unlimited
    IF plan_limit = -1 THEN
        RETURN true;
    END IF;
    
    RETURN current_count < plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization usage limits
DROP FUNCTION IF EXISTS get_organization_limits(uuid);
CREATE OR REPLACE FUNCTION get_organization_limits(org_id uuid)
RETURNS TABLE (
    plan_id text,
    project_limit integer,
    feedback_limit integer,
    team_member_limit integer,
    storage_limit_gb integer,
    current_projects integer,
    current_feedback integer,
    current_team_members integer,
    current_storage_gb numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            (SELECT plan_id FROM public.organization_subscriptions WHERE organization_id = org_id),
            o.subscription_plan_id,
            'free'
        ) AS plan_id,
        (sp.limits->>'projects')::integer AS project_limit,
        (sp.limits->>'feedbackPerMonth')::integer AS feedback_limit,
        (sp.limits->>'teamMembers')::integer AS team_member_limit,
        (sp.limits->>'storageGB')::integer AS storage_limit_gb,
        (SELECT count(*)::integer FROM public.projects WHERE organization_id = org_id) AS current_projects,
        COALESCE((SELECT feedback_count FROM public.organization_usage WHERE organization_id = org_id AND month = date_trunc('month', now())::date), 0) AS current_feedback,
        (SELECT count(*)::integer FROM public.organization_members WHERE organization_id = org_id) AS current_team_members,
        COALESCE(
            (SELECT round((storage_bytes::numeric / 1073741824)::numeric, 2) 
             FROM public.organization_usage 
             WHERE organization_id = org_id 
             AND month = date_trunc('month', now())::date), 
            0
        ) AS current_storage_gb
    FROM public.organizations o
    LEFT JOIN public.subscription_plans sp ON sp.id = COALESCE(
        (SELECT plan_id FROM public.organization_subscriptions WHERE organization_id = o.id),
        o.subscription_plan_id,
        'free'
    )
    WHERE o.id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_create_project TO authenticated;
GRANT EXECUTE ON FUNCTION can_submit_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_limits TO authenticated;

-- Add project_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organization_usage' 
                   AND column_name = 'project_count') THEN
        ALTER TABLE public.organization_usage ADD COLUMN project_count integer DEFAULT 0;
    END IF;
END $$;