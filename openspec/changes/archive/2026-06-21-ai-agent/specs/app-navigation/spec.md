# Delta for app-navigation

## MODIFIED Requirements

### Requirement: Bottom Tab Bar

The system MUST render a fixed bottom tab bar with four tabs: Home, Progreso, Ajustes, and Asistente. Tapping a tab MUST switch the main content area without a full page reload.
(Previously: 3 tabs — Home, Progreso, Ajustes)

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

#### Scenario: Asistente tab switches to chat
- GIVEN the app is loaded
- WHEN the user taps "Asistente"
- THEN the main content area switches to the chat view
- AND the bottom tab bar remains visible

## ADDED Requirements

### Requirement: Asistente Tab Definition

The system MUST include a tab labeled "Asistente" with Material Symbol icon `auto_awesome`. The tab MUST be positioned as the last item in the bottom tab bar, after Ajustes.

#### Scenario: Asistente tab is visible in nav
- GIVEN the bottom tab bar is rendered
- WHEN the user views the tab bar
- THEN a tab labeled "Asistente" with the `auto_awesome` icon is present as the last item
