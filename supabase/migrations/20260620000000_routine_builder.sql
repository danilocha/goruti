-- ============================================================
-- Migration: routine_builder (Fase 1)
-- Apply: npx supabase link --project-ref <ref>
--        npx supabase db push
-- Alternative (dashboard): paste into SQL Editor and run.
-- Smoke queries at the bottom of this file.
-- ============================================================

-- ── enums ────────────────────────────────────────────────────────────
create type group_type as enum ('personal', 'shared');
create type member_role as enum ('owner', 'member');

-- ── groups ───────────────────────────────────────────────────────────
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        group_type not null default 'personal',
  created_by  uuid not null references auth.users(id) on delete cascade,
  invite_code text unique,
  created_at  timestamptz not null default now()
);

-- ── group_members ────────────────────────────────────────────────────
create table public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members(user_id);

-- ── routines ─────────────────────────────────────────────────────────
create table public.routines (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  name        text not null,
  description text,
  template_id text,
  created_at  timestamptz not null default now(),
  unique (group_id, template_id)
);
create index routines_group_idx on public.routines(group_id);

-- ── tasks ────────────────────────────────────────────────────────────
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  name        text not null,
  icon        text,
  block       text,
  time_label  text,
  note        text,
  no_check    boolean not null default false,
  schedule    jsonb not null,
  assigned_to uuid[],
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  constraint schedule_is_weekly
    check (schedule ->> 'type' = 'weekly'
       and jsonb_typeof(schedule -> 'days') = 'array')
);
create index tasks_routine_idx on public.tasks(routine_id);

-- ── task_completions ─────────────────────────────────────────────────
create table public.task_completions (
  id             uuid primary key default gen_random_uuid(),
  routine_id     uuid not null references public.routines(id) on delete cascade,
  task_id        uuid not null references public.tasks(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  completed_date date not null,
  completed_at   timestamptz not null default now(),
  unique (task_id, user_id, completed_date)
);
create index completions_lookup_idx
  on public.task_completions(user_id, completed_date);

-- ── RLS ──────────────────────────────────────────────────────────────
alter table public.groups           enable row level security;
alter table public.group_members    enable row level security;
alter table public.routines         enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_completions enable row level security;

-- ── RLS helper functions (security definer: bypass RLS to avoid recursion) ──
-- A policy on group_members that queries group_members would recurse infinitely.
-- These STABLE security-definer helpers read membership WITHOUT re-triggering RLS.
create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid());
$$;

create or replace function public.is_group_owner(gid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid() and role = 'owner');
$$;

create or replace function public.is_routine_member(rid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.routines r
    join public.group_members gm on gm.group_id = r.group_id
    where r.id = rid and gm.user_id = auth.uid());
$$;

-- groups
create policy groups_select on public.groups for select
  using (public.is_group_member(id));
create policy groups_insert on public.groups for insert
  with check (created_by = auth.uid());
create policy groups_update on public.groups for update
  using (public.is_group_owner(id));
create policy groups_delete on public.groups for delete
  using (public.is_group_owner(id));

-- group_members
create policy gm_select on public.group_members for select
  using (public.is_group_member(group_id));
create policy gm_insert on public.group_members for insert
  with check (public.is_group_owner(group_id));
create policy gm_delete on public.group_members for delete
  using (public.is_group_owner(group_id));

-- gm_self_owner_insert: allows a user to add themselves to a group they created
-- (needed for ensurePersonalGroup fallback before any group_members row exists)
create policy gm_self_owner_insert on public.group_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

-- routines
create policy routines_select on public.routines for select
  using (public.is_group_member(group_id));
create policy routines_cud on public.routines for all
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

-- tasks (membership through routine)
create policy tasks_select on public.tasks for select
  using (public.is_routine_member(routine_id));
create policy tasks_cud on public.tasks for all
  using (public.is_routine_member(routine_id))
  with check (public.is_routine_member(routine_id));

-- task_completions (read group-wide, write only own)
create policy tc_select on public.task_completions for select
  using (public.is_routine_member(routine_id));
create policy tc_insert on public.task_completions for insert
  with check (user_id = auth.uid() and public.is_routine_member(routine_id));
create policy tc_update on public.task_completions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy tc_delete on public.task_completions for delete
  using (user_id = auth.uid());

-- ── handle_new_user trigger ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
begin
  insert into public.groups (name, type, created_by)
  values ('Personal', 'personal', new.id)
  returning id into new_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Smoke queries (run after apply) ──────────────────────────────────
-- select table_name from information_schema.tables
--   where table_schema = 'public'
--   and table_name in ('groups','group_members','routines','tasks','task_completions');
-- select routine_name from information_schema.routines
--   where routine_schema = 'public' and routine_name = 'handle_new_user';
-- select trigger_name from information_schema.triggers
--   where trigger_name = 'on_auth_user_created';
-- select typname from pg_type where typname in ('group_type','member_role');
