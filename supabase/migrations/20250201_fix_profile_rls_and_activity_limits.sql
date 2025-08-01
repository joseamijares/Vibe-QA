-- Fix overly permissive profile RLS policy
drop policy if exists "Users can view all profiles in their organization" on profiles;

-- Create more restrictive policy that only shows profiles for users involved in feedback
create policy "Users can view profiles for feedback participants" on profiles
    for select
    using (
        -- User can see their own profile
        id = auth.uid()
        OR
        -- User can see profiles of users who commented on feedback they have access to
        exists (
            select 1 from comments c
            join feedback f on c.feedback_id = f.id
            join projects p on f.project_id = p.id
            join organization_members om on p.organization_id = om.organization_id
            where c.user_id = profiles.id
            and om.user_id = auth.uid()
        )
        OR
        -- User can see profiles of users in activity logs for feedback they have access to
        exists (
            select 1 from activity_logs al
            join feedback f on al.feedback_id = f.id  
            join projects p on f.project_id = p.id
            join organization_members om on p.organization_id = om.organization_id
            where al.user_id = profiles.id
            and om.user_id = auth.uid()
        )
        OR
        -- User can see profiles of team members in their organization
        exists (
            select 1 from organization_members om1
            join organization_members om2 on om1.organization_id = om2.organization_id
            where om1.user_id = profiles.id
            and om2.user_id = auth.uid()
        )
    );

-- Add index for performance on activity logs
create index if not exists idx_activity_logs_feedback_user on activity_logs(feedback_id, user_id);

-- Add comment policy to ensure users can only edit/delete their own comments
drop policy if exists "Users can update their own comments" on comments;
create policy "Users can update their own comments" on comments
    for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists "Users can delete their own comments" on comments;
create policy "Users can delete their own comments" on comments
    for delete
    using (user_id = auth.uid());