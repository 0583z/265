-- 一次性修复：组队枢纽 + 卷王榜
-- 在 Supabase SQL Editor 直接执行

create extension if not exists pgcrypto;

-- ========== 1) 表结构 ==========
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  max_members integer not null default 4 check (max_members between 2 and 10),
  competition_id bigint references public.competitions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_applications (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (team_id, invitee_id)
);

create table if not exists public.hall_of_fame_cases (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  year integer not null,
  award_level text not null,
  team_intro text not null default '',
  key_to_success text not null default '',
  major text not null default '综合',
  created_at timestamptz not null default now()
);

alter table public.teams alter column leader_id set default auth.uid();

-- ========== 2) 基础授权 ==========
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.team_applications to authenticated;
grant select, insert, update, delete on public.team_invites to authenticated;
grant select on public.hall_of_fame_cases to anon, authenticated;

-- ========== 3) RLS ==========
alter table public.teams enable row level security;
alter table public.team_applications enable row level security;
alter table public.team_invites enable row level security;
alter table public.hall_of_fame_cases enable row level security;

drop policy if exists "teams read all" on public.teams;
create policy "teams read all"
on public.teams
for select to anon, authenticated
using (true);

drop policy if exists "teams insert own leader" on public.teams;
create policy "teams insert own leader"
on public.teams
for insert to authenticated
with check (auth.uid() = leader_id);

drop policy if exists "teams update own leader" on public.teams;
create policy "teams update own leader"
on public.teams
for update to authenticated
using (auth.uid() = leader_id)
with check (auth.uid() = leader_id);

drop policy if exists "team applications read related" on public.team_applications;
create policy "team applications read related"
on public.team_applications
for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.teams t
    where t.id = team_id and t.leader_id = auth.uid()
  )
);

drop policy if exists "team applications insert own" on public.team_applications;
create policy "team applications insert own"
on public.team_applications
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "team invites read related" on public.team_invites;
create policy "team invites read related"
on public.team_invites
for select to authenticated
using (
  auth.uid() = invitee_id
  or auth.uid() = inviter_id
  or exists (
    select 1 from public.teams t
    where t.id = team_id and t.leader_id = auth.uid()
  )
);

drop policy if exists "team invites insert own" on public.team_invites;
create policy "team invites insert own"
on public.team_invites
for insert to authenticated
with check (
  auth.uid() = inviter_id
  and exists (
    select 1 from public.teams t
    where t.id = team_id and t.leader_id = auth.uid()
  )
);

drop policy if exists "hall cases read all" on public.hall_of_fame_cases;
create policy "hall cases read all"
on public.hall_of_fame_cases
for select to anon, authenticated
using (true);
