-- Fix team member profile visibility
-- Allow users to see profiles of their team members

-- Drop the restrictive policy
drop policy if exists "Users can view profiles for feedback participants" on profiles;

-- Create a more appropriate policy for team collaboration
create policy "Users can view profiles of team members" on profiles
    for select
    using (
        -- User can see their own profile
        id = auth.uid()
        OR
        -- User can see profiles of users in the same organization
        exists (
            select 1 
            from organization_members om1
            join organization_members om2 on om1.organization_id = om2.organization_id
            where om1.user_id = auth.uid()
            and om2.user_id = profiles.id
        )
    );

-- Add index to improve performance
create index if not exists idx_organization_members_user_org 
    on organization_members(user_id, organization_id);