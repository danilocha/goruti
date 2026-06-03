# Checklist Display Specification

## Purpose

Render a 7-day household checklist for two people. Each day shows color-coded tabs, time-blocked task groups, individual task items with person assignment, progress circles, and micro-habits. The layout must support two-person rotation logic.

## Requirements

### Requirement: Day Tab Navigation

The system MUST render 7 day tabs (Mon–Sun). Each tab SHALL display the day name. The selected tab MUST use that day's color palette. Tabs SHALL be keyboard-navigable.

#### Scenario: Switch between days

- GIVEN Monday is displayed
- WHEN the user clicks "Miércoles"
- THEN Wednesday's tasks and colors render

#### Scenario: Keyboard navigation

- GIVEN the checklist is displayed
- WHEN the user Tabs to the next day and presses Enter
- THEN that day's tasks appear

### Requirement: Time Block Task Grouping

Tasks MUST be grouped under time blocks ("Mañana", "Tarde", "Noche") in chronological order. Each block SHALL display a header and its tasks.

#### Scenario: Tasks under correct block

- GIVEN the user views "Lunes"
- WHEN the page renders
- THEN tasks appear under their respective time block headers

#### Scenario: Empty time block omitted

- GIVEN a day has no tasks for a time block
- WHEN the page renders
- THEN that block header is not displayed

### Requirement: Task Item with Person Assignment

Each task MUST show its description, assigned person (D or A), and a checkbox. Assignees SHALL be visually distinct. Alternating tasks SHALL show rotation badges.

#### Scenario: Task shows assignee

- GIVEN a task assigned to D during an odd week
- WHEN the task renders
- THEN it shows the description, checkbox, and a D indicator

#### Scenario: Rotation badge per week parity

- GIVEN a task alternates persons weekly
- WHEN the week is even
- THEN the badge shows the rotated assignee

### Requirement: Two-Person Rotation Logic

The system MUST alternate tasks between persons based on week parity deterministically. Non-rotating tasks SHALL ignore week parity.

#### Scenario: Rotating task per week

- GIVEN a task rotating between D and A
- WHEN the week is odd
- THEN the assignee is D

#### Scenario: Non-rotating task static

- GIVEN a task assigned to A only
- WHEN the week changes
- THEN the assignee remains A

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
