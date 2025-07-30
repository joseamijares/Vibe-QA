-- Subscription Management Tables

-- Subscription plans (mirrors Stripe products)
create table if not exists public.subscription_plans (
    id text primary key,
    name text not null,
    description text,
    price_monthly integer, -- in cents
    price_yearly integer, -- in cents
    stripe_price_id_monthly text,
    stripe_price_id_yearly text,
    features jsonb default '[]'::jsonb,
    limits jsonb default '{}'::jsonb,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Insert default plans FIRST (before any foreign key references)
insert into public.subscription_plans (id, name, description, price_monthly, features, limits) values
    ('free', 'Free', 'Perfect for trying out VibeQA', 0, 
     '["1 project", "100 feedback per month", "Basic support", "Screenshot capture", "7-day data retention"]'::jsonb,
     '{"projects": 1, "feedbackPerMonth": 100, "teamMembers": 2, "storageGB": 1}'::jsonb),
    ('starter', 'Starter', 'Great for small teams', 900,
     '["3 projects", "1,000 feedback per month", "Priority support", "All feedback types", "30-day data retention", "Email notifications", "Basic analytics"]'::jsonb,
     '{"projects": 3, "feedbackPerMonth": 1000, "teamMembers": 5, "storageGB": 5}'::jsonb),
    ('pro', 'Pro', 'For growing teams', 1900,
     '["10 projects", "10,000 feedback per month", "Premium support", "All feedback types", "Unlimited data retention", "Advanced analytics", "Slack integration", "Custom branding", "API access"]'::jsonb,
     '{"projects": 10, "feedbackPerMonth": 10000, "teamMembers": 20, "storageGB": 20}'::jsonb),
    ('enterprise', 'Enterprise', 'Custom solutions for large organizations', null,
     '["Unlimited projects", "Unlimited feedback", "Dedicated support", "All features", "Custom integrations", "SSO/SAML", "SLA guarantee", "White-label options", "Advanced security"]'::jsonb,
     '{"projects": -1, "feedbackPerMonth": -1, "teamMembers": -1, "storageGB": -1}'::jsonb)
on conflict (id) do nothing;

-- Organization subscriptions
create table if not exists public.organization_subscriptions (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    stripe_customer_id text unique,
    stripe_subscription_id text unique,
    plan_id text references public.subscription_plans(id),
    status text not null default 'trialing', -- trialing, active, past_due, canceled, incomplete
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at timestamp with time zone,
    canceled_at timestamp with time zone,
    trial_end timestamp with time zone,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(organization_id)
);

-- Usage tracking
create table if not exists public.organization_usage (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    month date not null, -- First day of the month
    feedback_count integer default 0,
    storage_bytes bigint default 0,
    api_calls integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(organization_id, month)
);

-- Payment methods
create table if not exists public.payment_methods (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    stripe_payment_method_id text unique not null,
    type text not null, -- card, bank_account, etc
    last4 text,
    brand text, -- visa, mastercard, etc
    exp_month integer,
    exp_year integer,
    is_default boolean default false,
    created_at timestamp with time zone default now()
);

-- Invoices (mirror of Stripe invoices for quick access)
create table if not exists public.invoices (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    stripe_invoice_id text unique not null,
    amount_paid integer, -- in cents
    amount_due integer, -- in cents
    currency text default 'usd',
    status text not null, -- draft, open, paid, void, uncollectible
    invoice_pdf text,
    hosted_invoice_url text,
    period_start timestamp with time zone,
    period_end timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- Add subscription fields to organizations (AFTER plans are inserted)
alter table public.organizations add column if not exists 
    subscription_status text default 'trialing';
    
alter table public.organizations add column if not exists 
    subscription_plan_id text references public.subscription_plans(id) default 'free';

-- RLS Policies
alter table public.subscription_plans enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.organization_usage enable row level security;
alter table public.payment_methods enable row level security;
alter table public.invoices enable row level security;

-- Everyone can view subscription plans
create policy "Anyone can view subscription plans"
    on public.subscription_plans for select
    using (true);

-- Organization members can view their subscription
create policy "Organization members can view subscription"
    on public.organization_subscriptions for select
    using (
        organization_id in (
            select organization_id from public.organization_members
            where user_id = auth.uid()
        )
    );

-- Only owners can manage subscriptions
create policy "Owners can manage subscriptions"
    on public.organization_subscriptions for all
    using (
        organization_id in (
            select organization_id from public.organization_members
            where user_id = auth.uid() and role = 'owner'
        )
    );

-- Organization members can view usage
create policy "Organization members can view usage"
    on public.organization_usage for select
    using (
        organization_id in (
            select organization_id from public.organization_members
            where user_id = auth.uid()
        )
    );

-- System can update usage (via service role)
create policy "System can update usage"
    on public.organization_usage for all
    using (auth.role() = 'service_role');

-- Only owners can view/manage payment methods
create policy "Owners can manage payment methods"
    on public.payment_methods for all
    using (
        organization_id in (
            select organization_id from public.organization_members
            where user_id = auth.uid() and role = 'owner'
        )
    );

-- Organization members can view invoices
create policy "Organization members can view invoices"
    on public.invoices for select
    using (
        organization_id in (
            select organization_id from public.organization_members
            where user_id = auth.uid()
        )
    );

-- Functions for usage tracking
create or replace function increment_feedback_count(org_id uuid)
returns void as $$
begin
    insert into public.organization_usage (organization_id, month, feedback_count)
    values (org_id, date_trunc('month', now())::date, 1)
    on conflict (organization_id, month)
    do update set 
        feedback_count = organization_usage.feedback_count + 1,
        updated_at = now();
end;
$$ language plpgsql security definer;

-- Trigger to track feedback submissions
create or replace function track_feedback_usage()
returns trigger as $$
begin
    perform increment_feedback_count(
        (select organization_id from public.projects where id = new.project_id)
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_feedback_created
    after insert on public.feedback
    for each row
    execute function track_feedback_usage();

-- Indexes
create index idx_organization_subscriptions_org_id on public.organization_subscriptions(organization_id);
create index idx_organization_subscriptions_stripe_customer on public.organization_subscriptions(stripe_customer_id);
create index idx_organization_usage_org_month on public.organization_usage(organization_id, month);
create index idx_payment_methods_org_id on public.payment_methods(organization_id);
create index idx_invoices_org_id on public.invoices(organization_id);