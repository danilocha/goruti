# AI Agent Tools Specification

## Purpose

Nine zod-defined tools enabling the AI to perform CRUD on routines and tasks via natural language. Tools are grouped into read, mutation, and destructive categories.

## Requirements

### Requirement: Read Tools

The system MUST provide `listRoutines` and `getRoutineTasks` tools that return routine/task data from the user's group. These tools MUST NOT perform mutations.

#### Scenario: List routines returns user's routines
- GIVEN an authenticated user with 2 routines in their group
- WHEN the agent calls `listRoutines`
- THEN the response contains both routines with names and IDs

#### Scenario: Get routine tasks returns task list
- GIVEN a routine "Mañana" with 3 tasks exists
- WHEN the agent calls `getRoutineTasks` with name "Mañana"
- THEN the response contains 3 tasks with schedule, block, and position

### Requirement: Mutation Tools

The system MUST provide `createRoutine`, `updateRoutine`, `addTask`, `updateTask`, and `installTemplate` tools that create or modify data in the user's group.

#### Scenario: Create routine succeeds
- GIVEN an authenticated user
- WHEN the agent calls `createRoutine` with name "Mañana"
- THEN a row is inserted into `routines` with `group_id` pointing to the active group

#### Scenario: Add task with schedule
- GIVEN an existing routine "Mañana"
- WHEN the agent calls `addTask` with name and weekly schedule
- THEN a task row is inserted with the correct `schedule` as tagged jsonb

#### Scenario: Tool accepts groupName parameter
- GIVEN a user has groups "Pareja" and "Personal"
- WHEN a mutation tool receives `groupName: "Personal"`
- THEN the operation resolves to the "Personal" group ID
- AND the mutation applies to that group

### Requirement: Destructive Tools

The system MUST mark `deleteRoutine` and `deleteTask` with `destructive: true` metadata and MUST NOT auto-execute them.

#### Scenario: Delete tool requires confirmation
- GIVEN the agent calls `deleteRoutine`
- WHEN the tool is invoked
- THEN the tool returns a `tool-invocation` with `state: 'input-available'` (no auto-execution)
- AND the UI renders a confirmation dialog

### Requirement: Tool Error Handling

Every tool MUST return `{ ok: false, error: string }` on failure.

#### Scenario: Tool returns structured error on not-found
- GIVEN the agent calls `getRoutineTasks` with a non-existent routine name
- WHEN the tool executes
- THEN it returns `{ ok: false, error: "routine 'X' not found" }`
- AND the agent reformulates the error in natural language
