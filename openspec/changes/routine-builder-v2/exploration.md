# Exploration: routine-builder-v2

> Persisted from Engram `sdd/routine-builder-v2/explore` (#247) for a complete artifact trail.

## What

Exploration for routine-builder-v2 — migrating from hardcoded `buildTasks`/localStorage to Supabase-backed, data-driven routines with multi-user group support.

## Why

User made 7 binding decisions via interview:

1. Real shared groups (not localStorage labels). Individual OR pareja/amigos/familia.
2. Per-person completion keyed `(routine, task, day, person)`. Shared-task flag deferred.
3. Data-driven templates (nothing hardcoded) + curated gallery. User-publishing deferred.
4. Task→member assignment: default all members, optional restrict. Rotation deferred.
5. Weekly schedule stored as tagged jsonb shape `{ type:'weekly', days:DayName[] }` (forward-compatible with `times_per_week`). time/block optional free text.
6. Invitations = invite link/code (not email). Roles owner + member only.
7. Everything-is-a-group; personal = group of one, auto-created on registration. Multi-group per user, multi-routine per group.

Targeting Fase 1 (data-driven core, no social yet).

## Where (current codebase map)

- **Data layer**: `src/data/tasks.ts` (`buildTasks`), `src/data/reducer.ts`, `src/data/types.ts`, `src/data/constants.ts` (`STORAGE_KEY="couple-life-checklist"`), `src/hooks/useChecklist.ts`, `src/hooks/useLocalStorage.ts`, `src/hooks/useMicroHabits.ts` (separate key `goruti-micro-habits`)
- **Supabase clients**: `src/lib/supabase/client.ts` (`createBrowserClient`), `src/lib/supabase/server.ts` (`createServerClient` + cookies)
- **Auth**: `src/hooks/useAuth.tsx` (`AuthProvider` + `useAuth`), `middleware.ts` (protects all non-public routes), `src/app/auth/callback/route.ts`
- **Navigation**: `src/app/page.tsx` (single-page with BottomNav tabs home/progress/settings), `src/app/providers.tsx` (`ChecklistContext` + `AuthGuard`), `src/components/BottomNav.tsx` (3 tabs, no "Rutinas" tab yet)
- **Layout**: `src/app/layout.tsx` (reads session server-side, passes to Providers)

## Learned

- `CheckState` is currently `{ [day]: { [taskId]: boolean } }` — flat, no user dimension.
- `buildTasks()` is called per-render with `dayName+dayIdx`; `Person` type is `"D"|"A"|"Rot"|"DA"` — fully hardcoded.
- `useLocalStorage` reads/writes `STORAGE_KEY` on every state change (300ms debounce).
- No `supabase/` CLI directory exists — migrations would need to be run manually via dashboard or psql.
- The server client is already used in `layout.tsx` to read the session before render; the Server Component pattern is established.
- **Recommended approach**: hybrid — Server Components fetch routines/tasks (static data) via server client + RLS; a thin client hook `useCompletions()` handles only interactive completion toggles via supabase-js browser client.

### Proposed schema (key decisions)

- `groups` (id, name, type enum `personal|shared`, created_by, invite_code)
- `group_members` (group_id, user_id, role `owner|member`)
- `routines` (id, group_id, name, description, template_id nullable)
- `tasks` (id, routine_id, name, icon, block, schedule jsonb `{type:'weekly',days:DayName[]}`, time text nullable, note text nullable, assigned_to uuid[] nullable — null=all members, order int)
- `task_completions` (id, routine_id, task_id, user_id, completed_date date, completed_at timestamptz) — composite unique `(task_id, user_id, completed_date)`

### RLS intent

- `group_members` can select/insert/update/delete their group's routines, tasks, completions.
- Personal group auto-created via DB trigger on `auth.users` insert.

### Scope notes

- Fase 1: NO invite links, NO multi-member UI, NO template gallery; just personal-group CRUD and checklist reads from Supabase instead of `buildTasks`.
- `BottomNav` needs a 4th "Rutinas" tab for Fase 2+; in Fase 1 the existing home tab reads from Supabase.
