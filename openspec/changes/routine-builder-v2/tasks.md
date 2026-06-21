# Tasks: Routine Builder v2 — Supabase Data-Driven Core (Fase 1)

> Delivery strategy: `auto-chain` / `stacked-to-main`
> TDD mode: STRICT — each logic task is preceded by a failing-test task.
> `useMicroHabits` is out of scope — do NOT touch it.

---

## Review Workload Forecast

| Metric | Estimate |
|---|---|
| New files | ~12 |
| Modified files | ~10 |
| Estimated changed lines | ~750–950 |
| 400-line budget risk | HIGH |
| Chained PRs recommended | YES |

### Suggested PR split

| PR | Tasks | Theme |
|---|---|---|
| PR-1 | T-01 | DB migration (DDL + RLS + trigger) |
| PR-2 | T-02, T-03, T-04 | Pure types + seed logic (TDD) |
| PR-3 | T-05, T-06, T-07 | Server data layer (ensurePersonalGroup + seedDefaultRoutine) |
| PR-4 | T-08, T-09, T-10, T-11 | page.tsx split + useChecklist adaptation + useCompletions (TDD) |
| PR-5 | T-12, T-13 | Wire-up + test remediation + regression green |

---

## Existing Tests That Will Break

These tests reference modules or behaviour that this change retires. They MUST be
updated (not deleted) as part of the tasks that retire the underlying behaviour.

| File | Why it breaks | Owning task |
|---|---|---|
| `src/data/__tests__/tasks.test.ts` | `buildTasks()` and `almuerzoPerson()` are retired from the public API (or the module is removed entirely). Tests must be replaced with `buildSeedTaskRows()` tests. | T-04 |
| `src/data/__tests__/reducer.test.ts` | `checklistReducer` + `CheckState` are retired when `useCompletions` takes over persistence. The reducer can stay as dead code until T-13 confirms full removal; tests must be marked skip or deleted at T-13. | T-13 |
| Any component test that renders `<HomeClient>` inline and expects `buildTasks()` shape | HomeClient will receive tasks from props instead of calling `buildTasks()`. | T-10 |

Tests that are NOT expected to break: `DayTabs`, `Header`, `ProgressCircle`,
`TaskItem`, `TaskBlock`, `MicroHabits`, `useAuth`, `middleware-matcher`, `utils`,
`dates`, `login/page`, `register/page`.

---

## Ordered Work Units

Tasks are sequential unless explicitly marked **PARALLEL-SAFE**.

---

### PR-1 — DB Foundation

#### [x] T-01 · DB migration (DDL + RLS + trigger)
**Spec requirement**: routine-builder/spec.md §Data Model, §RLS, §Trigger
**Sequential** (no predecessor)

Steps:
1. Run `npx supabase init` if `supabase/` directory does not exist.
2. Create `supabase/migrations/<timestamp>_routine_builder.sql` containing:
   - Enums: `group_type` (`personal`, `shared`), `member_role` (`owner`, `member`).
   - Tables: `groups`, `group_members`, `routines`, `tasks`, `task_completions` with all columns from design §DDL.
   - `tasks.schedule` JSONB with CHECK `(schedule->>'type' = 'weekly')`.
   - Composite unique `(task_id, user_id, completed_date)` on `task_completions`.
   - Unique `(group_id, template_id)` on `routines`.
   - RLS `ENABLE ROW LEVEL SECURITY` on all 5 tables.
   - RLS policies: membership predicate (`group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())`) for `groups`, `group_members`, `routines`; join-through policy for `tasks` and `task_completions`.
   - `gm_self_owner_insert` policy: `user_id = auth.uid() AND group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())`.
   - `task_completions` write policy bound to `user_id = auth.uid()`.
   - `handle_new_user()` trigger: SECURITY DEFINER, `SET search_path = public`, on `auth.users AFTER INSERT`, creates Personal group + owner membership (idempotent via ON CONFLICT DO NOTHING).
3. Create `supabase/migrations/<timestamp>_routine_builder_down.sql` for rollback (DROP tables in reverse FK order, DROP enums, DROP trigger).
4. Document apply step in `openspec/changes/routine-builder-v2/apply-notes.md`:
   - `npx supabase link --project-ref <ref>`
   - `npx supabase db push`
   - Smoke queries to verify tables, RLS, and trigger exist.
5. NOT unit-testable via vitest — verified by apply step + manual smoke query.

**Done when**: migration file applies cleanly against a fresh Supabase project; smoke queries return expected schema.

---

### PR-2 — Types + Pure Seed Logic (TDD)

#### [x] T-02 · Domain types
**Spec requirement**: all three specs (shape of data returned from server)
**PARALLEL-SAFE with T-03/T-04 only if T-01 DDL is agreed**

Steps:
1. In `src/data/types.ts` add (or create `src/data/routine-types.ts`):
   - `DayName` (already exists as `type DayName`; confirm location).
   - `TaskSchedule = { type: 'weekly'; days: DayName[] }`.
   - `RoutineTask = { id: string; routineId: string; name: string; timeLabel: string | null; block: string; sortOrder: number; noCheck: boolean; assignedTo: string | null; schedule: TaskSchedule }`.
   - `Routine = { id: string; groupId: string; templateId: string; name: string }`.
   - `Completion = { taskId: string; userId: string; completedDate: string }`.
   - `Group = { id: string; name: string; type: 'personal' | 'shared'; createdBy: string }`.
   - `GroupMember = { groupId: string; userId: string; role: 'owner' | 'member' }`.
   - Retire `Person`, `CheckState` types only after T-13 confirms no remaining references.
2. Export from `src/data/index.ts` (or add barrel if missing).

**Done when**: `npm test` still green (no logic change, only type additions).

---

#### [x] T-03 · Write failing tests for `buildSeedTaskRows()`
**Spec requirement**: routine-builder/spec.md §Idempotent Seed
**Depends on**: T-02 (types)
**TDD STEP 1**

Create `src/data/__tests__/buildSeedTaskRows.test.ts`:

```
- returns one row per unique (id, timeLabel, block) combination
- accumulates schedule.days across all 7 days (a task appearing Mon+Fri has days: ['Lunes','Viernes'])
- sets assignedTo = null for all rows
- sets noCheck correctly from source buildTasks() data
- dedup key includes timeLabel so weekday vs weekend time variants produce separate rows
- total row count is <= sum of distinct task ids across all 7 days
```

Run `npm test -- buildSeedTaskRows` → MUST be RED before T-04.

**Done when**: tests exist and fail with "cannot find module" or function-not-found.

---

#### [x] T-04 · Implement `buildSeedTaskRows()` + update tasks tests
**Spec requirement**: routine-builder/spec.md §Idempotent Seed
**Depends on**: T-03
**TDD STEP 2**

1. Create `src/data/seedRows.ts` exporting `buildSeedTaskRows(): RoutineTask[]`.
   - Iterates all 7 DayNames calling `buildTasks(day, idx)`.
   - Dedup key: `${task.id}__${task.time ?? ''}__${task.block}`.
   - Accumulates `schedule.days`; first occurrence sets all other fields.
   - Maps `who` → `assigned_to = null` (Fase 1).
   - Maps `time` → `timeLabel`, `task` → `name`, `noCheck` passthrough.
   - Returns array sorted by `block` then `sortOrder` (or insertion order if sortOrder not yet in buildTasks).
2. Run `npm test -- buildSeedTaskRows` → MUST be GREEN.
3. Update `src/data/__tests__/tasks.test.ts`:
   - Keep `almuerzoPerson` tests (function may stay as internal utility).
   - Replace `buildTasks` structural tests with a note comment: "buildTasks is an internal utility; public contract is buildSeedTaskRows — see buildSeedTaskRows.test.ts".
   - OR: keep all existing tests if `buildTasks` remains exported (no breaking change), but add a `@deprecated` JSDoc.
   - Decision: keep `buildTasks` exported + deprecated; do NOT delete its tests; mark them with `// @legacy`.
4. Run full `npm test` → GREEN.

**Done when**: `buildSeedTaskRows.test.ts` green; `tasks.test.ts` not red; `npm test` fully green.

---

### PR-3 — Server Data Layer

#### [x] T-05 · `ensurePersonalGroup(userId)`
**Spec requirement**: routine-builder/spec.md §Personal Group Trigger (fallback path)
**Depends on**: T-01 (tables must exist), T-02 (types)
**Sequential**

1. Create `src/lib/routines/ensurePersonalGroup.ts`:
   - Uses `src/lib/supabase/server.ts` client.
   - SELECT existing personal group for userId from `group_members` JOIN `groups`.
   - If found: return `{ groupId }`.
   - If not found: INSERT into `groups` (name='Personal', type='personal', created_by=userId), then INSERT into `group_members` (owner). ON CONFLICT DO NOTHING on both. Return `{ groupId }`.
   - Throws on Supabase error.
2. NOT unit-testable in vitest without DB. Document as integration-tested via smoke query in apply-notes.md.

**Done when**: function compiles with no TS errors; `npm test` still green.

---

#### [x] T-06 · `seedDefaultRoutine(groupId)`
**Spec requirement**: routine-builder/spec.md §Idempotent Seed
**Depends on**: T-04 (buildSeedTaskRows), T-05 (ensurePersonalGroup pattern)
**Sequential**

1. Create `src/lib/routines/seedDefaultRoutine.ts`:
   - Calls `buildSeedTaskRows()` to get task definitions.
   - Guards with `maybeSingle()` on `routines` where `group_id = groupId AND template_id = 'default-couple'`. If routine already exists, return early (idempotent).
   - INSERT routine row (`template_id='default-couple'`, name='Rutina de pareja').
   - Bulk INSERT all `buildSeedTaskRows()` results into `tasks` with `routine_id` set. Uses `ON CONFLICT (id) DO NOTHING` (or a stable UUID derived from task id + routine_id).
   - Returns `{ routineId }`.
2. NOT unit-testable in vitest without DB.

**Done when**: compiles; `npm test` green.

---

#### [x] T-07 · Server fetch: routine + tasks + completions for today
**Spec requirement**: checklist-display/spec.md §Server Fetch, checklist-persistence/spec.md §Initial Load
**Depends on**: T-05, T-06
**Sequential**

1. Create `src/lib/routines/fetchDayData.ts`:
   - Accepts `(groupId: string, todayDate: string, dayName: DayName)`.
   - Fetches from `tasks` where `routine_id IN (SELECT id FROM routines WHERE group_id = groupId)` and filters in TS by `schedule.days.includes(dayName)`.
   - Fetches from `task_completions` where `task_id IN (taskIds)` AND `completed_date = todayDate`.
   - Returns `{ tasks: RoutineTask[]; completions: Completion[] }`.
2. NOT unit-testable in vitest without DB.

**Done when**: compiles; `npm test` green.

---

### PR-4 — page.tsx Split + Client Hooks (TDD)

#### [x] T-08 · Extract `HomeClient` from `page.tsx`
**Spec requirement**: checklist-display/spec.md §Component Architecture
**Depends on**: T-07
**Sequential**

1. Create `src/app/HomeClient.tsx` as a `'use client'` component.
   - Extract everything interactive from current `page.tsx` verbatim: `DayTabs`, `TaskBlock`, `TaskItem`, `ProgressCircle`, `Header`, `MicroHabits`.
   - Props interface: `{ tasks: RoutineTask[]; completions: Completion[]; todayDate: string; dayName: DayName }`.
   - Inside `HomeClient`, call `useChecklist(tasks, dayName)` and `useCompletions(taskIds, todayDate, completions)` (stubs acceptable if hooks not yet implemented — use prop passthrough for now).
2. `page.tsx` becomes a Server Component shell calling `ensurePersonalGroup` → `seedDefaultRoutine` → `fetchDayData` → `<HomeClient .../>`.
3. All existing component tests that reference page-level logic should still compile; no logic deleted yet.

**Done when**: app renders (dev server start check); `npm test` green.

---

#### [x] T-09 · Adapt `useChecklist` — drop `buildTasks()`, filter by schedule
**Spec requirement**: checklist-display/spec.md §Schedule Filtering
**Depends on**: T-08
**Sequential**

1. Rewrite `src/hooks/useChecklist.ts` (or rename to reflect new signature):
   - New signature: `useChecklist(tasks: RoutineTask[], dayName: DayName)`.
   - Filters `tasks` by `task.schedule.days.includes(dayName)`.
   - Orders by `task.block` then `task.sortOrder`.
   - Removes all calls to `buildTasks()`.
   - Returns same shape the existing components already expect (adapt field names: `name` → `task`, `timeLabel` → `time` if components still use old shape, OR update components simultaneously).
2. If component field names differ from `RoutineTask`, update `TaskItem`, `TaskBlock` prop interfaces now.
3. Remove `useLocalStorage` import from this hook; check state will come from `useCompletions` (wired in T-11).

**Done when**: `npm test` green; `TaskItem.test.tsx` and `TaskBlock.test.tsx` not broken.

---

#### [x] T-10 · Write failing tests for `useCompletions`
**Spec requirement**: checklist-persistence/spec.md §Optimistic Toggle
**Depends on**: T-09
**TDD STEP 1**

Create `src/hooks/__tests__/useCompletions.test.tsx`:

```
- initialises checked set from `initial` completions prop
- toggle: adds taskId to checked set optimistically before Supabase resolves
- toggle: calls supabase upsert with correct task_id, user_id, completed_date
- toggle: calls supabase delete when task was already checked
- rollback: reverts optimistic state when upsert throws
- rollback: reverts optimistic state when delete throws
- isChecked(taskId) returns true only for completed tasks
```

Mock `src/lib/supabase/client.ts` with `vi.mock`.

Run `npm test -- useCompletions` → MUST be RED.

**Done when**: tests exist and fail (no implementation yet).

---

#### [x] T-11 · Implement `useCompletions` + wire into `HomeClient`
**Spec requirement**: checklist-persistence/spec.md §Optimistic Toggle
**Depends on**: T-10
**TDD STEP 2**

1. Create `src/hooks/useCompletions.ts`:
   - Signature: `useCompletions(taskIds: string[], date: string, initial: Completion[])`.
   - State: `Set<string>` of completed taskIds (initialised from `initial`).
   - `toggle(taskId)`: optimistic set update → supabase upsert (`ON CONFLICT (task_id, user_id, completed_date) DO UPDATE SET updated_at = now()`) or delete → rollback on error.
   - `isChecked(taskId): boolean`.
   - Uses browser Supabase client from `src/lib/supabase/client.ts`.
2. Wire into `HomeClient`: replace any remaining `useLocalStorage` completion reads with `useCompletions`.
3. Run `npm test -- useCompletions` → GREEN.
4. Run full `npm test` → GREEN.

**Done when**: `useCompletions` tests green; HomeClient compiles; `npm test` green.

---

### PR-5 — Wire-up + Test Remediation

#### [x] T-12 · Remove `useLocalStorage` checklist usage; retire `CheckState` reducer from checklist
**Spec requirement**: checklist-persistence/spec.md §Retire localStorage
**Depends on**: T-11
**Sequential**

1. Remove `useLocalStorage` import and call sites in `page.tsx` / `HomeClient.tsx` / `useChecklist.ts` that served checklist state. (`useMicroHabits` MUST retain its own `useLocalStorage` call — do not touch.)
2. Verify `useLocalStorage` hook file itself can stay (still used by `useMicroHabits`).
3. `CheckState` type and `checklistReducer` can be retained as dead code or deleted — decision: DELETE both (`src/data/reducer.ts` and `src/data/types.ts` `CheckState` entries) only if no other consumer; otherwise mark `@deprecated`.
4. Delete or skip `src/data/__tests__/reducer.test.ts` if reducer is deleted. If kept deprecated, add skip comment.
5. Run `npm test` → GREEN.

**Done when**: no `useLocalStorage` calls in checklist path; `npm test` green.

---

#### [x] T-13 · Full regression + cleanup
**Spec requirement**: all three specs — end-to-end correctness
**Depends on**: T-12
**Sequential**

1. Run `npm test` — fix any remaining broken tests.
2. Verify no import of `buildTasks` outside of `src/data/tasks.ts` and `src/data/seedRows.ts`.
3. Verify `MicroHabits` tests still pass (no changes to that module).
4. Confirm `DayTabs`, `Header`, `ProgressCircle`, `TaskItem`, `TaskBlock` tests are green.
5. Manual smoke: start dev server, sign in, confirm checklist renders the seeded couple routine for today's weekday, confirm task toggle persists on reload.
6. If any component test imported `buildTasks` directly, update to use fixture data instead.
7. Update `openspec/changes/routine-builder-v2/apply-notes.md` with final apply instructions.

**Done when**: `npm test` fully green with no skips that were previously passing; dev server renders correct checklist.

---

## Dependency Graph

```
T-01 (DB)
  └── T-02 (Types)
        ├── T-03 (failing test: buildSeedTaskRows)
        │     └── T-04 (implement buildSeedTaskRows) ──────────────────┐
        └── T-05 (ensurePersonalGroup)                                  │
              └── T-06 (seedDefaultRoutine) ◄──────────────────────────┘
                    └── T-07 (fetchDayData)
                          └── T-08 (HomeClient extract)
                                └── T-09 (useChecklist adapt)
                                      └── T-10 (failing test: useCompletions)
                                            └── T-11 (implement useCompletions)
                                                  └── T-12 (retire localStorage/reducer)
                                                        └── T-13 (regression)
```

All tasks are strictly sequential. No parallel tracks in Fase 1 (single developer,
shared files throughout the dependency chain).

---

## Notes for `sdd-apply`

- `delivery_strategy`: `auto-chain`
- `chain_strategy`: `stacked-to-main`
- `size:exception` is NOT granted — respect the PR split above.
- Each PR boundary leaves `npm test` green and the app runnable.
- DB migration (T-01) ships as PR-1 with no application code changes.
- TDD tasks (T-03/T-10) must be committed with FAILING tests before their pair task (T-04/T-11) is started.
- Do NOT modify `useMicroHabits`, `BottomNav`, `SettingsPanel`, or any auth flow.
