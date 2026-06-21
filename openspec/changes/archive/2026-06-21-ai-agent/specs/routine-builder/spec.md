# Delta for routine-builder

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: CRUD — Routines (group-scoped)

The application MUST support creating, reading, updating, and deleting routines scoped to a user's group. All mutations MUST pass through the operations layer. A routine MUST belong to exactly one group. Operations on routines outside the user's groups MUST be rejected by RLS.
(Previously: CRUD used direct Supabase client; now flows through operations layer + server actions)

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

### Requirement: CRUD — Tasks (routine-scoped)

The application MUST support creating, reading, updating, and deleting tasks scoped to a routine. All mutations MUST pass through the operations layer. RLS MUST prevent access to tasks in routines the user cannot access.
(Previously: CRUD used direct Supabase client; now flows through operations layer + server actions)

#### Scenario: Create task
- GIVEN an authenticated user with a routine
- WHEN they create a task with name, block, and position
- THEN a row is inserted into `tasks` with the correct `routine_id`

#### Scenario: Delete task cascades completions
- GIVEN a task with existing `task_completions` rows
- WHEN the task is deleted
- THEN all `task_completions` rows for that task are also removed
