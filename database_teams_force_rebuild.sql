-- 强制修复 teams 相关结构（用于你当前反复 400/409 的情况）
-- 注意：会清空 teams/team_applications/team_invites 旧数据

drop table if exists public.team_invites cascade;
drop table if exists public.team_applications cascade;
drop table if exists public.teams cascade;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  max_members integer not null default 4 check (max_members between 2 and 10),
  competition_id bigint null references public.competitions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.team_applications (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (team_id, invitee_id)
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.team_applications to authenticated;
grant select, insert, update, delete on public.team_invites to authenticated;

alter table public.teams enable row level security;
alter table public.team_applications enable row level security;
alter table public.team_invites enable row level security;

create policy "teams read all"
on public.teams
for select to anon, authenticated
using (true);

create policy "teams insert own leader"
on public.teams
for insert to authenticated
with check (auth.uid() = leader_id);

create policy "teams update own leader"
on public.teams
for update to authenticated
using (auth.uid() = leader_id)
with check (auth.uid() = leader_id);

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

create policy "team applications insert own"
on public.team_applications
for insert to authenticated
with check (auth.uid() = user_id);

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
