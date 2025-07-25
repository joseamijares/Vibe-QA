-- Drop existing policies for organization members
drop policy if exists "Owners can update member roles" on organization_members;
drop policy if exists "Owners can remove members" on organization_members;

-- Create new policies that allow both owners and admins to manage team
create policy "Owners and admins can update member roles"
    on organization_members for update
    using (
        get_user_role(organization_id, auth.uid()) in ('owner', 'admin')
        -- Prevent non-owners from changing owner role
        and (role != 'owner' or get_user_role(organization_id, auth.uid()) = 'owner')
    );

create policy "Owners and admins can remove members"
    on organization_members for delete
    using (
        get_user_role(organization_id, auth.uid()) in ('owner', 'admin')
        -- Prevent removing owners
        and role != 'owner'
    );

-- Add function to get member with user data
create or replace function get_organization_members(org_id uuid)
returns table (
    id uuid,
    organization_id uuid,
    user_id uuid,
    role user_role,
    joined_at timestamptz,
    user_email text,
    user_metadata jsonb
) as $$
begin
    return query
    select 
        om.id,
        om.organization_id,
        om.user_id,
        om.role,
        om.joined_at,
        au.email as user_email,
        au.raw_user_meta_data as user_metadata
    from organization_members om
    join auth.users au on au.id = om.user_id
    where om.organization_id = org_id
    and is_organization_member(org_id, auth.uid())
    order by om.joined_at asc;
end;
$$ language plpgsql security definer;