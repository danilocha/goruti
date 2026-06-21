# Routine Builder Specification (Fase 1)

## Purpose

Provide a data-driven routine core backed by Supabase. Replaces hardcoded `buildTasks()` and the
localStorage-era model. Defines the canonical data model, access isolation, and the bootstrap
sequence (personal group auto-creation + idempotent seed).

> **Fase 1 scope:** single personal group, single member (the owner). Forward-compatible columns
> (`assigned_to`, `invite_code`) are present in the schema but unused by the application in Fase 1.

---

## REQUIREMENTS

### Requirement: Data Model — groups

The system MUST define a `groups` table with at minimum: `id` (uuid PK), `name` (text), `type`
(text, values `personal` | `shared`), `created_by` (uuid → auth.users), `invite_code` (text,
nullable — unused Fase 1), `created_at` (timestamptz). RLS MUST restrict SELECT/INSERT/UPDATE to
rows where the authenticated user is a member of the group.

#### Scenario: Owner can read their group

- GIVEN a user is authenticated
- WHEN they query the `groups` table
- THEN they see only groups where they are a member via `group_members`

#### Scenario: Non-member cannot read another user's group

- GIVEN user B is authenticated
- WHEN they query `groups` for a group owned by user A (and B is not a member)
- THEN zero rows are returned

---

### Requirement: Data Model — group_members

The system MUST define a `group_members` table with at minimum: `group_id` (uuid →
groups), `user_id` (uuid → auth.users), `role` (text, values `owner` | `member`), `joined_at`
(timestamptz). A user MUST appear in `group_members` for any group they can access.

#### Scenario: Member row present for owner

- GIVEN a personal group is auto-created for a new user
- WHEN the `group_members` table is queried for that group
- THEN exactly one row exists with `user_id` = the owner and `role` = `owner`

---

### Requirement: Data Model — routines

The system MUST define a `routines` table with at minimum: `id` (uuid PK), `group_id` (uuid →
groups), `name` (text), `template_id` (text, nullable — used for idempotent seed),
`created_at` (timestamptz). RLS MUST restrict access to routines whose `group_id` belongs to a 
group the user is a member of.

#### Scenario: Routine is group-scoped

- GIVEN user A has a personal routine
- WHEN user B (not a member of A's group) queries `routines`
- THEN they see zero rows from A's group

#### Scenario: Routine seed is idempotent

- GIVEN a routine row is inserted with `group_id` and `template_id = 'couple-default'`
- WHEN the seed runs again
- THEN no duplicate routine is created (unique constraint on (group_id, template_id))

---

### Requirement: Data Model — tasks

The system MUST define a `tasks` table with at minimum: `id` (uuid PK), `routine_id` (uuid →
routines), `name` (text), `block` (text, free text including emoji e.g. "🌅 Mañana"), 
`time_label` (text, optional free text), `icon` (text), `note` (text), `no_check` (boolean), 
`schedule` (jsonb, shape `{ type: 'weekly', days: DayName[] }` where days are Spanish day names 
e.g. `['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']`), `assigned_to` 
(uuid[], nullable — all members if null), `position` (integer), `created_at` (timestamptz). 
RLS MUST restrict access to tasks whose `routine_id` belongs to a routine accessible to the user.

#### Scenario: Task inherits group isolation

- GIVEN user A has tasks in their personal routine
- WHEN user B queries `tasks`
- THEN they see zero rows from A's routines

#### Scenario: Task schedule is stored as tagged jsonb

- GIVEN a task with `schedule = { "type": "weekly", "days": ["Lunes","Miércoles","Viernes"] }`
- WHEN the application reads the schedule
- THEN it interprets the routine as active on Monday, Wednesday, and Friday

---

### Requirement: Data Model — task_completions

The system MUST define a `task_completions` table with at minimum: `id` (uuid PK), `task_id` (uuid
→ tasks), `user_id` (uuid → auth.users), `completed_date` (date), `completed_at` (timestamptz). 
A UNIQUE constraint MUST exist on `(task_id, user_id, completed_date)` to allow safe upserts. RLS
MUST restrict INSERT/SELECT/DELETE to rows where `user_id` = the authenticated user for writes; 
reads are group-wide (for future multi-member display).

#### Scenario: Completion is per-user and per-date

- GIVEN task T exists
- WHEN user A completes T on 2026-06-20
- THEN a row is inserted with `user_id` = A and `completed_date` = 2026-06-20

#### Scenario: Duplicate toggle is safe (upsert)

- GIVEN user A has already completed task T on 2026-06-20
- WHEN the app attempts to toggle completion again for the same (task, user, date)
- THEN the upsert resolves via the unique constraint with no duplicate row error

#### Scenario: Cross-user completion isolation

- GIVEN user B queries `task_completions`
- WHEN rows exist for user A
- THEN user B sees zero rows belonging to user A

---

### Requirement: Personal Group Auto-Creation

A database trigger on `auth.users` INSERT MUST automatically create a personal group (type =
`personal`) and a corresponding `group_members` row (role = `owner`) for every new user. No
application-level call is required. A server-side fallback `ensurePersonalGroup()` MUST provide
idempotent re-creation for edge cases (pre-existing users, replication delays).

#### Scenario: New user gets a personal group

- GIVEN a new user registers via Supabase auth
- WHEN the `auth.users` INSERT fires
- THEN exactly one row exists in `groups` with `type = 'personal'` and `created_by` = the new user
- AND exactly one row exists in `group_members` for that group with `role = 'owner'`

#### Scenario: Trigger is idempotent for subsequent events

- GIVEN the trigger fires once per new user
- WHEN the same user record is not re-inserted
- THEN no duplicate groups are created

#### Scenario: Fallback handles pre-existing users

- GIVEN a user created before the trigger was deployed
- WHEN `ensurePersonalGroup()` is called on first load
- THEN a personal group is created if not present (idempotent via group_id/type/created_by lookup)

---

### Requirement: Couple Routine Seed (Idempotent)

On first authenticated load, the application MUST seed the current hardcoded couple routine as a
data-driven routine into the user's personal group. The seed MUST be idempotent: running it more
than once MUST NOT create duplicate routines or tasks. Idempotency is keyed on `(group_id,
template_id)`.

#### Scenario: First load seeds the routine

- GIVEN a user logs in for the first time and their personal group has no routines
- WHEN the application loads the home page
- THEN one routine row is created with the couple routine template content
- AND the associated task rows are created for each task in the template (deduped by (id, time_label, block))

#### Scenario: Subsequent loads do not duplicate

- GIVEN the couple routine has already been seeded for a user's personal group
- WHEN the application loads the home page again
- THEN no new routine or task rows are created
- AND the existing routine and tasks are returned unchanged

#### Scenario: Task deduplication during seed

- GIVEN a task emitted on multiple days with identical (name, icon, block, time_label, note, no_check)
- WHEN seed runs
- THEN one row is created with `schedule.days` accumulating all days the task appeared
- AND a separate row is created for each task variant (e.g. different time_label for weekday vs weekend)

---

### Requirement: Operations Layer

The system MUST provide an operations layer for all routine and task mutations. Every operation MUST accept an injected Supabase client and MUST NOT have a `'use server'` directive, call `revalidatePath`, or perform `redirect`.

#### Scenario: Operation performs DB work without side effects
- GIVEN a create routine operation is called with a Supabase client and routine data
- WHEN the operation executes
- THEN it inserts the row via the injected client
- AND it returns the result without calling `revalidatePath` or `redirect`

#### Scenario: Operation is reusable across contexts
- GIVEN the same operation is called from a server action and an agent tool
- WHEN it executes in both contexts
- THEN both calls produce the same DB result

### Requirement: Server Actions Wrapping Operations

The system MUST provide server actions that wrap each operation with `revalidatePath` for cache invalidation. Each action MUST call the corresponding operation and then `revalidatePath` on routes that display the affected data.

#### Scenario: Server action revalidates on mutation
- GIVEN a server action wraps a create routine operation
- WHEN the action executes successfully
- THEN the operation returns the result
- AND `revalidatePath` is called
- AND the UI reflects the new state on next render

### Requirement: Existing UI Uses Server Actions

The existing routine editor and routine list UI MUST use server actions instead of direct Supabase client calls. The visible behavior MUST remain identical.

#### Scenario: Editor mutation goes through server action
- GIVEN the user edits a routine name via the existing UI
- WHEN they submit the change
- THEN the call goes through a server action (not direct Supabase client)
- AND the same CRUD behavior is preserved from the user's perspective

---

### Requirement: CRUD — Routines (group-scoped)

The application MUST support creating, reading, updating, and deleting routines scoped to a user's
group. All mutations MUST pass through the operations layer. A routine MUST belong to exactly one group. Operations on routines outside the user's groups
MUST be rejected by RLS.

#### Scenario: Create routine

- GIVEN an authenticated user
- WHEN they create a new routine with a name
- THEN a row is inserted into `routines` with the correct `group_id` pointing to their personal group

#### Scenario: Read routines

- GIVEN an authenticated user with two routines seeded
- WHEN they fetch routines
- THEN only routines belonging to their groups are returned

#### Scenario: Update routine name

- GIVEN an existing routine owned by the user
- WHEN they update the routine's name
- THEN the `routines` row reflects the new name

#### Scenario: Delete routine

- GIVEN an existing routine owned by the user
- WHEN they delete the routine
- THEN the row is removed from `routines`
- AND associated `tasks` and `task_completions` are removed (cascade)

---

### Requirement: CRUD — Tasks (routine-scoped)

The application MUST support creating, reading, updating, and deleting tasks scoped to a routine.
All mutations MUST pass through the operations layer. RLS MUST prevent access to tasks in routines the user cannot access.

#### Scenario: Create task

- GIVEN an authenticated user with a routine
- WHEN they create a task with name, block, and position
- THEN a row is inserted into `tasks` with the correct `routine_id`

#### Scenario: Delete task cascades completions

- GIVEN a task with existing `task_completions` rows
- WHEN the task is deleted
- THEN all `task_completions` rows for that task are also removed

---

### Requirement: RLS Isolation

Every table (`groups`, `group_members`, `routines`, `tasks`, `task_completions`) MUST have Row
Level Security enabled. No anonymous read is permitted. Policies MUST use SECURITY DEFINER helper
functions (`is_group_member`, `is_group_owner`, `is_routine_member`) to avoid infinite recursion
when querying membership.

#### Scenario: RLS blocks anonymous queries

- GIVEN no authenticated session
- WHEN any query is made against the above tables
- THEN zero rows are returned (or an RLS error is raised)

#### Scenario: Policies are reproducible

- GIVEN a clean Supabase project
- WHEN all migrations are applied via Supabase CLI
- THEN RLS policies exist on all five tables and behave per the above scenarios

#### Scenario: RLS helpers avoid recursion

- GIVEN a membership predicate that would normally query group_members within an RLS policy
- WHEN the policy uses a SECURITY DEFINER function
- THEN the function bypasses RLS to read membership without infinite loops
