-- ============================================================
-- QuestStar Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ── 1. Profiles (extends Supabase auth.users) ──
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 2. Game State (XP, streak, level tracking) ──
create table public.game_state (
  user_id uuid references auth.users(id) on delete cascade primary key,
  xp integer default 0,
  streak integer default 0,
  last_active_date text,
  daily_first_win text,
  updated_at timestamptz default now()
);

alter table public.game_state enable row level security;

create policy "Users manage own game state"
  on public.game_state for all using (auth.uid() = user_id);


-- ── 3. Quests ──
create table public.quests (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text default 'learning',
  quest_type text default 'daily',
  tag text,
  deadline text,
  created_at bigint,
  steps jsonb default '[]'::jsonb,
  primary key (user_id, id)
);

alter table public.quests enable row level security;

create policy "Users manage own quests"
  on public.quests for all using (auth.uid() = user_id);


-- ── 4. Reward System ──
create table public.reward_state (
  user_id uuid references auth.users(id) on delete cascade primary key,
  wallet numeric default 0,
  wallet_log jsonb default '[]'::jsonb,
  milestones_claimed jsonb default '[]'::jsonb,
  shield_week text,
  daily_clear text,
  daily_steps jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.reward_state enable row level security;

create policy "Users manage own rewards"
  on public.reward_state for all using (auth.uid() = user_id);


-- ── 5. Daily Habits (custom time blocks + daily checks) ──
create table public.daily_habits (
  user_id uuid references auth.users(id) on delete cascade primary key,
  time_blocks jsonb,  -- null = use generic defaults; JSON array = custom
  daily_checks jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.daily_habits enable row level security;

create policy "Users manage own habits"
  on public.daily_habits for all using (auth.uid() = user_id);


-- ── 6. Blossom Progress ──
create table public.blossom_progress (
  user_id uuid references auth.users(id) on delete cascade primary key,
  progress jsonb default '{}'::jsonb,
  today_log jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.blossom_progress enable row level security;

create policy "Users manage own blossom"
  on public.blossom_progress for all using (auth.uid() = user_id);


-- ── 7. Lore Collection ──
create table public.lore_state (
  user_id uuid references auth.users(id) on delete cascade primary key,
  collected jsonb default '{}'::jsonb,
  recent_fragment text,
  updated_at timestamptz default now()
);

alter table public.lore_state enable row level security;

create policy "Users manage own lore"
  on public.lore_state for all using (auth.uid() = user_id);


-- ── 8. User Settings (theme, language, AI keys, etc.) ──
create table public.user_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  theme text default 'aurora',
  language text default 'zh',
  app_mode text default 'study',
  ai_provider text default 'claude',
  ai_keys jsonb default '{}'::jsonb,  -- { claude: "sk-...", glm: "...", ... }
  ai_models jsonb default '{}'::jsonb, -- { claude: "claude-haiku-4-5-20251001", ... }
  known_domain text,
  onboarding_done boolean default false,
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "Users manage own settings"
  on public.user_settings for all using (auth.uid() = user_id);


-- ── 9. Additional State (micro-learn, roadmap, reflections, challenges) ──
create table public.extra_state (
  user_id uuid references auth.users(id) on delete cascade primary key,
  micro_learn jsonb default '{}'::jsonb,
  roadmap jsonb default '{}'::jsonb,
  reflections jsonb default '{}'::jsonb,
  challenge jsonb default '{}'::jsonb,
  deadline_notified jsonb default '{}'::jsonb,
  -- budget tracker
  budget_expenses jsonb default '[]'::jsonb,
  budget_config jsonb,
  transfer_status jsonb,
  -- Life v3 habit system (Phase 3)
  habit_active jsonb default '[]'::jsonb,
  habit_log jsonb default '{}'::jsonb,
  habit_graduations jsonb default '[]'::jsonb,
  habit_explore_budget jsonb default '{}'::jsonb,
  habit_schedule jsonb,
  habit_identity text default '',
  habit_letters jsonb default '[]'::jsonb,
  habit_week_plan jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- ── Migration for existing deployments (run once in SQL Editor) ──
-- alter table public.extra_state
--   add column if not exists budget_expenses jsonb default '[]'::jsonb,
--   add column if not exists budget_config jsonb,
--   add column if not exists transfer_status jsonb,
--   add column if not exists habit_active jsonb default '[]'::jsonb,
--   add column if not exists habit_log jsonb default '{}'::jsonb,
--   add column if not exists habit_graduations jsonb default '[]'::jsonb,
--   add column if not exists habit_explore_budget jsonb default '{}'::jsonb,
--   add column if not exists habit_schedule jsonb,
--   add column if not exists habit_identity text default '',
--   add column if not exists habit_letters jsonb default '[]'::jsonb,
--   add column if not exists habit_week_plan jsonb default '{}'::jsonb;

alter table public.extra_state enable row level security;

create policy "Users manage own extra state"
  on public.extra_state for all using (auth.uid() = user_id);


-- ── Indexes ──
create index idx_quests_user on public.quests(user_id);
create index idx_quests_tag on public.quests(user_id, tag);


-- ── Helper: auto-update updated_at ──
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_game_state_timestamp before update on public.game_state
  for each row execute function public.update_updated_at();
create trigger update_reward_state_timestamp before update on public.reward_state
  for each row execute function public.update_updated_at();
create trigger update_daily_habits_timestamp before update on public.daily_habits
  for each row execute function public.update_updated_at();
create trigger update_blossom_timestamp before update on public.blossom_progress
  for each row execute function public.update_updated_at();
create trigger update_lore_timestamp before update on public.lore_state
  for each row execute function public.update_updated_at();
create trigger update_settings_timestamp before update on public.user_settings
  for each row execute function public.update_updated_at();
create trigger update_extra_timestamp before update on public.extra_state
  for each row execute function public.update_updated_at();
