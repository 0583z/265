-- 精简版历史脚本；完整 pgvector / 成长表 / ai_memory 请以仓库根目录 `database_setup.sql` 为准在 SQL Editor 执行。

create extension if not exists pgcrypto;

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

alter table public.competitions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

-- competitions: public read, authenticated write
drop policy if exists "competitions public read" on public.competitions;
create policy "competitions public read"
on public.competitions
for select
to anon, authenticated
using (true);

drop policy if exists "competitions auth insert" on public.competitions;
create policy "competitions auth insert"
on public.competitions
for insert
to authenticated
with check (true);

-- subscriptions: user can only access own rows
drop policy if exists "subscriptions own read" on public.subscriptions;
create policy "subscriptions own read"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "subscriptions own insert" on public.subscriptions;
create policy "subscriptions own insert"
on public.subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "subscriptions own delete" on public.subscriptions;
create policy "subscriptions own delete"
on public.subscriptions
for delete
to authenticated
using (auth.uid() = user_id);

-- notifications: user can only access own notifications
drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notifications own insert" on public.notifications;
create policy "notifications own insert"
on public.notifications
for insert
to authenticated
with check (auth.uid() = user_id);
