# Checklist Testing Specification

## Purpose

Define the testing strategy for the checklist application: unit tests for data logic, reducers, and components, plus end-to-end tests for the full user flow including persistence across refresh.

## Requirements

### Requirement: Unit Tests for Pure Functions

The system MUST provide unit tests for all pure utility and data functions. These SHALL include: day color palette resolution, task filtering by day and time block, rotation logic (week parity assignment), and progress percentage calculation. Each function MUST have at least one happy-path test and one edge-case test.

#### Scenario: Rotation logic returns correct assignee

- GIVEN a task configured for rotation with base assignee D
- WHEN calling the rotation function with an odd week number
- THEN the result matches D
- AND calling with an even week number returns A

#### Scenario: Progress calculation with zero tasks

- GIVEN a day with zero tasks
- WHEN calculating the progress percentage
- THEN the result is 0% (division by zero is handled gracefully)

### Requirement: Unit Tests for State Reducer

The system MUST provide unit tests for the checklist state reducer. Tests SHALL cover: toggling a single task, toggling a micro-habit, resetting all tasks, and loading state from a serialized snapshot. The reducer MUST be a pure function — no side effects.

#### Scenario: Toggle task flips completion state

- GIVEN a state with `task-1` unchecked
- WHEN dispatching `TOGGLE_TASK` with `task-1`
- THEN `task-1.completed` becomes true
- AND no other tasks are affected

#### Scenario: Reset restores default state

- GIVEN a state where several tasks are completed
- WHEN dispatching `RESET_ALL`
- THEN every task and micro-habit returns to the unchecked state

### Requirement: Component Unit Tests

The system MUST provide component tests using React Testing Library for the following components: DayTabs, TaskBlock, TaskItem, ProgressCircle, MicroHabits. Each test SHALL verify that the component renders the expected content given specific props.

#### Scenario: TaskItem renders description and checkbox

- GIVEN a TaskItem component with a description and unchecked state as props
- WHEN the component renders
- THEN the description text is visible
- AND the checkbox input is present and unchecked

#### Scenario: ProgressCircle displays correct percentage

- GIVEN a ProgressCircle with progress at 75%
- WHEN the SVG renders
- THEN the SVG arc length represents 75% of the full circle
- AND the text inside reads "75%"

### Requirement: E2E Full User Flow

The system MUST provide a Playwright end-to-end test that covers the full user flow: loading the page, viewing all 7 day tabs, toggling multiple tasks across different days, and verifying the progress circles update in real time.

#### Scenario: Complete user interaction flow

- GIVEN the page loads in a browser
- WHEN the user clicks each day tab, toggles 2 tasks per day, and observes progress circles
- THEN all 7 tabs are navigable, tasks toggle visually, and each progress circle reflects the correct completion ratio

### Requirement: E2E Persistence Across Refresh

The system MUST provide a Playwright test that verifies checkbox state survives a page reload. The test SHALL toggle tasks, reload the page, and assert that checkboxes retain their state.

#### Scenario: State persists after page reload

- GIVEN the page is loaded and the user checks 3 tasks
- WHEN the page is reloaded
- THEN those 3 tasks remain checked

#### Scenario: Corrupted storage handled on reload

- GIVEN the page is loaded and localStorage contains corrupted data for the checklist key
- WHEN the page reloads
- THEN the app renders without errors and all tasks show as unchecked
