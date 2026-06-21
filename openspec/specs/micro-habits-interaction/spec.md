# micro-habits-interaction Specification

## Purpose

Tappable micro-habit chips with toggle state, visual feedback, and completion tracking. Upgrades the previous static display-only chips to fully interactive controls.

## Requirements

### Requirement: Tap Toggle

Micro-habit chips MUST be tappable. Tapping a chip MUST toggle its completed state between checked and unchecked.

#### Scenario: Chip toggle to completed
- GIVEN a micro-habit chip is displayed in unchecked state
- WHEN the user taps the chip
- THEN the chip transitions to checked state
- AND the completion status is visually updated

#### Scenario: Chip toggle back to incomplete
- GIVEN a micro-habit chip is displayed in checked state
- WHEN the user taps the chip
- THEN the chip transitions to unchecked state

### Requirement: Visual Feedback

The chip MUST provide immediate visual feedback on tap, including a state change in color, icon, or fill style.

#### Scenario: Visual state change
- GIVEN a user taps an unchecked chip
- WHEN the toggle completes
- THEN the chip fill color changes to indicate completion
- AND a checkmark or filled icon is displayed

#### Scenario: Transition feedback
- GIVEN a user taps a chip
- WHEN the toggle is in progress
- THEN a brief CSS scale or color transition provides tactile-like visual feedback

### Requirement: Completion Tracking

Toggling a micro-habit chip MUST update the underlying completion data, which feeds into the total progress calculation.

#### Scenario: Progress updates on toggle
- GIVEN a checklist with 5 micro-habits, 2 currently completed
- WHEN the user taps a third chip to completed
- THEN the completion count increments to 3
- AND the overall day progress percentage is recalculated

#### Scenario: Uncheck updates progress
- GIVEN a checklist with 3 completed micro-habits
- WHEN the user taps a completed chip to unchecked
- THEN the completion count decrements to 2

### Requirement: Keyboard Accessibility

Micro-habit chips MUST be keyboard accessible. The chips SHALL be focusable and toggleable via the Enter or Space key.

#### Scenario: Keyboard toggle
- GIVEN a chip has keyboard focus
- WHEN the user presses Enter or Space
- THEN the chip toggles its completed state

#### Scenario: Focus indicator
- GIVEN a chip receives keyboard focus
- WHEN the chip is focused
- THEN a visible focus ring is displayed around the chip
