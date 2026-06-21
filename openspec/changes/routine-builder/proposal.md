# Proposal: Dynamic Routine Builder (Phase 1)

## Intent

Replace hardcoded routines (`buildTasks()`) with a dynamic, user-editable routine system. Users can create, edit, and manage daily routines — task templates, categories, tags, and day-of-week scheduling — while keeping everything client-side. Hardcoded data becomes the default seed routine so no existing behavior breaks.

## Scope

### In Scope
- New types: `Routine`, `TaskTemplate`, `Category`, `Tag`, `RoutineDay`
- `RoutineStore` interface + `LocalStorageRoutineStore` implementation
- `useRoutines` hook (CRUD + localStorage persistence)
- Seed default routine from existing `buildTasks()` data on first load
- Replace `buildTasks()` calls in `useChecklist` with routine store reads
- New `/routines` page: `RoutineList`, `RoutineEditor`, `TaskForm`, `DayPicker`, `CategoryPicker`, `TagInput`
- 4th "Rutinas" tab in `BottomNav`
- Middleware matcher update for `/routines`

### Out of Scope
- Supabase backend / multi-device sync (Phase 2)
- Drag-and-drop reordering (MVP uses up/down buttons)
- Routine sharing between couple members
- Routine analytics or completion tracking

## Capabilities

### New Capabilities
- `routine-builder`: Create, edit, delete routines with task templates, categories, tags, and day-of-week scheduling. Seed default routine from existing data. Provide data access abstraction (`RoutineStore`).

### Modified Capabilities
- `app-navigation`: Expand bottom tab bar from 3 to 4 tabs — add "Rutinas" tab between Progreso and Ajustes.

## Approach

Hybrid localStorage-first (Approach 3 from exploration). Define a `RoutineStore` interface in `src/data/routine-store.ts`. Implement `LocalStorageRoutineStore` that persists to key `goruti-routines`. Seed from `buildTasks()` on first load. `useChecklist` reads tasks via the store instead of calling `buildTasks()`. Build UI components under a new `/routines` route, add the tab to `BottomNav`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/data/types.ts` | Modified | New types: `Routine`, `TaskTemplate`, `Category`, `Tag`, `RoutineDay` |
| `src/data/tasks.ts` | Modified | `buildTasks()` kept as seed source; no longer primary data source |
| `src/data/routine-store.ts` | New | `RoutineStore` interface + `LocalStorageRoutineStore` |
| `src/hooks/useChecklist.ts` | Modified | Read tasks from routine store instead of `buildTasks()` |
| `src/hooks/useRoutines.ts` | New | CRUD hook wrapping `RoutineStore` |
| `src/app/page.tsx` | Modified | Add 4th tab routing |
| `src/components/BottomNav.tsx` | Modified | Add "Rutinas" tab |
| `src/app/rutinas/` | New | Route + page + editor components |
| `middleware.ts` | Modified | Allow `/rutinas` route |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep: building a full CMS when simple UI suffices | Medium | Strict MVP boundaries in spec; simple string arrays for tags/categories in Phase 1 |
| Replacing `buildTasks()` breaks checklist | Low | Adapter returns hardcoded data as default routine; existing tests confirm baseline |

## Rollback Plan

1. Revert `useChecklist` to call `buildTasks()` directly
2. Remove `/rutinas` route and revert `BottomNav` to 3 tabs
3. Revert `middleware.ts` matcher
4. Delete `src/data/routine-store.ts` and `src/hooks/useRoutines.ts`
5. Revert type additions in `src/data/types.ts`
6. Keep localStorage seed routine key — harmless orphan

## Dependencies

- `framer-motion` (already in project) for task reorder animations (optional, for up/down buttons)
- No Supabase or backend changes needed

## Success Criteria

- [ ] Users can create, edit, and delete routines from the UI
- [ ] Existing checklist displays the default seeded routine — no behavior change
- [ ] Task completion state persists independently of routine structure
- [ ] All existing tests pass without modification
- [ ] First-time visit seeds a default routine matching the old hardcoded data
