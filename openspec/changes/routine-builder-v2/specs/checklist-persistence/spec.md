# checklist-persistence Specification (Routine Builder v2 delta)

## Purpose

Move completion state from flat localStorage (`couple-life-checklist`) to per-user, per-date rows
in the `task_completions` Supabase table. Completions are scoped by authenticated user so the
schema is correct for future multi-member use. The toggle interaction remains client-side (optimistic
update); persistence is via Supabase browser client upsert.

---

## MODIFIED Requirements

### Requirement: Completion Storage — Supabase task_completions (replaces localStorage)

The system MUST persist task completion state in the `task_completions` table, keyed by
`(task_id, user_id, completed_date)`. The localStorage key `couple-life-checklist` MUST NOT be
used for task completion state. `useLocalStorage` for checklist state MUST be removed from the
completion path.

#### Scenario: Completing a task writes to Supabase

- GIVEN an authenticated user views a task for today
- WHEN they toggle the task checkbox to completed
- THEN an upsert is issued to `task_completions` with `task_id`, `user_id = auth.uid()`, and
  `completed_date = today`

#### Scenario: Uncompleting a task removes the row

- GIVEN a task completion row exists for today
- WHEN the user toggles the checkbox to uncompleted
- THEN the corresponding row in `task_completions` is deleted

#### Scenario: Completion survives page refresh

- GIVEN the user completed task T on today's date
- WHEN they refresh the page
- THEN task T still appears checked (loaded from Supabase, not localStorage)

---

### Requirement: localStorage Removal

The STORAGE_KEY `couple-life-checklist` and any `useLocalStorage` calls related to checklist
completion MUST be removed. No fallback to localStorage is permitted in the completion read or write
path.

#### Scenario: No localStorage key written on completion

- GIVEN an authenticated user completes a task
- WHEN the toggle handler runs
- THEN no entry is written to `localStorage` under `couple-life-checklist` or any checklist key

---

### Requirement: Optimistic Toggle via Client Hook (useCompletions)

A client hook `useCompletions` MUST manage the toggle interaction. It MUST apply an optimistic
local state update immediately on toggle, then issue the Supabase upsert/delete. On error, the
optimistic state MUST be rolled back and the user MUST receive a visual indication of the failure.

#### Scenario: Optimistic check marks task immediately

- GIVEN the user taps a task checkbox
- WHEN the toggle fires (before the Supabase call resolves)
- THEN the checkbox appears checked immediately in the UI

#### Scenario: Network error rolls back optimistic state

- GIVEN the Supabase upsert fails (network error)
- WHEN the error is received
- THEN the checkbox reverts to its previous state
- AND a visual error indicator is shown to the user

---

### Requirement: Completion State Loaded on Page Fetch

Existing completions for the selected day MUST be fetched server-side alongside tasks. The Server
Component MUST query `task_completions` for the current user and today's date (or the selected
date) so the initial render reflects accurate state without a client-side loading flash.

#### Scenario: Previously completed tasks render as checked on load

- GIVEN user A completed task T yesterday
- WHEN user A views yesterday's checklist
- THEN task T renders as checked on initial page load (no flicker from unchecked to checked)

#### Scenario: Completion state is user-scoped

- GIVEN user A completed task T today
- WHEN user B views the same task for today
- THEN task T renders as unchecked for user B
