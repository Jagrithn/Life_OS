create or replace function public.update_updated_at_column() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;

create table public.profiles (id uuid primary key, display_name text check (char_length(display_name) <= 80), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update, delete on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, display_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),80)); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.goals (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), title text not null check (char_length(title) <= 120), description text check (char_length(description) <= 500), target_date date, progress int not null default 0 check (progress between 0 and 100), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.tasks (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), title text not null check (char_length(title) <= 200), due_date date, priority text not null default 'medium' check (priority in ('low','medium','high')), done boolean not null default false, goal_id uuid references public.goals(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.habits (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), name text not null check (char_length(name) <= 80), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.habit_logs (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), habit_id uuid not null references public.habits(id) on delete cascade, log_date date not null, created_at timestamptz not null default now(), unique (habit_id, log_date));
create table public.journal_entries (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), entry_date date not null default current_date, mood int check (mood between 1 and 5), content text not null check (char_length(content) <= 2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.transactions (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), kind text not null check (kind in ('income','expense')), amount numeric(12,2) not null check (amount > 0), category text not null check (char_length(category) <= 40), note text check (char_length(note) <= 200), txn_date date not null default current_date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

do $$ declare t text; begin
foreach t in array array['goals','tasks','habits','habit_logs','journal_entries','transactions'] loop
  execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  execute format('grant all on public.%I to service_role', t);
  execute format('alter table public.%I enable row level security', t);
  execute format('create policy "own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  execute format('create index on public.%I (user_id)', t);
end loop;
foreach t in array array['goals','tasks','habits','journal_entries','transactions'] loop
  execute format('create trigger %I before update on public.%I for each row execute function public.update_updated_at_column()', t || '_updated', t);
end loop; end $$;