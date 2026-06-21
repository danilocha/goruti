# Checklist Display Specification

## Purpose

Render a 7-day household checklist. Each day shows color-coded tabs, time-blocked task groups, individual task items, progress circles, and micro-habits. Tasks are fetched server-side from Supabase instead of hardcoded `buildTasks()`. The visual presentation requirements (day tabs, time blocks, progress circles, micro-habits) from the baseline spec remain in effect.

## Requirements

### Requirement: Task Source — Supabase (replaces hardcoded buildTasks)

The system MUST source all tasks for the checklist from the `tasks` and `routines` tables in
Supabase. The `buildTasks()` function MUST NOT be called in the read path. A Server Component MUST
fetch tasks using the Supabase server client (RLS-scoped).

Tasks for the selected day MUST be filtered by:
1. The user's personal group routines.
2. The routine's `schedule.days` array — only routines that include the selected Spanish day name are shown (e.g., `'Lunes'`, `'Martes'`, etc.).
3. The task's `block` value maps to the existing display blocks ("🌅 Mañana" | "🌤️ Tarde" | "🌙 Noche").

#### Scenario: Day with tasks in schedule

- GIVEN a routine with `schedule = { type: "weekly", days: ["Lunes","Miércoles","Viernes"] }`
- AND today is Monday (Lunes, selected)
- WHEN the page renders
- THEN tasks belonging to that routine are displayed grouped by block

#### Scenario: Day not in schedule shows no tasks from that routine

- GIVEN a routine with `schedule = { type: "weekly", days: ["Lunes","Miércoles","Viernes"] }`
- AND the user selects Tuesday (Martes)
- WHEN the page renders
- THEN no tasks from that routine appear

#### Scenario: No routines seeded yet

- GIVEN the user's personal group has no routines (seed has not run)
- WHEN the page renders
- THEN an empty state is shown (no hardcoded tasks appear)

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

### Requirement: Day Tab Navigation

The system MUST render 7 day tabs (Lunes–Domingo). Each tab SHALL display the day name in Spanish. The selected tab MUST use that day's color palette. Tabs SHALL be keyboard-navigable.

#### Scenario: Switch between days

- GIVEN Monday (Lunes) is displayed
- WHEN the user clicks "Miércoles"
- THEN Wednesday's tasks and colors render

#### Scenario: Keyboard navigation

- GIVEN the checklist is displayed
- WHEN the user Tabs to the next day and presses Enter
- THEN that day's tasks appear

### Requirement: Time Block Task Grouping

Tasks MUST be grouped under time blocks (with free-text labels like "🌅 Mañana", "🌤️ Tarde", "🌙 Noche") in the order they appear in the data. Each block SHALL display a header and its tasks.

#### Scenario: Tasks under correct block

- GIVEN the user views "Lunes" (Monday) with seeded couple routine
- WHEN the page renders
- THEN tasks appear under their respective block headers (by `block` field)

#### Scenario: Empty time block omitted

- GIVEN a day has no tasks for a time block
- WHEN the page renders
- THEN that block header is not displayed

### Requirement: Task Item with Assignment

Each task MUST show its description (`name`), optional icon, optional time label (`time_label`), note, and a checkbox. In Fase 1, `assigned_to` is always null (all members); the UI SHALL handle NULL gracefully.

#### Scenario: Task shows description and icon

- GIVEN a task with name "Desayuno", icon "🍳", and block "🌅 Mañana"
- WHEN the task renders
- THEN it shows the description, icon, and checkbox

#### Scenario: NULL assigned_to renders without crash

- GIVEN a task with assigned_to = NULL
- WHEN the TaskItem renders
- THEN no runtime error occurs and the task is displayed (no person badge shown in Fase 1)

### Requirement: Progress Circle Per Day

Each day MUST show an SVG circular progress indicator: percentage of completed tasks, with a stroke in the day's color.

#### Scenario: Progress at 50%

- GIVEN 3 of 6 tasks completed for Lunes
- WHEN viewing Lunes
- THEN the circle shows 50% with a half-filled arc

#### Scenario: Full progress

- GIVEN all tasks completed for a day
- WHEN that tab is selected
- THEN the circle shows 100% with a full arc

### Requirement: Task-to-Display Mapping

Each task row from Supabase MUST map to the display contract:
- `name` → task description displayed in the `TaskItem`
- `block` → determines which time block section the task renders under (free-text, e.g. "🌅 Mañana")
- `time_label` → optional time annotation (e.g. "6:30" or "7–9am")
- `icon` → optional emoji or icon string
- `note` → optional descriptive note
- `no_check` → if true, task is informational and not checkable
- `position` → tasks within a block MUST be rendered in ascending `position` order
- `assigned_to` is NULL in Fase 1; the display MUST handle NULL gracefully (no person badge shown)

#### Scenario: Tasks ordered by position

- GIVEN a time block with tasks at position 1, 3, 2
- WHEN the block renders
- THEN tasks appear in order: 1, 2, 3

#### Scenario: All task fields render correctly

- GIVEN a task with name, icon, block, time_label, note, and no_check
- WHEN the TaskItem renders
- THEN all non-null fields are displayed; null fields are omitted gracefully

### Requirement: Micro-habits Display

Micro-habits SHALL render in a visually distinct section, separate from time-blocked tasks.

#### Scenario: Micro-habits section visible

- GIVEN the user views any day tab
- WHEN the page renders
- THEN micro-habits appear in their own section

#### Scenario: No micro-habits defined

- GIVEN a day with no micro-habits
- WHEN the page renders
- THEN no micro-habits section is shown
