# animations Specification

## Purpose

Hybrid animation system using CSS for micro-interactions and Framer Motion for page-level and component transitions. MUST respect the user's `prefers-reduced-motion` setting.

## Requirements

### Requirement: Reduced Motion Respect

The system MUST check `prefers-reduced-motion` and `useReducedMotion()` before applying any animation. When reduced motion is preferred, all animations MUST be disabled or replaced with instant transitions.

#### Scenario: Reduced motion disables animations
- GIVEN a user has `prefers-reduced-motion: reduce` set in their OS or browser
- WHEN any animation would trigger
- THEN the animation is skipped
- AND the content appears in its final state instantly

#### Scenario: Default motion enabled
- GIVEN a user has no reduced-motion preference
- WHEN an animation triggers
- THEN the animation plays at normal speed

### Requirement: CSS Micro-Interactions

Common UI interactions (hover, focus, active) MUST use CSS transitions for performance. Affected elements include tab active states, button hover, and chip tap feedback.

#### Scenario: Hover feedback
- GIVEN a user hovers over a tappable element
- WHEN the hover state is active
- THEN a CSS transition (opacity, scale, or color) provides visual feedback within 200ms

#### Scenario: Focus-visible ring
- GIVEN a user navigates with keyboard
- WHEN an interactive element receives focus
- THEN a visible focus ring is displayed with a smooth CSS transition

### Requirement: Day Slide Transition (Framer Motion)

Day switching in the Home view MUST use a Framer Motion `AnimatePresence` wrapper with horizontal slide variants based on navigation direction.

#### Scenario: Forward day navigation
- GIVEN the user is viewing Monday
- WHEN they navigate to Tuesday
- THEN Monday content slides out to the left
- AND Tuesday content slides in from the right

#### Scenario: Backward day navigation
- GIVEN the user is viewing Tuesday
- WHEN they navigate to Monday
- THEN Tuesday content slides out to the right
- AND Monday content slides in from the left

### Requirement: Task Toggle Spring Animation

Task checkmark toggle MUST use a Framer Motion spring animation on the checkmark icon.

#### Scenario: Task completion spring
- GIVEN a user taps an unchecked task
- WHEN the task toggles to completed
- THEN the checkmark icon animates with a spring/bounce effect

#### Scenario: Task uncheck
- GIVEN a user taps a checked task
- WHEN the task toggles to incomplete
- THEN the checkmark icon animates back with a spring effect

### Requirement: Progress Circle Mount Animation

The progress circle MUST animate on mount and whenever its value changes.

#### Scenario: Mount animation
- GIVEN a user navigates to a view with a progress circle
- WHEN the component mounts
- THEN the progress circle fills from 0% to its actual value over 400-600ms

#### Scenario: Value change animation
- GIVEN a task is toggled
- WHEN the progress value changes
- THEN the progress circle updates with a smooth transition
