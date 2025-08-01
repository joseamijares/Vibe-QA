-- Create activity_logs table if it doesn't exist
create table if not exists activity_logs (
    id uuid primary key default uuid_generate_v4(),
    feedback_id uuid references feedback(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    action text not null,
    details jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for performance
create index if not exists idx_activity_logs_feedback_id on activity_logs(feedback_id);
create index if not exists idx_activity_logs_created_at on activity_logs(created_at);

-- RLS policies for activity_logs
alter table activity_logs enable row level security;

create policy "Users can view activity logs for their organization's feedback" on activity_logs
    for select
    using (
        exists (
            select 1 from feedback f
            join projects p on f.project_id = p.id
            join organization_members om on p.organization_id = om.organization_id
            where f.id = activity_logs.feedback_id
            and om.user_id = auth.uid()
        )
    );

-- Function to log activity
create or replace function log_feedback_activity(
    p_feedback_id uuid,
    p_user_id uuid,
    p_action text,
    p_details jsonb default '{}'::jsonb
) returns void as $$
begin
    insert into activity_logs (feedback_id, user_id, action, details)
    values (p_feedback_id, p_user_id, p_action, p_details);
end;
$$ language plpgsql security definer;

-- Trigger function for status changes
create or replace function track_feedback_status_change() returns trigger as $$
begin
    if (TG_OP = 'UPDATE' and old.status is distinct from new.status) then
        perform log_feedback_activity(
            new.id,
            auth.uid(),
            'status_changed',
            jsonb_build_object(
                'old_status', old.status,
                'new_status', new.status,
                'changed_at', now()
            )
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger function for assignment changes
create or replace function track_feedback_assignment_change() returns trigger as $$
begin
    if (TG_OP = 'UPDATE' and old.assigned_to is distinct from new.assigned_to) then
        perform log_feedback_activity(
            new.id,
            auth.uid(),
            'assignment_changed',
            jsonb_build_object(
                'old_assignee', old.assigned_to,
                'new_assignee', new.assigned_to,
                'changed_at', now()
            )
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger function for priority changes
create or replace function track_feedback_priority_change() returns trigger as $$
begin
    if (TG_OP = 'UPDATE' and old.priority is distinct from new.priority) then
        perform log_feedback_activity(
            new.id,
            auth.uid(),
            'priority_changed',
            jsonb_build_object(
                'old_priority', old.priority,
                'new_priority', new.priority,
                'changed_at', now()
            )
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger function for resolution
create or replace function track_feedback_resolution() returns trigger as $$
begin
    if (TG_OP = 'UPDATE' and old.resolved_at is null and new.resolved_at is not null) then
        perform log_feedback_activity(
            new.id,
            new.resolved_by,
            'resolved',
            jsonb_build_object(
                'resolved_at', new.resolved_at,
                'resolution_time_hours', extract(epoch from (new.resolved_at - new.created_at)) / 3600
            )
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger function for comment additions
create or replace function track_comment_addition() returns trigger as $$
begin
    if (TG_OP = 'INSERT') then
        perform log_feedback_activity(
            new.feedback_id,
            new.user_id,
            'comment_added',
            jsonb_build_object(
                'comment_id', new.id,
                'is_internal', new.is_internal,
                'created_at', new.created_at
            )
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Create triggers
drop trigger if exists track_feedback_status on feedback;
create trigger track_feedback_status
    after update on feedback
    for each row
    execute function track_feedback_status_change();

drop trigger if exists track_feedback_assignment on feedback;
create trigger track_feedback_assignment
    after update on feedback
    for each row
    execute function track_feedback_assignment_change();

drop trigger if exists track_feedback_priority on feedback;
create trigger track_feedback_priority
    after update on feedback
    for each row
    execute function track_feedback_priority_change();

drop trigger if exists track_feedback_resolution on feedback;
create trigger track_feedback_resolution
    after update on feedback
    for each row
    execute function track_feedback_resolution();

drop trigger if exists track_comment_addition on comments;
create trigger track_comment_addition
    after insert on comments
    for each row
    execute function track_comment_addition();

-- Grant permissions
grant select on activity_logs to authenticated;
grant execute on function log_feedback_activity to authenticated;