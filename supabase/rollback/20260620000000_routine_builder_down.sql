-- ============================================================
-- Rollback: routine_builder (Fase 1)
-- Apply: npx supabase db push (if rollback migration strategy)
-- Or: paste into dashboard SQL Editor.
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.task_completions;
drop table if exists public.tasks;
drop table if exists public.routines;
drop table if exists public.group_members;
drop table if exists public.groups;

drop type if exists member_role;
drop type if exists group_type;
