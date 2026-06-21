# Delta for app-navigation

## ADDED Requirements

### Requirement: Routines Route Access

The middleware matcher MUST include `/rutinas` in its allowed paths so the route is accessible. The system MUST route `/rutinas` to the routine builder page.

#### Scenario: Navigate to /rutinas
- GIVEN the app is loaded and the user is on any tab
- WHEN the user taps "Rutinas" in the tab bar
- THEN the URL changes to `/rutinas`
- AND the routine builder page renders

#### Scenario: Middleware does not block route
- GIVEN the middleware is configured
- WHEN a request to `/rutinas` is made
- THEN the middleware allows the request to proceed

## MODIFIED Requirements

### Requirement: Bottom Tab Bar

The system MUST render a fixed bottom tab bar with FOUR tabs: Home, Progreso, Rutinas, and Ajustes. Tapping a tab MUST switch the main content area without a full page reload.
(Previously: three tabs without Rutinas)

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

#### Scenario: Rutinas tab navigation
- GIVEN the app is loaded
- WHEN the user taps "Rutinas"
- THEN the main content switches to the routine builder page
- AND the "Rutinas" tab becomes the active tab indicator
