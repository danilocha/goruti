# checklist-display Specification (Routine Builder v2 delta)

## Purpose

Render the daily checklist from Supabase instead of the hardcoded `buildTasks()` function. Tasks
are fetched server-side via a Server Component using RLS-scoped data. The visual presentation
requirements (day tabs, time blocks, person assignment, progress circles, micro-habits) defined in
the baseline spec remain in effect unless explicitly superseded below.

---

## MODIFIED Requirements

### Requirement: Task Source — Supabase (replaces hardcoded buildTasks)

The system MUST source all tasks for the checklist from the `tasks` and `routines` tables in
Supabase. The `buildTasks()` function MUST NOT be called in the read path. A Server Component MUST
fetch tasks using the Supabase server client (RLS-scoped).

Tasks for the selected day MUST be filtered by:
1. The user's personal group routines.
2. The routine's `schedule.days` array — only routines that include the selected ISO weekday are
   shown.
3. The task's `time_block` value (`morning` | `afternoon` | `night`) maps to the existing display
   blocks ("Mañana" | "Tarde" | "Noche").

#### Scenario: Day with tasks in schedule

- GIVEN a routine with `schedule = { type: "weekly", days: ["mon","wed","fri"] }`
- AND today is Monday (selected)
- WHEN the page renders
- THEN tasks belonging to that routine are displayed grouped by time_block

#### Scenario: Day not in schedule shows no tasks from that routine

- GIVEN a routine with `schedule = { type: "weekly", days: ["mon","wed","fri"] }`
- AND the user selects Tuesday
- WHEN the page renders
- THEN no tasks from that routine appear

#### Scenario: No routines seeded yet

- GIVEN the user's personal group has no routines (seed has not run)
- WHEN the page renders
- THEN an empty state is shown (no hardcoded tasks appear)

---

### Requirement: Server Component Fetch

The page component responsible for fetching tasks MUST be a React Server Component. It MUST use
`createServerClient` (the SSR Supabase client with cookie access) so that RLS applies
automatically. No tasks may be returned from a non-authenticated context.

#### Scenario: Authenticated user sees their tasks

- GIVEN an authenticated user with a seeded personal routine
- WHEN the Server Component fetches tasks for the selected day
- THEN tasks from that user's routines are returned

#### Scenario: Unauthenticated request never reaches data fetch

- GIVEN an unauthenticated request (middleware already redirects to /login)
- WHEN the Server Component would execute
- THEN it is never reached because middleware redirects first
  (No change to middleware behavior — this scenario confirms the existing guard still applies.)

---

### Requirement: Task-to-Display Mapping

Each task row from Supabase MUST map to the existing `TaskItem` display contract:
- `title` → task description displayed in the `TaskItem`
- `time_block` → determines which time block section the task renders under
- `sort_order` → tasks within a block MUST be rendered in ascending `sort_order`
- `assigned_to` is NULL in Fase 1; the display MUST handle NULL gracefully (no person badge shown,
  or a default "both" state — exact UI TBD in design)

#### Scenario: Tasks ordered by sort_order

- GIVEN a time block with tasks at sort_order 1, 3, 2
- WHEN the block renders
- THEN tasks appear in order: 1, 2, 3

#### Scenario: NULL assigned_to renders without crash

- GIVEN a task with assigned_to = NULL
- WHEN the TaskItem renders
- THEN no runtime error occurs and the task is displayed
