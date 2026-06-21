# app-navigation Specification

## Purpose

Bottom tab bar with a slim fixed header providing client-side view switching between Home (checklist), Progress (weekly), and Settings (theme + account).

## Requirements

### Requirement: Bottom Tab Bar

The system MUST render a fixed bottom tab bar with three tabs: Home, Progreso, and Ajustes. Tapping a tab MUST switch the main content area without a full page reload.

#### Scenario: Tab switches content
- GIVEN the app is loaded
- WHEN the user taps "Progreso"
- THEN the main content area switches to the weekly progress view
- AND the bottom tab bar remains visible

#### Scenario: Active tab indicator
- GIVEN a tab is currently selected
- WHEN the user views the bottom tab bar
- THEN the active tab MUST be visually distinguished from inactive tabs

#### Scenario: First load defaults to Home
- GIVEN the app is loaded for the first time
- WHEN no tab selection was previously remembered
- THEN the Home (checklist) tab is selected by default

### Requirement: Slim Fixed Header

The system MUST display a slim fixed header with the current day name and a progress circle. The header MUST NOT show user email or sign-out action.

#### Scenario: Header renders on all views
- GIVEN a user is on any tab
- WHEN the page renders
- THEN the slim header is visible at the top

#### Scenario: Header is fixed on scroll
- GIVEN content extends beyond the viewport
- WHEN the user scrolls
- THEN the slim header remains fixed at the top of the viewport

### Requirement: Desktop Responsive Layout

On viewports at or above 768px width, the system SHOULD replace the bottom tab bar with a slim top navigation bar or a left sidebar.

#### Scenario: Desktop navigation
- GIVEN a viewport width of 1024px
- WHEN the app renders
- THEN the bottom tab bar is not displayed
- AND an alternative navigation layout is used (top bar or sidebar)

#### Scenario: Tablet breakpoint
- GIVEN a viewport width of 768px
- WHEN the app renders
- THEN the navigation adapts to the desktop layout
