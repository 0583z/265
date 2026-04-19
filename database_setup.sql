-- ============================================================
-- Geek Hub - Supabase 全量数据库初始化
-- 包含:
-- 1) 竞赛/订阅/通知
-- 2) 用户成长日志: focus_sessions, daily_logs, user_skills
-- 3) AI 长期记忆: ai_memory + pgvector (RAG)
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists vector;

-- -------------------------
-- 基础业务表
-- -------------------------
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null default '校级',
  category text not null default '综合',
  major jsonb not null default '[]'::jsonb,
  "techStack" jsonb not null default '[]'::jsonb,
  deadline timestamptz not null,
  "registrationUrl" text not null,
  "historicalAwardRatio" double precision not null default 0.1,
  description text not null default '',
  ai_suggestion text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, competition_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'system',
  is_read integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pending_competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  deadline timestamptz,
  link text,
  description text,
  submitter_contact text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- -------------------------
-- 用户成长与雷达图数据
-- -------------------------
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  duration_minutes integer not null check (duration_minutes > 0),
  category text not null default 'deep_work',
  session_title text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  mood_score integer check (mood_score between 1 and 5),
  energy_score integer check (energy_score between 1 and 5),
  summary text not null,
  blockers text,
  wins text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  skill_score numeric(4,2) not null check (skill_score >= 0 and skill_score <= 100),
  weight numeric(4,2) not null default 1 check (weight >= 0 and weight <= 10),
  source text not null default 'self_assessment',
  updated_at timestamptz not null default now(),
  unique (user_id, skill_name)
);

-- -------------------------
-- AI 记忆 (RAG 向量库)
-- summary 使用向量化存储
-- -------------------------
create table if not exists public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary vector(1536) not null,
  topic text not null,
  content text,
  created_at timestamptz not null default now()
);

alter table public.ai_memory add column if not exists content text;

create index if not exists idx_ai_memory_user_topic on public.ai_memory(user_id, topic);
create index if not exists idx_ai_memory_summary_hnsw
  on public.ai_memory
  using hnsw (summary vector_cosine_ops);

-- 向量检索（RAG）：query_embedding 传入 JSON 字符串 "[0.1,...]"，由服务端用 OpenAI 生成
create or replace function public.match_ai_memories(
  query_embedding text,
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  topic text,
  content text,
  similarity double precision,
  created_at timestamptz
)
language sql
stable
set search_path = public
as $$
  select
    m.id,
    m.topic,
    coalesce(m.content, '') as content,
    (1 - (m.summary <=> (query_embedding::vector(1536))))::double precision as similarity,
    m.created_at
  from public.ai_memory m
  where m.user_id = p_user_id
    and m.user_id = auth.uid()
    and (1 - (m.summary <=> (query_embedding::vector(1536)))) > match_threshold
  order by m.summary <=> (query_embedding::vector(1536)) asc
  limit least(match_count, 50);
$$;

revoke all on function public.match_ai_memories(text, float, int, uuid) from public;
grant execute on function public.match_ai_memories(text, float, int, uuid) to authenticated;

-- -------------------------
-- RLS
-- -------------------------
alter table public.competitions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.pending_competitions enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.daily_logs enable row level security;
alter table public.user_skills enable row level security;
alter table public.ai_memory enable row level security;

-- competitions: 可公开读取, 登录用户可提交
drop policy if exists "competitions public read" on public.competitions;
create policy "competitions public read"
on public.competitions
for select to anon, authenticated
using (true);

drop policy if exists "competitions auth insert" on public.competitions;
create policy "competitions auth insert"
on public.competitions
for insert to authenticated
with check (true);

-- subscriptions: 仅本人可读写删
drop policy if exists "subscriptions own read" on public.subscriptions;
create policy "subscriptions own read"
on public.subscriptions
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "subscriptions own insert" on public.subscriptions;
create policy "subscriptions own insert"
on public.subscriptions
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "subscriptions own delete" on public.subscriptions;
create policy "subscriptions own delete"
on public.subscriptions
for delete to authenticated
using (auth.uid() = user_id);

-- notifications: 仅本人可读写
drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read"
on public.notifications
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update"
on public.notifications
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notifications own insert" on public.notifications;
create policy "notifications own insert"
on public.notifications
for insert to authenticated
with check (auth.uid() = user_id);

-- pending_competitions: 允许所有人提交, 仅登录用户查看自己
drop policy if exists "pending insert for all" on public.pending_competitions;
create policy "pending insert for all"
on public.pending_competitions
for insert to anon, authenticated
with check (true);

drop policy if exists "pending select own for auth" on public.pending_competitions;
create policy "pending select own for auth"
on public.pending_competitions
for select to authenticated
using (true);

-- focus_sessions / daily_logs / user_skills / ai_memory: 仅本人访问
drop policy if exists "focus sessions own all" on public.focus_sessions;
create policy "focus sessions own all"
on public.focus_sessions
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily logs own all" on public.daily_logs;
create policy "daily logs own all"
on public.daily_logs
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user skills own all" on public.user_skills;
create policy "user skills own all"
on public.user_skills
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai memory own all" on public.ai_memory;
create policy "ai memory own all"
on public.ai_memory
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- -------------------------
-- 极客中心: 扩展档案 + 关键词 AI 记忆（无向量）
-- -------------------------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  avatar_url text,
  motto text,
  tech_tags jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.geek_memory_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_geek_memory_user_created on public.geek_memory_entries(user_id, created_at desc);

alter table public.user_profiles enable row level security;
alter table public.geek_memory_entries enable row level security;

drop policy if exists "user profiles own all" on public.user_profiles;
create policy "user profiles own all"
on public.user_profiles
for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "geek memory own all" on public.geek_memory_entries;
create policy "geek memory own all"
on public.geek_memory_entries
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 档案扩展字段（与 ProfileView 对齐）
alter table public.user_profiles add column if not exists major text;
alter table public.user_profiles add column if not exists bio text;
alter table public.user_profiles add column if not exists github_url text;
alter table public.user_profiles add column if not exists skills jsonb not null default '[]'::jsonb;

-- 成长：技能维度 EXP + 连续打卡 + 咕卡贴纸布局
create table if not exists public.user_growth_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exp_algorithm double precision not null default 0,
  exp_dev double precision not null default 0,
  exp_ui double precision not null default 0,
  exp_arch double precision not null default 0,
  streak_days integer not null default 0,
  last_punch_date date,
  last_morning_tip_date date,
  sticker_layout jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_growth_state enable row level security;

drop policy if exists "growth state own" on public.user_growth_state;
create policy "growth state own"
on public.user_growth_state
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- -------------------------
-- 增量迁移（已有库可单独执行）
-- -------------------------
-- alter table public.subscriptions alter column competition_id type uuid using competition_id::text::uuid;
-- alter table public.focus_sessions add column if not exists session_title text;
-- alter table public.ai_memory add column if not exists content text;

-- ============================================================
-- 管理员审核时可参考:
-- insert into competitions (name, category, deadline, "registrationUrl", description, level)
-- select title, category, deadline, link, description, '待定'
-- from pending_competitions
-- where id = '目标ID' and status = 'pending';
-- ============================================================
