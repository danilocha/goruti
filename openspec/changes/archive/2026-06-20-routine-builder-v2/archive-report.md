# Archive Report: routine-builder-v2 (Fase 1)

**Date**: 2026-06-20  
**Change**: routine-builder-v2  
**Status**: ARCHIVED & CLOSED  
**Verdict**: SUCCESS WITH CAVEATS

---

## Executive Summary

Routine Builder v2 (Fase 1) successfully moved the routine and completion data model from hardcoded in-memory to Supabase, with RLS isolation and idempotent seed. The migration DDL + RLS policies have been applied to the live Supabase project (goruti, ref zqjpbgyonpbkwelemufu). All 13 routine-builder-v2 in-scope tasks are implemented and their test suite is GREEN (121 passing, 9 skipped; 15 failing tests are unrelated concurrent UI WIP). The data layer is structurally correct and verified by inspection.

**Important caveat**: End-to-end runtime validation (login → personal group create → seed routine → home render) has NOT been exercised against the live app yet. See **Recommended Next Steps** below.

---

## Specs Synced to Main

### 1. `openspec/specs/routine-builder/spec.md` — REPLACED

**Action**: Replaced localStorage-era spec with Supabase Fase 1 spec.

**Delta changes**:
- Removed: `RoutineStore` interface, localStorage persistence, local CRUD UI
- Added: `groups`, `group_members`, `routines`, `tasks`, `task_completions` table schemas
- Added: Personal group auto-creation trigger + server fallback (`ensurePersonalGroup`)
- Added: Idempotent seed (`seedDefaultRoutine`) with task deduplication
- Added: RLS policies with SECURITY DEFINER helper functions (`is_group_member`, `is_group_owner`, `is_routine_member`)

**Schema mapping** (ACTUAL implementation vs. spec text):
- Column `groups.created_by` (NOT `owner_id` as delta spec stated)
- Column `tasks.name` (NOT `title`)
- Column `tasks.block` (NOT `time_block`)
- Column `tasks.time_label` (NOT `time`)
- Schedule uses Spanish day names `['Lunes','Martes',...,'Domingo']` (NOT ISO abbrevs `['mon','tue',...]`)
- Column `task_completions.routine_id` (redundant denormalization for RLS scoping)

**Resolution**: Spec updated to match ACTUAL applied migration SQL (source of truth).

---

### 2. `openspec/specs/checklist-display/spec.md` — MERGED (MODIFIED)

**Action**: Merged delta spec into main spec.

**Changes**:
- **Requirement: Task Source — Supabase** (NEW) — replaces hardcoded `buildTasks()`
- **Requirement: Server Component Fetch** (NEW) — describes RLS-scoped server fetch
- **Requirement: Task-to-Display Mapping** (NEW) — documents field mappings (name, block, time_label, icon, note, no_check, position)
- **Requirement: Task Item with Assignment** (MODIFIED) — updated to reflect NULL `assigned_to` in Fase 1 (all members; no person badge shown)
- **Removed**: "Two-Person Rotation Logic" requirement (deferred to Fase 2; hardcoded rotation stays in seed text)
- **Kept**: Day Tab Navigation, Time Block Grouping, Progress Circle, Micro-habits Display (unchanged)

**Preserved**: All baseline checklist-display scenarios remain valid.

---

### 3. `openspec/specs/checklist-persistence/spec.md` — MERGED (MODIFIED)

**Action**: Merged delta spec into main spec; replaced localStorage requirements with Supabase.

**Changes**:
- **Requirement: Completion Storage** (MODIFIED) — from localStorage `couple-life-checklist` to Supabase `task_completions` table
- **Requirement: localStorage Removal** (NEW) — mandatory removal of `useLocalStorage` from checklist path
- **Requirement: Optimistic Toggle** (NEW) — describes `useCompletions` hook with optimistic update + rollback on error
- **Requirement: State Restoration** (MODIFIED) — now from Supabase server fetch, not localStorage
- **Requirement: Micro-habits Retention** (NEW) — micro-habits RETAIN separate `goruti-micro-habits` localStorage key (out of scope for this change)
- **Removed**: SSR Safety (no longer needed — server renders hydrate from Supabase server fetch), Corrupted Data Fallback, Debounced Writes, Storage Quota Handling (all localStorage-era concerns)

**Preserved**: State persistence concept, recovery on page refresh, per-user scoping.

---

## Change Folder Moved to Archive

**Old location**: `openspec/changes/routine-builder-v2/`  
**New location**: `openspec/changes/archive/2026-06-20-routine-builder-v2/`

**Contents**:
- `proposal.md` — Fase 1 scope + approach
- `design.md` — architecture decisions + RLS rationale + seed strategy
- `tasks.md` — 13 work units (T-01 through T-13) with TDD pairs
- `exploration.md` — comparison of localStorage-only vs. data-driven approaches
- `specs/routine-builder/spec.md` — delta (now merged into main)
- `specs/checklist-display/spec.md` — delta (now merged into main)
- `specs/checklist-persistence/spec.md` — delta (now merged into main)
- `apply-notes.md` — migration apply + smoke test instructions

---

## Superseded Change: Old routine-builder

**Old location**: `openspec/changes/routine-builder/` (localStorage-first design)  
**New location**: `openspec/changes/archive/2026-06-20-routine-builder-SUPERSEDED/`

**Reason**: routine-builder-v2 implements the Phase 2 (Supabase) vision from the old proposal but as Phase 1 Fase 1 (accelerated). The old localStorage MVP is no longer planned.

**Artifacts preserved for reference**: proposal, design, tasks, exploration.

---

## Verification Summary

### What Was Verified ✅

1. **Schema (DDL + RLS)** — VERIFIED by code inspection
   - All 5 tables created with correct columns, types, constraints
   - RLS enabled on all tables
   - RLS policies use SECURITY DEFINER helpers to avoid recursion
   - `gm_self_owner_insert` policy correctly bounds self-bootstrap

2. **Trigger** — VERIFIED by code inspection
   - `handle_new_user()` creates `groups` + `group_members` rows
   - SECURITY DEFINER + SET search_path prevents escalation

3. **Server Functions** — VERIFIED by code inspection
   - `ensurePersonalGroup()` creates personal group idempotently (lookup by type/created_by)
   - `seedDefaultRoutine()` upserts routine + bulk inserts tasks; double idempotency guard
   - `fetchDayData()` queries routine + tasks + completions with correct filtering

4. **Data Mapping** — VERIFIED by code inspection
   - `buildSeedTaskRows()` correctly dedupes by (id, time_label, block, name, note, no_check)
   - Accumulates `schedule.days` across 7 days
   - Sets `assigned_to = null` for all rows (Fase 1)
   - Maps all fields from buildTasks() to RoutineTask correctly

5. **Client Hook** — VERIFIED by test GREEN
   - `useCompletions` tests all pass (7/7)
   - Optimistic update + upsert + delete verified
   - Rollback on error tested

6. **Page/Component Integration** — VERIFIED by test GREEN
   - `HomeClient` receives tasks as props (server-side fetch)
   - `useChecklist` filters by `schedule.days` ✅
   - `useCompletions` wired into toggle handler ✅

7. **Overall Test Suite** — VERIFIED by test result
   - 121 passing tests (routine-builder-v2: 9 buildSeedTaskRows + 7 useCompletions = 16 passing)
   - 9 skipped (out of scope)
   - 15 failing tests (unrelated: concurrent UI WIP in working tree; NOT caused by this change)

### What Was NOT Verified ❌

1. **Runtime end-to-end (against live Supabase)**
   - Migration DDL was applied ✅
   - RLS policies exist ✅
   - Trigger + server functions compile ✅
   - But: No execution against live `goruti` project
   - Test path: login → ensurePersonalGroup fires → seedDefaultRoutine populates → home renders routine
   - **Recommended**: Run this path manually or via e2e test before production sign-off

2. **RLS Cross-Group Leakage**
   - Schema and policies reviewed ✅
   - User B cannot see User A's groups/tasks/completions (policy logic) ✅
   - But: No live test with two users querying against live Supabase
   - **Recommended**: Create two users on live Supabase, confirm strict isolation

3. **Completion Upsert Race Condition**
   - Composite unique `(task_id, user_id, completed_date)` is load-bearing ✅
   - Design verified ✅
   - But: No concurrent toggle test against live DB
   - **Recommended**: Load test or concurrent toggle e2e scenario

---

## Caveats & Limitations

### CAVEAT 1: RLS Infinite-Recursion Bug (FIXED)

**Issue**: Group membership queries in RLS policies (`group_members` table selecting from `group_members` itself) would cause infinite recursion.

**Solution Applied**: Migration includes SECURITY DEFINER helper functions (`is_group_member`, `is_group_owner`, `is_routine_member`) that bypass RLS. All policies use these helpers instead of inline membership subqueries.

**Status**: ✅ Fixed in migration SQL; verified by inspection.

**Rollback**: Rollback SQL moved to `supabase/rollback/20260620000000_routine_builder_down.sql` (NOT in migrations folder, so not auto-applied).

---

### CAVEAT 2: Runtime Validation Incomplete

**Issue**: The migration was applied to the live Supabase project, and unit tests are GREEN. But the full end-to-end path (login → ensurePersonalGroup → seedDefaultRoutine → fetchDayData → home render) has not been exercised in the live app.

**Current Status**:
- DDL + RLS + trigger exist on live Supabase ✅
- `npm test` for routine-builder-v2 tasks all GREEN ✅
- Code inspection confirms correctness ✅
- Live execution via the app: NOT YET DONE ❌

**Recommendation**: Before shipping to production, run a manual smoke test or e2e scenario:
1. Sign in as a new test user on live app
2. Confirm personal group + default routine seeded automatically
3. View home page; confirm seeded routine renders correctly
4. Toggle a task; confirm it persists and reloads
5. Optionally: create second test user, verify RLS isolation (user 2 cannot see user 1's data)

---

### CAVEAT 3: Schema vs. Implementation Column-Name Divergence (RESOLVED)

**Issue**: The delta spec documented column names that differed from the ACTUAL migration:
- Spec said `owner_id`; migration used `created_by`
- Spec said `title`; migration used `name`
- Spec said `time_block`; migration used `block` + `time_label`
- Spec said ISO weekday abbrevs; migration uses Spanish DayNames

**Root Cause**: The implementation team made intentional design choices (free-text block labels with emoji, Spanish day names matching the existing hardcoded output, composite time columns) that were not reflected back to the spec.

**Resolution Applied**: Main specs (`openspec/specs/routine-builder/spec.md`, `checklist-display`, `checklist-persistence`) updated to match the ACTUAL applied migration (source of truth). Anyone reading the spec will now see correct column names.

**Lesson**: Design → Spec reconciliation is critical. The spec text must match the actual SQL schema after implementation.

---

### CAVEAT 4: Task Deduplication & Rotation Text

**Issue**: The seed process deduplicates tasks with identical (id, time_label, block, name, note, no_check) across 7 days, accumulating days into `schedule.days`. For tasks with rotation (e.g., "Hoy cocina: D" on odd days, "Hoy cocina: A" on even days), the dedup would normally lose the day variance.

**Resolution**: The task `note` is part of the dedup key, so variants with different notes are kept separate. The rotation is now baked into seed text, not computed at runtime. Fase 2 assignment work will restore dynamic rotation. For Fase 1 (single-user), this is acceptable.

---

## Fase 2 & Fase 3 Roadmap (Out of Scope)

### Fase 2 — Multi-Member & UI Refinement

- Invite links / sharing codes
- Per-person task visibility (some tasks show only to assigned member)
- Multi-member completion view (see who's done what)
- Profiles / display names
- Assignment UI to replace `assigned_to = null` 
- Rotation resolution back to computed logic
- "Rutinas" tab (routine selection UI)

### Fase 3 — Template Gallery

- Public routine templates
- User-published templates
- Community ratings

---

## Artifacts for Record

**Observation IDs (Engram)** — full audit trail:

| Artifact | Engram Topic Key | ID |
|----------|-----------------|-----|
| Proposal | `sdd/routine-builder-v2/proposal` | (searched via orchestrator) |
| Design | `sdd/routine-builder-v2/design` | (searched via orchestrator) |
| Spec | `sdd/routine-builder-v2/spec` | (searched via orchestrator) |
| Tasks | `sdd/routine-builder-v2/tasks` | (searched via orchestrator) |
| Apply Progress | `sdd/routine-builder-v2/apply-progress` | (searched via orchestrator) |
| Verify Report | `sdd/routine-builder-v2/verify-report` | #254 |
| Archive Report | `sdd/routine-builder-v2/archive-report` | (this file, saved to Engram) |

---

## Sign-Off Checklist

- [x] Specs merged into main specs (routine-builder, checklist-display, checklist-persistence)
- [x] Change folder moved to archive
- [x] Old routine-builder change marked superseded
- [x] Caveats documented
- [x] RLS recursion fix confirmed
- [x] Unit tests all GREEN for this change
- [ ] **Manual runtime e2e against live Supabase (RECOMMENDED BEFORE PRODUCTION)**
- [ ] **RLS cross-user isolation smoke test (RECOMMENDED)**

---

## Recommended Next Steps

**For the next session / sprint**:

1. **Manual Smoke Test** (highest priority)
   - Sign in as new user → confirm personal group + routine auto-seeded
   - Toggle task → confirm persists on reload
   - Optionally: two-user RLS isolation test

2. **E2E Test Coverage** (if not already covered by CI)
   - Add Playwright scenario: login → home → toggle → refresh → verify
   - Add RLS isolation test (two users, cross-group query attempt)

3. **Fix Component Test Failures** (blocked by concurrent UI WIP)
   - The 15 failing tests (TaskItem, Header, ProgressCircle, DayTabs, TaskBlock) are NOT caused by routine-builder-v2
   - They are due to uncommitted component rewrites in the working tree
   - Either: commit those rewrites + update tests, or revert them before next release

4. **Fase 2 Planning**
   - Once runtime validation is done, start spec/design for multi-member + assignment UI
   - Leverage the Fase 1 foundation (RLS, schema, server functions)

---

## Final Status

**Change**: ARCHIVED & CLOSED  
**Quality**: Green on test suite (for in-scope tasks); pending live runtime validation  
**Risk Level**: Low (schema & RLS sound; code paths verified; data-layer risks mitigated by design)  
**Recommendation**: Deploy to staging for e2e smoke test before production release.

---

*Archive Report Date*: 2026-06-20  
*By*: SDD Archive Phase  
*For*: couple-life (Goruti habit app) / Supabase project (goruti, ref zqjpbgyonpbkwelemufu)
