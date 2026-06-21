# Design: Dynamic Routine Builder

## Technical Approach

Phase 1 of the hybrid strategy: localStorage-first with a `RoutineStore` interface so a `SupabaseRoutineStore` can replace it later without UI changes. Seed from `buildTasks()` on first load for zero-breaking-change migration. Extend the existing SPA tab system with URL-aware tab switching rather than splitting into separate routes.

## Architecture Decisions

### Decision: Tab Routing Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Separate App Router pages (`/rutinas`, `/progreso`) | Cleaner URLs, but needs shared layout refactor; breaks current animations | **Rejected** — too much restructuring for Phase 1 |
| Query param tabs (`/?tab=rutinas`) | Simple but ugly URLs | **Rejected** |
| Tab state + `history.replaceState` sync | SPA-fast, clean URLs, minimal refactor | **Chosen** — 4th tab in `activeTab` union, syncs to pathname via `window.history.replaceState()` |

### Decision: Seed Strategy

Build a `generateSeedRoutine()` that calls `buildTasks()` for all 7 days, de-duplicates tasks by stable ID, and assigns `scheduledDays[]` per task. This produces one Routine named "Rutina predeterminada" matching today's exact output — zero behavior change.

### Decision: Stable Task UUIDs

Task IDs from `buildTasks()` (e.g. `"lev"`, `"x1"`) are kept as-is for the seed. New user-created tasks get `crypto.randomUUID()`. Completion state in `CheckState` keys off `task.id` — as long as IDs don't change, completions survive edits.

### Decision: Up/Down Reorder

No drag-and-drop. Each `TaskTemplate` in the editor gets ↑↓ buttons that swap `index` positions in the `tasks[]` array. Minimal complexity, no new dependencies.

## Type Definitions

```typescript
// New — added to src/data/types.ts

export interface TaskTemplate {
  id: string;                    // Stable UUID (seed reuses existing IDs)
  description: string;           // Was `task` in Task
  category: string;              // Phase 1: maps from block string
  tags: string[];                // Free-form tags
  time: string;                  // e.g. "7:30"
  block: string;                 // e.g. "🌅 Mañana"
  who: Person;                   // D | A | Rot | DA
  icon: string;                  // e.g. "⏰"
  note?: string;
  noCheck?: boolean;
  scheduledDays: DayName[];      // Which days this task applies to
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  tasks: TaskTemplate[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}
```

## RoutineStore Interface & Implementation

```typescript
// src/data/routine-store.ts

export interface RoutineStore {
  getRoutines(): Routine[];
  saveRoutine(routine: Routine): void;
  deleteRoutine(id: string): void;
  /** Returns Task[] (same shape as buildTasks) for a given day */
  getTasksForDay(dayName: DayName, dayIdx: number): Task[];
}

// LocalStorageRoutineStore
// Key: "goruti-routines"
// On init: if key missing → generateSeedRoutine() → persist
// getTasksForDay: finds active routine, filters tasks where
//   scheduledDays includes dayName, converts TaskTemplate → Task,
//   resolves "Rot" via resolveAssignee(dayIdx)
```

**Seed flow**: `generateSeedRoutine()` collects all unique task IDs across 7 days of `buildTasks()`, merges their `scheduledDays`. If the same ID has differing properties (e.g., `"lev"` at 6:00 weekdays vs 7:30 weekends), creates separate `TaskTemplate` entries with different day subsets.

## Data Flow

```
                 First load (no localStorage)
                        │
              generateSeedRoutine()
              ┌─────────┴──────────┐
              │  buildTasks() × 7  │
              └─────────┬──────────┘
                        │
              LocalStorageRoutineStore
              ┌─────────┴──────────┐
              │  goruti-routines   │  ← localStorage key
              └─────────┬──────────┘
                        │
              useRoutines() hook     ← new
              ┌─────────┴──────────┐
              │  CRUD + reactive   │
              └─────────┬──────────┘
                        │
              getTasksForDay(dayName, dayIdx)
                        │
              ┌─────────┴──────────┐
              │ TaskTemplate → Task│
              │ resolve Rot        │
              └─────────┬──────────┘
                        │
              useChecklist (modified)
              ┌─────────┴──────────┐
              │  buildTasks() →    │
              │  store.getTasks()  │
              └─────────┬──────────┘
                        │
              groupByBlock → TaskBlock → TaskItem
                  (unchanged downstream)
```

## Component Tree (Routine Builder UI)

```
RoutineBuilder (page.tsx — "rutinas" tab)
├── RoutineList
│   ├── RoutineCard × N
│   └── "Crear rutina" button
├── RoutineEditor (dialog or inline)
│   ├── NameInput
│   ├── TaskForm (repeating)
│   │   ├── DescriptionInput
│   │   ├── TimeInput
│   │   ├── BlockPicker (select)
│   │   ├── WhoPicker (D/A/Rot/DA)
│   │   ├── IconPicker
│   │   ├── DayPicker (7 toggle buttons)
│   │   ├── CategoryPicker
│   │   ├── TagInput
│   │   └── ↑↓ reorder buttons
│   └── Save / Cancel
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/data/types.ts` | Modify | Add `TaskTemplate`, `Routine`, `Category`, `Tag` interfaces |
| `src/data/routine-store.ts` | Create | `RoutineStore` interface + `LocalStorageRoutineStore` + seed logic |
| `src/data/constants.ts` | Modify | Add `STORAGE_KEY_ROUTINES = "goruti-routines"` |
| `src/hooks/useRoutines.ts` | Create | React hook: wraps store, reactive CRUD |
| `src/hooks/useChecklist.ts` | Modify | Replace `buildTasks()` with `store.getTasksForDay()` |
| `src/app/page.tsx` | Modify | Add `"rutinas"` to `activeTab` union; `history.replaceState` sync |
| `src/components/BottomNav.tsx` | Modify | 4th tab "Rutinas" between Progreso and Configuración |
| `src/components/BottomNav.module.css` | Modify | Grid layout from 3 to 4 columns |
| `src/app/rutinas/` | Create | Builder components directory |
| `middleware.ts` | Modify | Add `/rutinas` to public routes |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `generateSeedRoutine()` produces correct day mapping | Compare against existing `buildTasks()` output per day |
| Unit | `LocalStorageRoutineStore` CRUD | Mock localStorage, verify get/save/delete lifecycle |
| Unit | `getTasksForDay` filters by `scheduledDays` | Template with [Lun, Mie, Vie] → verify output per day |
| Unit | `TaskTemplate` → `Task` conversion + Rot resolution | Known inputs → expected output |
| Component | RoutineEditor: add/edit/delete task | Vitest + RTL |
| Component | BottomNav 4 tabs | Render + click test |
| E2E | Full create routine → see tasks in checklist | Playwright |

Existing `buildTasks` tests remain unchanged and serve as seed regression tests.

## Open Questions

- [ ] Seed dedup: handle same-ID tasks with different properties (e.g. `"lev"` has different `time` on weekdays vs weekends) — create separate TaskTemplate entries per variant?
- [ ] Multiple routines: in Phase 1, only one routine is active. How does the user select which routine drives today's checklist? (Simplest: "active routine" flag.)
- [ ] Category initial seed: should we extract unique `block` values from `buildTasks()` output as seed categories?
