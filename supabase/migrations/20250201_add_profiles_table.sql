-- Create profiles table if it doesn't exist
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes
create index if not exists idx_profiles_email on profiles(email);

-- Enable RLS
alter table profiles enable row level security;

-- Create policies
create policy "Users can view all profiles in their organization" on profiles
    for select
    using (
        exists (
            select 1 from organization_members om1
            join organization_members om2 on om1.organization_id = om2.organization_id
            where om1.user_id = id
            and om2.user_id = auth.uid()
        )
    );

create policy "Users can update their own profile" on profiles
    for update
    using (id = auth.uid())
    with check (id = auth.uid());

-- Create function to automatically create profile on user signup
create or replace function handle_new_user() returns trigger as $$
begin
    insert into profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();

-- Function to update profile timestamp
create or replace function update_profile_updated_at() returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger for profile updates
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
    before update on profiles
    for each row
    execute function update_profile_updated_at();

-- Migrate existing users to profiles table
insert into profiles (id, email, full_name, avatar_url)
select 
    id,
    email,
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;