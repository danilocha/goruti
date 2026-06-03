# Checklist Persistence Specification

## Purpose

Persist and restore the checklist checkbox state so that user progress survives page refreshes and browser sessions. The system MUST operate safely in server-side rendering (SSR) contexts, handle corrupted or missing data gracefully, and avoid excessive writes.

## Requirements

### Requirement: State Persistence

The system MUST persist every task and micro-habit completion state to localStorage. Each record SHALL include task ID, completion boolean, and timestamp. A single storage key SHALL hold all state.

#### Scenario: Single task persisted

- GIVEN the user checks a Lunes task
- WHEN the checkbox changes
- THEN localStorage contains that task's ID with `completed: true`

#### Scenario: Multiple tasks accumulate

- GIVEN the user completes 5 tasks across 3 days
- WHEN each checkbox changes
- THEN localStorage contains all 5 records under the checklist key

### Requirement: State Restoration

The system MUST restore state from localStorage after initial render to avoid hydration mismatches. If no stored state exists, default to all unchecked.

#### Scenario: State survives refresh

- GIVEN 3 tasks were completed
- WHEN the page reloads
- THEN those 3 tasks appear checked

#### Scenario: First visit has no state

- GIVEN the user visits for the first time
- WHEN the page loads with no localStorage data
- THEN all tasks are unchecked

### Requirement: SSR Safety

The system MUST NOT crash during SSR. localStorage access SHALL be guarded to run only in the browser. The system SHOULD render a placeholder during SSR.

#### Scenario: SSR without localStorage

- GIVEN a server render of the checklist
- WHEN the page renders on the server
- THEN no localStorage error occurs and a placeholder renders

#### Scenario: Hydration populates state

- GIVEN the server rendered a placeholder
- WHEN the client hydrates with localStorage available
- THEN the placeholder replaces with stored task states

### Requirement: Corrupted Data Fallback

The system MUST discard corrupted localStorage data and initialize with defaults. Malformed JSON or schema mismatches SHALL be handled silently — no user-visible error.

#### Scenario: Malformed JSON

- GIVEN localStorage contains `"{invalid"`
- WHEN the page loads
- THEN the data is discarded silently and all tasks show unchecked

#### Scenario: Schema mismatch

- GIVEN localStorage has valid JSON but missing required fields
- WHEN the page loads
- THEN the system falls back to defaults without error

### Requirement: Debounced Writes

The system SHOULD debounce localStorage writes. Interval SHOULD be ≤ 1000ms to balance performance and crash safety.

#### Scenario: Rapid toggles coalesced

- GIVEN the user toggles 10 tasks in 2 seconds
- WHEN the debounce settles
- THEN only 1–2 writes occur instead of 10

#### Scenario: Write on page close

- GIVEN a task was just toggled
- WHEN the page closes before the debounce fires
- THEN the state is persisted on next open (best-effort)

### Requirement: Storage Quota Handling

The system SHOULD handle quota errors gracefully. Existing state MUST survive a failed write. The system MAY log a warning.

#### Scenario: Quota exceeded

- GIVEN localStorage is near its limit
- WHEN persisting updated state
- THEN the write fails, existing state is preserved, and no crash occurs
