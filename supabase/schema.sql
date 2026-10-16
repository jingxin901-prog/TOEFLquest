-- TOEFL Quest / Supabase schema
-- Run this file in the Supabase SQL Editor, then enable Email auth in Authentication settings.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  current_score numeric(2,1) not null default 4.0 check (current_score between 1 and 6 and mod(current_score * 10, 5) = 0),
  target_score numeric(2,1) not null default 5.0 check (target_score between 1 and 6 and mod(target_score * 10, 5) = 0),
  exam_date date not null,
  daily_minutes integer not null default 50 check (daily_minutes between 10 and 180),
  weak_skill text not null default 'speaking' check (weak_skill in ('reading','listening','speaking','writing','vocabulary')),
  topics text[] not null default '{}',
  timezone text not null default 'Asia/Shanghai',
  reminder_time time not null default '20:00',
  onboarding_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  scheduled_date date not null,
  skill text not null check (skill in ('reading','listening','speaking','writing','vocabulary')),
  duration_minutes integer not null check (duration_minutes between 5 and 180),
  status text not null default 'todo' check (status in ('todo','completed','skipped')),
  source text not null default 'manual' check (source in ('manual','rule','rescheduled')),
  completed_at timestamptz,
  rescheduled_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  skill text not null check (skill in ('reading','listening','speaking','writing','vocabulary')),
  mode text not null check (mode in ('focus','pomodoro')),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 1 and 720),
  created_at timestamptz not null default now(),
  check (ended_at >= started_at)
);

create table if not exists public.score_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_date date not null,
  score_type text not null check (score_type in ('official','mock','ai')),
  overall numeric(2,1) not null check (overall between 1 and 6 and mod(overall * 10, 5) = 0),
  reading numeric(2,1) check (reading between 1 and 6 and mod(reading * 10, 5) = 0),
  listening numeric(2,1) check (listening between 1 and 6 and mod(listening * 10, 5) = 0),
  speaking numeric(2,1) check (speaking between 1 and 6 and mod(speaking * 10, 5) = 0),
  writing numeric(2,1) check (writing between 1 and 6 and mod(writing * 10, 5) = 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  energy text not null check (energy in ('low','steady','high')),
  note text,
  created_at timestamptz not null default now(),
  primary key (user_id, checkin_date)
);

create index if not exists tasks_user_date_idx on public.tasks(user_id, scheduled_date);
create index if not exists sessions_user_started_idx on public.study_sessions(user_id, started_at);
create index if not exists scores_user_date_idx on public.score_records(user_id, recorded_date);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.study_sessions enable row level security;
alter table public.score_records enable row level security;
alter table public.daily_checkins enable row level security;

drop policy if exists "profiles_own_rows" on public.profiles;
create policy "profiles_own_rows" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "tasks_own_rows" on public.tasks;
create policy "tasks_own_rows" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "sessions_own_rows" on public.study_sessions;
create policy "sessions_own_rows" on public.study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "scores_own_rows" on public.score_records;
create policy "scores_own_rows" on public.score_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "checkins_own_rows" on public.daily_checkins;
create policy "checkins_own_rows" on public.daily_checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
