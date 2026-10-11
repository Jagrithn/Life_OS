-- Phase 2: profiles preferences, goal horizons/progress modes, and the
-- projects, milestones, events, academics, learning, review and investment tables.
-- All changes are additive; existing rows and columns are left untouched.

alter table public.profiles add column if not exists enabled_modules text[] not null default array['tasks','habits','journal','money','goals','projects','calendar']::text[];
alter table public.profiles add column if not exists weekly_available_hours integer not null default 40;
alter table public.profiles add column if not exists onboarded boolean not null default false;
alter table public.goals add column if not exists horizon text not null default 'long';
alter table public.goals add column if not exists progress_mode text not null default 'manual';

create table public.projects (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
 goal_id uuid references public.goals(id) on delete set null,
 title text not null check (char_length(title)<=120), outcome text check (char_length(outcome)<=500),
 area text not null default 'personal', status text not null default 'active',
 deadline date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.milestones (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 title text not null check (char_length(title)<=120), due_date date, done boolean not null default false,
 created_at timestamptz not null default now());
alter table public.tasks add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.tasks add column if not exists milestone_id uuid references public.milestones(id) on delete set null;
create table public.events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
 title text not null check (char_length(title)<=120), kind text not null default 'event',
 starts_at timestamptz not null, ends_at timestamptz not null,
 task_id uuid references public.tasks(id) on delete set null,
 project_id uuid references public.projects(id) on delete set null,
 note text check (char_length(note)<=300), created_at timestamptz not null default now());
create table public.terms (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), name text not null check (char_length(name)<=80), starts_on date, ends_on date, created_at timestamptz not null default now());
create table public.courses (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), term_id uuid references public.terms(id) on delete set null, name text not null check (char_length(name)<=80), created_at timestamptz not null default now());
create table public.assessments (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), course_id uuid references public.courses(id) on delete cascade, title text not null check (char_length(title)<=120), kind text not null default 'assignment', due_date date, done boolean not null default false, created_at timestamptz not null default now());
create table public.books (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), title text not null check (char_length(title)<=150), author text check (char_length(author)<=100), status text not null default 'want', takeaways text check (char_length(takeaways)<=2000), created_at timestamptz not null default now());
create table public.learning_logs (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), skill text not null check (char_length(skill)<=80), minutes integer not null default 30 check (minutes>0 and minutes<=1440), note text check (char_length(note)<=500), log_date date not null default current_date, created_at timestamptz not null default now());
create table public.weekly_reviews (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), week_start date not null, wins text check (char_length(wins)<=1000), obstacles text check (char_length(obstacles)<=1000), progress text check (char_length(progress)<=1000), priorities text check (char_length(priorities)<=1000), created_at timestamptz not null default now(), unique(user_id, week_start));
create table public.investments (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), name text not null check (char_length(name)<=80), contributed numeric not null default 0 check (contributed>=0), current_value numeric not null default 0 check (current_value>=0), as_of date not null default current_date, created_at timestamptz not null default now());

do $$ declare t text; begin
 foreach t in array array['projects','milestones','events','terms','courses','assessments','books','learning_logs','weekly_reviews','investments'] loop
  execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  execute format('grant all on public.%I to service_role', t);
  execute format('alter table public.%I enable row level security', t);
  execute format('create policy "own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
 end loop; end $$;
create trigger projects_updated before update on public.projects for each row execute function public.update_updated_at_column();
