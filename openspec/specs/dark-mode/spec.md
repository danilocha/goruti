# dark-mode Specification

## Purpose

Dark mode support via CSS custom properties and a ThemeProvider Context. Detects system preference, allows manual toggle, persists to localStorage, and applies the theme via `<html data-theme>` attribute.

## Requirements

### Requirement: Theme Detection

The system MUST detect the user's system color scheme preference via `prefers-color-scheme` on initial load.

#### Scenario: System dark preference
- GIVEN a user has `prefers-color-scheme: dark` set in their OS
- WHEN the app loads for the first time
- THEN dark mode is applied as the initial theme
- AND `<html data-theme="dark">` is set

#### Scenario: System light preference
- GIVEN a user has `prefers-color-scheme: light` set in their OS
- WHEN the app loads for the first time
- THEN light mode is applied as the initial theme
- AND `<html data-theme="light">` is set

### Requirement: Theme Persistence

The system MUST persist the user's chosen theme to localStorage under the key `theme`. On subsequent loads, the persisted value MUST override the system preference.

#### Scenario: Persisted theme overrides system
- GIVEN a user manually selected dark mode on a previous visit
- WHEN they return to the app
- THEN dark mode is applied regardless of the current system preference

#### Scenario: Persisted value applies across tabs
- GIVEN a user selects dark mode in the Settings tab
- WHEN they navigate to the Home tab
- THEN dark mode is still active

### Requirement: Theme Toggle

The system MUST provide a theme toggle in the Settings tab that switches between light and dark modes.

#### Scenario: Toggle to dark
- GIVEN the user is in light mode on the Settings tab
- WHEN they toggle the theme switch
- THEN `<html data-theme>` changes to `"dark"`
- AND all CSS custom properties update to dark palette values

#### Scenario: Toggle back to light
- GIVEN the user is in dark mode
- WHEN they toggle the theme switch
- THEN `<html data-theme>` returns to `"light"`

### Requirement: ThemeProvider Context

The system MUST provide a ThemeProvider Context that wraps the application and exposes the current theme and a toggle function.

#### Scenario: Theme state available to all components
- GIVEN any component is rendered within the provider tree
- WHEN it accesses the theme context
- THEN it receives the current theme value and a toggle function
- AND no prop drilling is required

### Requirement: WCAG AA Compliance

All dark mode color variants MUST pass WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).

#### Scenario: Dark palette passes AA
- GIVEN the app is in dark mode
- WHEN any text is rendered on a dark background
- THEN the contrast ratio between text and background MUST be at least 4.5:1
