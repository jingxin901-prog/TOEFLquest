-- TOEFL Quest 2.0 / fresh Supabase schema
-- Canonical migration: supabase/migrations/202610160001_sprint1_core.sql
create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  self_reported_level text not null default '大学英语六级左右（自评，尚未诊断）',
  current_score numeric(2,1) check (current_score is null or (current_score between 1 and 6 and mod(current_score * 10, 5) = 0)),
  topics text[] not null default '{}',
  timezone text not null default 'Asia/Shanghai',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.learning_goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  target_score numeric(2,1) check (target_score is null or (target_score between 1 and 6 and mod(target_score * 10, 5) = 0)),
  target_exam_date date, daily_minutes integer not null default 50 check (daily_minutes between 10 and 180),
  priority_skill text check (priority_skill is null or priority_skill in ('reading','listening','speaking','writing')),
  long_term_goal text not null default '', status text not null default 'active' check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('minimum','standard','sprint','custom')), daily_minutes integer not null check (daily_minutes between 10 and 180),
  start_date date not null, end_date date not null, status text not null default 'active' check (status in ('draft','active','archived')),
  source text not null default 'local_rule' check (source in ('local_rule','diagnostic_rule','ai')),
  completion_rate_basis numeric(4,3), created_at timestamptz not null default now(), check (end_date >= start_date)
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.study_plans(id) on delete set null, title text not null check (char_length(title) between 1 and 160),
  description text not null default '', scheduled_date date not null,
  skill text not null check (skill in ('reading','listening','speaking','writing','vocabulary')),
  duration_minutes integer not null check (duration_minutes between 5 and 180), status text not null default 'todo' check (status in ('todo','completed','skipped')),
  source text not null default 'manual' check (source in ('manual','rule','rescheduled')),
  is_minimum_task boolean not null default false,
  completion_method text check (completion_method is null or completion_method in ('timer','manual_confirmation')),
  completed_at timestamptz, rescheduled_from date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.daily_tasks(id) on delete set null,
  skill text not null check (skill in ('reading','listening','speaking','writing','vocabulary')),
  mode text not null check (mode in ('focus','pomodoro')), started_at timestamptz not null, ended_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 1 and 720), created_at timestamptz not null default now(), check (ended_at >= started_at)
);

create table if not exists public.checkins (
  user_id uuid not null references auth.users(id) on delete cascade, checkin_date date not null,
  energy text check (energy is null or energy in ('low','steady','high')), habit_qualified boolean not null default false,
  verified_minutes integer not null default 0 check (verified_minutes >= 0),
  verification_method text check (verification_method is null or verification_method in ('timer','manual_confirmation')),
  note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key (user_id, checkin_date)
);

create table if not exists public.diagnostic_tests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7), status text not null default 'not_started' check (status in ('not_started','in_progress','submitted','review_pending','completed')),
  started_at timestamptz, submitted_at timestamptz, elapsed_seconds integer not null default 0,
  confidence_note text, created_at timestamptz not null default now(), unique (user_id, day_number)
);

create table if not exists public.diagnostic_questions (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 6), skill text not null check (skill in ('reading','listening','speaking','writing')),
  task_type text not null, prompt jsonb not null, answer_key jsonb, rubric jsonb not null default '{}'::jsonb,
  is_original boolean not null default true, active boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.diagnostic_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.diagnostic_tests(id) on delete cascade,
  question_id uuid not null references public.diagnostic_questions(id) on delete restrict,
  response jsonb not null default '{}'::jsonb, is_correct boolean, elapsed_seconds integer not null default 0,
  review_status text not null default 'not_required' check (review_status in ('not_required','pending_human_or_ai','reviewed')),
  submitted_at timestamptz not null default now()
);

create table if not exists public.skill_assessments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null check (skill in ('reading','listening','speaking','writing')), assessed_at timestamptz not null default now(),
  source text not null check (source in ('self_diagnostic','mock','official','ai_feedback')),
  accuracy numeric(5,2), speed_note text, common_errors text[] not null default '{}', level_label text,
  needs_review boolean not null default false, confidence text not null default 'limited' check (confidence in ('limited','moderate','high'))
);

create table if not exists public.practice_submissions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.daily_tasks(id) on delete set null, skill text not null check (skill in ('reading','listening','speaking','writing')),
  content text, storage_path text, word_count integer, elapsed_seconds integer not null default 0,
  review_status text not null default 'pending_human_or_ai' check (review_status in ('pending_human_or_ai','reviewed')),
  feedback jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  word text not null, definition text not null default '', example text not null default '', source text,
  mastery_state text not null default 'learning' check (mastery_state in ('learning','review','mastered')),
  next_review_at timestamptz, interval_days integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade, enabled boolean not null default false,
  browser_enabled boolean not null default false, reminder_time time not null default '20:00', timezone text not null default 'Asia/Shanghai',
  quiet_hours_start time not null default '22:30', quiet_hours_end time not null default '08:00',
  feishu_configured boolean not null default false, updated_at timestamptz not null default now()
);

create table if not exists public.score_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  recorded_date date not null, score_type text not null check (score_type in ('official','mock','ai')),
  overall numeric(2,1) not null check (overall between 1 and 6 and mod(overall * 10, 5) = 0),
  reading numeric(2,1), listening numeric(2,1), speaking numeric(2,1), writing numeric(2,1), note text,
  created_at timestamptz not null default now()
);

create index if not exists daily_tasks_user_date_idx on public.daily_tasks(user_id, scheduled_date);
create index if not exists study_sessions_user_started_idx on public.study_sessions(user_id, started_at);
create index if not exists diagnostic_attempts_user_test_idx on public.diagnostic_attempts(user_id, test_id);
create index if not exists skill_assessments_user_date_idx on public.skill_assessments(user_id, assessed_at);
create index if not exists vocabulary_user_review_idx on public.vocabulary_items(user_id, next_review_at);

do $$ declare t text; begin
  foreach t in array array['user_profiles','learning_goals','study_plans','daily_tasks','study_sessions','checkins','diagnostic_tests','diagnostic_questions','diagnostic_attempts','skill_assessments','practice_submissions','vocabulary_items','notification_preferences','score_records'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists user_profiles_own on public.user_profiles;
create policy user_profiles_own on public.user_profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists learning_goals_own on public.learning_goals;
create policy learning_goals_own on public.learning_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists study_plans_own on public.study_plans;
create policy study_plans_own on public.study_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists daily_tasks_own on public.daily_tasks;
create policy daily_tasks_own on public.daily_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists study_sessions_own on public.study_sessions;
create policy study_sessions_own on public.study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists checkins_own on public.checkins;
create policy checkins_own on public.checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists diagnostic_tests_own on public.diagnostic_tests;
create policy diagnostic_tests_own on public.diagnostic_tests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists diagnostic_questions_read on public.diagnostic_questions;
create policy diagnostic_questions_read on public.diagnostic_questions for select using (user_id is null or auth.uid() = user_id);
drop policy if exists diagnostic_questions_own_write on public.diagnostic_questions;
create policy diagnostic_questions_own_write on public.diagnostic_questions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists diagnostic_attempts_own on public.diagnostic_attempts;
create policy diagnostic_attempts_own on public.diagnostic_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists skill_assessments_own on public.skill_assessments;
create policy skill_assessments_own on public.skill_assessments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists practice_submissions_own on public.practice_submissions;
create policy practice_submissions_own on public.practice_submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists vocabulary_items_own on public.vocabulary_items;
create policy vocabulary_items_own on public.vocabulary_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists notification_preferences_own on public.notification_preferences;
create policy notification_preferences_own on public.notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists score_records_own on public.score_records;
create policy score_records_own on public.score_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
