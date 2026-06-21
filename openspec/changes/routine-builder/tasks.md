# Tasks: Dynamic Routine Builder

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

| Field | Value |
|-------|-------|
| Estimated changed lines | ~550–680 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation + Hook (Phases 1–2) → PR 2: Navigation + UI (Phases 3–4) → PR 3: Polish (Phase 5) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types, RoutineStore, seed, useRoutines, useChecklist integration | PR 1 | base=main; standalone — checklist still works, no UI yet |
| 2 | 4th tab, /rutinas route, builder components | PR 2 | base=main; depends on Phase 1 types but not on PR 1 branch |
| 3 | Polish, final tests, verify no regressions | PR 3 | base=main; done after PR 2 merges |

## Phase 1: Foundation — Types, Store, Seed

- [ ] 1.1 Add `TaskTemplate`, `Routine`, `Category`, `Tag` interfaces to `src/data/types.ts`
- [ ] 1.2 Add `STORAGE_KEY_ROUTINES = "goruti-routines"` to `src/data/constants.ts`
- [ ] 1.3 Create `src/data/routine-store.ts` — `RoutineStore` interface, `generateSeedRoutine()` (calls `buildTasks()` × 7, deduplicates by ID, handles variant tasks like `"lev"` with different times), `LocalStorageRoutineStore` class with get/save/delete/getTasksForDay + singleton export
- [ ] 1.4 Write unit tests: `generateSeedRoutine()` output matches `buildTasks()` per day, CRUD lifecycle, first-load seed, `getTasksForDay` filtering by `scheduledDays`, TaskTemplate→Task conversion with Rot resolution

## Phase 2: Hook + Integration — useRoutines, useChecklist

- [ ] 2.1 Create `src/hooks/useRoutines.ts` — wraps `LocalStorageRoutineStore` singleton, reactive state via `useState` + `useSyncExternalStore` or event-based re-render on CRUD
- [ ] 2.2 Modify `src/hooks/useChecklist.ts` — replace `buildTasks(selectedDay, dayIdx)` with `store.getTasksForDay(selectedDay, dayIdx)`; replace `buildTasks()` in `dayProgressMap` loop with store reads
- [ ] 2.3 Write unit tests: `useRoutines` CRUD reflects in store, `getTasksForDay` from hook returns correct task list per day, integration with `useChecklist` (mock store, verify tasks match seed)

## Phase 3: Navigation — 4th Tab in BottomNav

- [ ] 3.1 Modify `src/components/BottomNav.tsx` — add `"rutinas"` to `Props.activeTab` union type, add 4th `TabDef` with id `"rutinas"`, label `"Rutinas"`, icon `"edit_note"`
- [ ] 3.2 Modify `src/components/BottomNav.module.css` — verify flex `space-around` handles 4 items cleanly; no CSS change needed if flex auto-sizes
- [ ] 3.3 Modify `src/app/page.tsx` — add `"rutinas"` to `activeTab` union, render `RoutineBuilder` component when `activeTab === "rutinas"`, add `history.replaceState()` sync on tab change
- [ ] 3.4 Add `/rutinas` to `src/app/providers.tsx` `isPublicRoute` check (client-side auth guard) and `middleware.ts` `publicRoutes` array
- [ ] 3.5 Write component test: BottomNav renders 4 tabs, clicking "Rutinas" calls `onTabChange("rutinas")`

## Phase 4: Builder UI — /rutinas Route and Components

- [ ] 4.1 Create `src/app/rutinas/page.tsx` — `RoutineBuilder` orchestrator component using `useRoutines`, manages editing state (selected routine, editor open/closed)
- [ ] 4.2 Create `src/app/rutinas/RoutineList.tsx` + `.module.css` — renders `RoutineCard` (name, description, task count, edit/delete buttons) + "Crear rutina" button
- [ ] 4.3 Create `src/app/rutinas/RoutineEditor.tsx` + `.module.css` — dialog or inline form with name input, description, save/cancel, manages list of `TaskTemplate` entries
- [ ] 4.4 Create `src/app/rutinas/TaskForm.tsx` + `.module.css` — form row with description, time, block (select), who (D/A/Rot/DA), icon picker, ↑↓ reorder buttons, delete button
- [ ] 4.5 Create `src/app/rutinas/DayPicker.tsx` + `.module.css` — 7 toggle buttons (Lun–Dom), sends `DayName[]` up
- [ ] 4.6 Create `src/app/rutinas/CategoryPicker.tsx` + `.module.css` — select from seed categories (unique `block` values) + custom category input
- [ ] 4.7 Create `src/app/rutinas/TagInput.tsx` + `.module.css` — free-form text input, adds tags on Enter/comma, renders as removable chips
- [ ] 4.8 Write component tests: RoutineEditor add/edit/delete task flow, DayPicker day toggle, CategoryPicker selection, TagInput add/remove

## Phase 5: Polish + Regression Tests

- [ ] 5.1 Verify "Delete last routine" scenario: deleting the only routine re-seeds the default from `buildTasks()`
- [ ] 5.2 Verify edit routine preserves completions: mutate task name/schedule, confirm `CheckState` entries survive
- [ ] 5.3 Run full test suite — all existing `buildTasks` tests pass unchanged, no regressions in reducer, utils, or component tests
