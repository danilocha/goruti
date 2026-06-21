# Exploration: Dynamic Routine Builder

## Current State

The app currently has **hardcoded routines** in `src/data/tasks.ts` — a `buildTasks()` function that returns predefined `Task[]` arrays for each day of the week. The data flows like this:

```
buildTasks(dayName, dayIdx) → Task[]
    ↓
useChecklist hook (useMemo)
    ↓
ChecklistContext (providers.tsx)
    ↓
Page → TaskBlock → TaskItem (renders each task)
```

The `Task` type is flat: `{ id, time, block, task, who, icon, note?, noCheck? }`. There is no concept of routines, categories, tags, or user-defined task templates. The only "extra" tasks per day are hardcoded conditionals in `buildTasks()`.

**Checkbox state** is persisted to localStorage via `useLocalStorage` with 300ms debounce. **Micro-habits** are also localStorage-based. **Auth** is Supabase-based but no routine data is stored there.

### Key Data Model Gaps

| Concept | Current | Needed |
|---------|---------|--------|
| Routines | None (tasks are flat per day) | Named routines with schedules |
| Categories | Implicit via `block` string (e.g. "🌅 Mañana") | Explicit category model with color/icon |
| Tags | None | Tags for filtering/grouping |
| Task templates | None (each day hardcodes its tasks) | Reusable templates with params |
| Day assignment | Built into `buildTasks()` | Flexible day-of-week scheduling |
| "Rot" resolution | `resolveAssignee(dayIdx)` parity check | Dynamic per-instance assignment |

---

## Affected Areas

| File/Dir | Why Affected |
|----------|-------------|
| `src/data/types.ts` | New types: `Routine`, `TaskTemplate`, `Category`, `Tag`, `RoutineDay` |
| `src/data/tasks.ts` | `buildTasks()` will be replaced or made to read from stored routines |
| `src/data/constants.ts` | The `DAY` array stays, `WHO_STYLE` may expand |
| `src/hooks/useChecklist.ts` | Must read tasks from routine data instead of calling `buildTasks()` |
| `src/hooks/useLocalStorage.ts` | Must persist routines (or create new hook) |
| `src/app/providers.tsx` | May need a `RoutineContext` or expanded context |
| `src/app/page.tsx` | BottomNav needs a new tab for "Rutinas" |
| `src/app/page.tsx` | Current tab system only has home/progress/settings |
| `src/components/BottomNav.tsx` | Needs a 4th tab or routing change |
| `src/app/` | New route `/routines` (or integrate into existing tab system) |
| `middleware.ts` | The matcher must allow `/routines` |
| `src/data/reducer.ts` | May need reducer actions for routine CRUD |
| `src/data/dates.ts` | Unaffected (date logic is orthogonal) |
| `src/data/utils.ts` | `groupByBlock` stays; may add routine-related utilities |
| `src/lib/supabase/` | Backend tables if going server-side |

---

## Approaches

### Approach 1: localStorage MVP (Client-Side Only)

Keep everything client-side. Store routines and task templates in localStorage. Build a UI for routine creation/editing. Seed a default routine from the existing hardcoded data.

- **Types**: Add `Routine`, `TaskTemplate`, `Category`, `Tag` interfaces
- **Store**: Single localStorage key `goruti-routines` with all custom routines
- **Default**: On first load (no routines key), generate a default routine from `buildTasks()` logic
- **UI**: New `/routines` route (App Router page) or a tab within the existing SPA
- **Replacement**: `useChecklist` reads from the stored routine instead of calling `buildTasks()`
- **Hook**: New `useRoutines()` hook with CRUD methods + localStorage persistence

**Pros:**
- Zero backend changes — works immediately
- Same auth model (anonymous users can still use it)
- Fastest to implement
- No Supabase table design needed
- No migration risk

**Cons:**
- No multi-device sync
- Routines lost on data clear / browser change
- No sharing between couple members
- No RLS or user scoping
- localStorage has ~5MB limit (not a concern for routine data)

**Effort: Medium** (~3-5 days)

### Approach 2: Supabase-Backed with localStorage Fallback

Build Supabase tables (`routines`, `task_templates`, `categories`, `tags`) with RLS. Use the Supabase JS client for CRUD. Keep localStorage as a cache/fallback when offline.

- **Tables**: `routines` (id, user_id, name, description, created_at, updated_at), `routine_days` (id, routine_id, day_of_week), `task_templates` (id, routine_id, ...), `categories` (id, name, color, icon), `tags` (id, name, color), `routine_tags` (M2M)
- **RLS**: Each user sees their own routines; optionally share with partner
- **Seed**: Migration script imports the hardcoded tasks as a default routine
- **Fallback**: If Supabase fetch fails, fall back to localStorage seed data
- **UI**: Same as Approach 1, but API calls instead of localStorage

**Pros:**
- Multi-device sync
- Couple sharing (both see/edit same routines)
- Proper data ownership via RLS
- Future-proof for mobile app, webhooks, etc.
- Structured data for analytics later

**Cons:**
- Requires Supabase table migrations
- Auth dependency (must be logged in)
- Offline handling complexity
- Larger scope — more files, more tests
- Seed/migration script needed
- RLS policy design and testing

**Effort: High** (~7-10 days)

### Approach 3: Hybrid — localStorage MVP First, Supabase Later

Implement Approach 1 (localStorage MVP) as a first iteration. Extract a data access layer (`RoutineStore` interface) so the backend can be swapped to Supabase in a follow-up change without rewriting UI code.

- **Phase 1** (this change): localStorage-only, clean interface
- **Phase 2** (follow-up): Implement Supabase `RoutineStore`, add sync, keep localStorage as cache
- **Interface**: `RoutineStore` with `getRoutines()`, `saveRoutine()`, `deleteRoutine()`, `getDefaultRoutine()`

**Pros:**
- Delivers value fast
- Clean separation of concerns
- Easy migration path
- Users don't need to be logged in for basic usage
- Two smaller, reviewable PRs vs one giant one

**Cons:**
- Two changes to plan, spec, design, review
- Interface may need refactoring when Supabase real-time/sync is added
- Storage migration needed between phases

**Effort: Medium** (~3-5 days for Phase 1, then ~4-5 for Phase 2)

---

## Recommendation

**Approach 3 (Hybrid)** — localStorage MVP first with a clean `RoutineStore` abstraction.

**Why:**

1. The app currently works entirely client-side. Forcing a Supabase dependency for routine creation means logged-out users lose core functionality. Not acceptable for this domain.
2. The existing hardcoded data is rich (~120+ tasks across 7 days) and well-tested. We can seed it as a default routine and immediately demonstrate value.
3. The abstraction layer keeps options open. When Supabase support lands, it's a new `SupabaseRoutineStore` implementing the same interface — zero UI changes.
4. Two smaller changes = easier reviews, faster iteration, less risk.
5. The couple sharing feature (both partners see the same routines) is a future concern, not a blocker for Phase 1.

**What to build in Phase 1:**

- New types in `types.ts`
- `useRoutines` hook with localStorage persistence
- `RoutineStore` interface + `LocalStorageRoutineStore` implementation
- Default routine seed from existing `buildTasks()` logic
- Replace `buildTasks()` calls in `useChecklist` with store reads
- New page/route `/routines` with:
  - `RoutineList` — all created routines
  - `RoutineEditor` — create/edit with name, description, day assignment
  - `TaskForm` — add/edit tasks within a routine
  - `CategoryPicker` — simple inline category management
  - `TagInput` — basic multi-tag input
  - `DayPicker` — toggle days of the week
- Update `BottomNav` to include a "Rutinas" tab
- Update middleware matcher to allow `/routines`

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Scope creep: building a full CMS when a simple form suffices | Medium | Define strict MVP boundaries in spec. Tags and categories can be simple string arrays in Phase 1. |
| Replacing `buildTasks()` breaks existing checklist behavior | Low | Write adapter that returns the existing hardcoded data as a default routine. Existing tests for `buildTasks` confirm it works. |
| Drag-and-drop reordering complexity | Medium | Use `framer-motion` (already a dependency) Reorder component, or implement simple up/down buttons as a fallback. |
| localStorage schema migration if types change later | Low | Version the stored schema. On version mismatch, regenerate from seed. |
| Routing change: adding `/routines` vs keeping SPA tabs | Low | Either approach works. Consider App Router's nested layouts for clean tabs vs new page. |

---

## Ready for Proposal

**Yes** — this exploration has identified the approaches, risks, and a clear recommendation. The orchestrator should proceed to `sdd-propose` with the recommended Approach 3 (Hybrid localStorage-first).

**Key info for the orchestrator to communicate to the user:**
- The change affects the data model, hooks, components, routing, and persistence layers.
- Phase 1 (this change) keeps everything client-side. No Supabase schema changes needed.
- The existing hardcoded routines become the default "seed" routine — no data loss.
- The user should weigh whether drag-and-drop reordering is a hard requirement for MVP or can be up/down buttons initially.
