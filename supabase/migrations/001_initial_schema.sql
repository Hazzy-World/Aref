-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null default '',
  plan text not null default 'seeker' check (plan in ('seeker', 'scholar', 'sage')),
  daily_minutes_used integer not null default 0,
  daily_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  stripe_customer_id text,
  stripe_subscription_id text
);

-- Learning plans table
create table if not exists public.learning_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  goal text not null,
  approach_id text not null,
  approach_name text not null,
  approach_icon text not null default '📚',
  phases jsonb not null default '[]',
  total_hours integer not null default 0,
  current_phase integer not null default 0,
  completed_topics jsonb not null default '{}',
  created_at timestamptz not null default now(),
  last_accessed timestamptz not null default now()
);

-- Generated courses table
create table if not exists public.generated_courses (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references public.learning_plans(id) on delete cascade not null,
  phase_id text not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique(plan_id, phase_id)
);

-- Row Level Security
alter table public.users enable row level security;
alter table public.learning_plans enable row level security;
alter table public.generated_courses enable row level security;

-- Users RLS
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Learning plans RLS
create policy "Users can view own plans"
  on public.learning_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on public.learning_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on public.learning_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own plans"
  on public.learning_plans for delete
  using (auth.uid() = user_id);

-- Generated courses RLS
create policy "Users can view own courses"
  on public.generated_courses for select
  using (
    auth.uid() = (
      select user_id from public.learning_plans where id = plan_id
    )
  );

create policy "Users can insert own courses"
  on public.generated_courses for insert
  with check (
    auth.uid() = (
      select user_id from public.learning_plans where id = plan_id
    )
  );

-- Function to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Trigger on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to reset daily usage (call via cron or on access)
create or replace function public.reset_daily_usage_if_needed(user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.users
  set
    daily_minutes_used = 0,
    daily_reset_at = date_trunc('day', now() at time zone 'utc') + interval '1 day'
  where
    id = user_id
    and daily_reset_at < now();
end;
$$;

-- Indexes
create index if not exists idx_learning_plans_user_id on public.learning_plans(user_id);
create index if not exists idx_learning_plans_last_accessed on public.learning_plans(last_accessed desc);
create index if not exists idx_generated_courses_plan_id on public.generated_courses(plan_id);
