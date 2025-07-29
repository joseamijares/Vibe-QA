-- Function to handle new user registration
-- This automatically creates an organization and assigns the user as owner
create or replace function handle_new_user()
returns trigger as $$
declare
  org_name text;
  org_slug text;
  new_org_id uuid;
begin
  -- Generate organization name and slug from email
  org_name := split_part(new.email, '@', 1) || '''s Organization';
  org_slug := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || extract(epoch from now())::text;
  
  -- Create organization
  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;
  
  -- Add user as owner of the organization
  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');
  
  -- Log the activity
  insert into public.activity_logs (organization_id, user_id, action, resource_type, resource_id)
  values (new_org_id, new.id, 'user_registered', 'user', new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signups
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Function to ensure existing users have organizations
-- This is a one-time cleanup function for users who registered before the trigger
create or replace function ensure_all_users_have_organizations()
returns void as $$
declare
  user_record record;
  org_name text;
  org_slug text;
  new_org_id uuid;
begin
  -- Find users without organizations
  for user_record in 
    select u.id, u.email 
    from auth.users u
    left join public.organization_members om on u.id = om.user_id
    where om.id is null
  loop
    -- Generate organization details
    org_name := split_part(user_record.email, '@', 1) || '''s Organization';
    org_slug := lower(regexp_replace(split_part(user_record.email, '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || extract(epoch from now())::text;
    
    -- Create organization
    insert into public.organizations (name, slug)
    values (org_name, org_slug)
    returning id into new_org_id;
    
    -- Add user as owner
    insert into public.organization_members (organization_id, user_id, role)
    values (new_org_id, user_record.id, 'owner');
    
    -- Log the activity
    insert into public.activity_logs (organization_id, user_id, action, resource_type, resource_id)
    values (new_org_id, user_record.id, 'organization_created_retroactively', 'organization', new_org_id);
  end loop;
end;
$$ language plpgsql security definer;

-- Run the cleanup function to ensure all existing users have organizations
select ensure_all_users_have_organizations();

-- Add a check constraint to ensure organization_members always has a role
alter table organization_members
drop constraint if exists organization_members_role_check;

alter table organization_members
add constraint organization_members_role_check
check (role is not null);

-- Create an index to improve performance of user organization lookups
create index if not exists idx_organization_members_user_role 
on organization_members(user_id, role);

-- Grant necessary permissions for the trigger function
grant usage on schema public to postgres, authenticated;
grant all on all tables in schema public to postgres, authenticated;
grant all on all sequences in schema public to postgres, authenticated;