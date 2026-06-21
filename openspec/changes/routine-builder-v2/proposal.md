# Proposal: Routine Builder v2 — Supabase Data-Driven Core (Fase 1)

## Intent

Goruti's routine is hardcoded in `buildTasks()` and completion state lives in flat localStorage (`{day}{taskId}->bool`), with no user dimension and no shared groups. This blocks the product vision: real shared routines (pareja/amigos/familia) with per-person completion. Fase 1 lays the foundation — move routine data and completions to Supabase, replace the hardcoded couple routine with a data-driven seed template, and key completions per person. No social UI yet; the goal is a correct, reproducible data layer.

> Supersedes the obsolete `openspec/changes/routine-builder/` (localStorage-first). Recommend archiving/removing it after this change lands.

## Scope

### In Scope (Fase 1)
- Supabase schema via **Supabase CLI migrations** (`supabase/migrations/`): `groups`, `group_members`, `routines`, `tasks`, `task_completions` + RLS.
- DB trigger auto-creating a personal group (group of one, owner) on `auth.users` insert.
- Seed the current couple routine as a **data-driven** template into the user's personal group on first load (zero hardcoded `Person`/tasks remaining in the read path).
- Replace `buildTasks()` + localStorage reads with Supabase-backed data.
- Per-person completion keyed `(routine, task, completed_date, user_id)`; checklist writes per-user completions.

### Out of Scope (future)
- **Fase 2**: invite links/codes, multi-member, per-person visible checks, profiles/display names, "Rutinas" tab.
- **Fase 3**: template gallery UI, user-published templates.
- Deferred flags: shared-task flag, rotation, `times_per_week` scheduling.

## Capabilities

### New Capabilities
- `routine-builder`: data-driven routine core — groups/routines/tasks model, personal-group auto-create, schedule as tagged jsonb `{type:'weekly',days:DayName[]}`, task→member assignment (null=all). *(Re-defines the existing localStorage-era spec.)*

### Modified Capabilities
- `checklist-display`: reads tasks/routine from Supabase (Server Component) instead of `buildTasks()`.
- `checklist-persistence`: per-user completions in `task_completions` (Supabase) instead of flat localStorage `CheckState`.

## Approach

Hybrid Server Component + thin client hook (recommended in exploration):
- Server Components fetch routine + tasks via `createServerClient` (RLS-scoped); pattern already used in `layout.tsx`.
- `page.tsx` refactored to a Server Component that fetches server-side; interactive parts extracted into client children.
- A thin `useCompletions()` client hook handles only completion toggles via the browser client (optimistic write to `task_completions`).
- Schema reproducible through Supabase CLI migrations (user already has a Supabase project + `.env.local`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` | New | CLI migrations: 5 tables, RLS, personal-group trigger |
| `src/data/tasks.ts` (`buildTasks`) | Removed (read path) | Becomes seed template data, not runtime source |
| `src/data/constants.ts`, `useLocalStorage.ts` | Modified/Removed | Drop `STORAGE_KEY` checklist persistence |
| `src/hooks/useChecklist.ts` | Modified | Source tasks from Supabase |
| `src/hooks/useCompletions.ts` | New | Per-user completion toggles (browser client) |
| `src/app/page.tsx` | Modified | Server Component fetch + client child extraction |
| `src/lib/supabase/*` | Reused | Existing server/browser clients |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `page.tsx` Server Component refactor is non-trivial | High | Set boundary: server fetch, client children for interactivity; stage incrementally |
| RLS misconfig leaks/blocks group data | Med | Test policies against personal group before checklist wiring |
| Seed runs twice / duplicates routine | Med | Idempotent seed keyed on personal group + template_id |
| Completion write races (per-day toggles) | Med | Composite unique `(task_id,user_id,completed_date)` + upsert |

## Rollback Plan

1. Revert `useChecklist`/`page.tsx` to `buildTasks()` + localStorage.
2. Restore `useLocalStorage` checklist persistence and `STORAGE_KEY`.
3. Remove `useCompletions.ts`.
4. Drop migration (down migration) — tables are additive, no existing data touched.

## Dependencies

- Existing Supabase project + `.env.local` (present).
- Supabase CLI for migrations (`supabase/` directory to be established).
- Auth already wired (`useAuth`, middleware) — trigger relies on `auth.users`.

## Success Criteria

- [ ] Migrations apply cleanly and recreate the full schema from scratch.
- [ ] New user gets a personal group auto-created on registration.
- [ ] First load seeds the couple routine (data-driven) into the personal group, idempotently.
- [ ] Checklist renders from Supabase; toggles persist as per-user `task_completions`.
- [ ] No hardcoded routine/`Person` data remains in the read path.
- [ ] RLS prevents cross-group access.
