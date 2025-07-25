-- Create storage buckets for feedback media
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
    (
        'feedback-media',
        'feedback-media',
        false,
        52428800, -- 50MB limit
        array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mp3', 'audio/wav']
    ),
    (
        'organization-assets',
        'organization-assets',
        false,
        5242880, -- 5MB limit
        array['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
    );

-- Storage policies for feedback-media bucket
create policy "Users can upload feedback media"
    on storage.objects for insert
    with check (
        bucket_id = 'feedback-media'
        and (
            -- Allow anonymous uploads for feedback (will be validated by API key)
            auth.uid() is null
            or
            -- Allow authenticated users from the organization
            exists (
                select 1 from feedback
                join projects on projects.id = feedback.project_id
                where feedback.id = (storage.foldername(name)::uuid)
                and is_organization_member(projects.organization_id, auth.uid())
            )
        )
    );

create policy "Users can view feedback media from their organizations"
    on storage.objects for select
    using (
        bucket_id = 'feedback-media'
        and exists (
            select 1 from feedback
            join projects on projects.id = feedback.project_id
            where feedback.id = (storage.foldername(name)::uuid)
            and is_organization_member(projects.organization_id, auth.uid())
        )
    );

create policy "Users can delete feedback media from their organizations"
    on storage.objects for delete
    using (
        bucket_id = 'feedback-media'
        and exists (
            select 1 from feedback
            join projects on projects.id = feedback.project_id
            where feedback.id = (storage.foldername(name)::uuid)
            and is_organization_member(projects.organization_id, auth.uid())
            and get_user_role(projects.organization_id, auth.uid()) in ('owner', 'admin')
        )
    );

-- Storage policies for organization-assets bucket
create policy "Organization members can upload assets"
    on storage.objects for insert
    with check (
        bucket_id = 'organization-assets'
        and is_organization_member((storage.foldername(name)::uuid), auth.uid())
        and get_user_role((storage.foldername(name)::uuid), auth.uid()) in ('owner', 'admin')
    );

create policy "Organization members can view assets"
    on storage.objects for select
    using (
        bucket_id = 'organization-assets'
        and is_organization_member((storage.foldername(name)::uuid), auth.uid())
    );

create policy "Organization owners can delete assets"
    on storage.objects for delete
    using (
        bucket_id = 'organization-assets'
        and get_user_role((storage.foldername(name)::uuid), auth.uid()) = 'owner'
    );

-- Function to clean up old feedback media (retention policy)
create or replace function cleanup_old_feedback_media()
returns void as $$
begin
    -- Delete feedback media older than 90 days for resolved feedback
    delete from feedback_media
    where feedback_id in (
        select id from feedback
        where status = 'resolved'
        and resolved_at < now() - interval '90 days'
    );
end;
$$ language plpgsql security definer;

-- Create a function to get storage URLs with expiration
create or replace function get_media_url(bucket text, path text, expires_in integer default 3600)
returns text as $$
declare
    url text;
begin
    -- This will be replaced with actual Supabase storage URL generation
    -- For now, return a placeholder
    url := format('https://your-project.supabase.co/storage/v1/object/sign/%s/%s?token=temp&expires_in=%s', 
                  bucket, path, expires_in);
    return url;
end;
$$ language plpgsql security definer;