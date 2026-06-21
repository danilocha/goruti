-- ============================================================
-- Migration: groups_social (Fase 3a)
-- Adds: profiles table, shares_group_with helper,
--       join_group_by_invite RPC, get_group_by_invite RPC,
--       updated handle_new_user trigger.
-- DO NOT PUSH until reviewed.
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ── shares_group_with helper (avoids RLS recursion on group_members) ─
create or replace function public.shares_group_with(other_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members gm1
    join public.group_members gm2
      on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid()
      and gm2.user_id = other_user_id
  );
$$;

-- ── profiles RLS policies ─────────────────────────────────────────────
-- Select: own row, or someone who shares a group with you
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select'
  ) then
    create policy profiles_select on public.profiles for select
      using (
        id = auth.uid()
        or public.shares_group_with(id)
      );
  end if;
end $$;

-- Insert: only own row
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_insert'
  ) then
    create policy profiles_insert on public.profiles for insert
      with check (id = auth.uid());
  end if;
end $$;

-- Update: only own row
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update'
  ) then
    create policy profiles_update on public.profiles for update
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end $$;

-- ── Updated handle_new_user: also creates profile ─────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
begin
  -- Create personal group
  insert into public.groups (name, type, created_by)
  values ('Personal', 'personal', new.id)
  returning id into new_group_id;

  -- Add owner membership
  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, new.id, 'owner');

  -- Create profile using email prefix as display_name
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ── Backfill existing users who have no profile ───────────────────────
insert into public.profiles (id, display_name)
select id, split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;

-- ── join_group_by_invite RPC ──────────────────────────────────────────
create or replace function public.join_group_by_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  select id into v_group_id
  from public.groups
  where invite_code = p_code
  limit 1;

  if v_group_id is null then
    raise exception 'invalid invite';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

-- ── get_group_by_invite RPC (readable before joining) ────────────────
-- Needed for the /join/[code] page where the user is not yet a member
-- and therefore cannot read the group via RLS.
create or replace function public.get_group_by_invite(p_code text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name
  from public.groups g
  where g.invite_code = p_code
  limit 1;
$$;

-- ── Smoke queries (run after apply) ──────────────────────────────────
-- select * from public.profiles limit 5;
-- select public.join_group_by_invite('TESTCODE');
-- select * from public.get_group_by_invite('TESTCODE');
