-- ============================================================
-- Migration: chat_sessions (Fase A — AI Agent)
-- ============================================================

-- ── chat_sessions table ─────────────────────────────────────
create table public.chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  messages   jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chat_sessions_user_updated_idx
  on public.chat_sessions(user_id, updated_at desc);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.chat_sessions enable row level security;

create policy chat_sessions_select on public.chat_sessions for select
  using (user_id = auth.uid());

create policy chat_sessions_insert on public.chat_sessions for insert
  with check (user_id = auth.uid());

create policy chat_sessions_update on public.chat_sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy chat_sessions_delete on public.chat_sessions for delete
  using (user_id = auth.uid());

-- ── Smoke queries ───────────────────────────────────────────
-- select table_name from information_schema.tables
--   where table_schema = 'public'
--   and table_name in ('chat_sessions');
-- select indexname from pg_indexes
--   where tablename = 'chat_sessions'
--   and indexname = 'chat_sessions_user_updated_idx';
