# AI Agent UI Specification

## Purpose

Chat interface inside the Asistente tab: welcome screen with suggestion chips, tool invocation rendering, destructive confirmation dialog, and app refresh after mutations.

## Requirements

### Requirement: Welcome Screen

The system MUST show a welcome component with Goruti branding and suggestion chips when the session is empty or has zero user messages.

#### Scenario: Empty session shows welcome
- GIVEN no prior chat session exists or the session has zero messages
- WHEN the Asistente tab renders
- THEN a welcome component with avatar and greeting is displayed
- AND four suggestion chips are visible

#### Scenario: Existing session hides chips
- GIVEN a session with prior messages is loaded
- WHEN the Asistente tab renders
- THEN the welcome component and suggestion chips are NOT shown
- AND the message history is displayed

### Requirement: Suggestion Chips

The system MUST provide clickable chips that send a pre-defined message when tapped.

#### Scenario: Chip triggers message send
- GIVEN the welcome screen is displayed
- WHEN the user taps a suggestion chip
- THEN its text is sent as a user message
- AND the chat transitions to the active conversation state

### Requirement: Tool Invocation Rendering

The system MUST render tool invocations from `message.parts` as visual elements based on state.

#### Scenario: Streaming tool shows progress
- GIVEN a tool invocation is in `state: 'input-streaming'`
- WHEN the UI renders
- THEN a compact spinner with a humanized label is shown

#### Scenario: Completed tool shows result card
- GIVEN a tool invocation is in `state: 'output-available'`
- WHEN the UI renders
- THEN a collapsible `<ToolResultCard>` is shown with icon, label, and success/failure status
- AND the card can be expanded to view input parameters and output

### Requirement: Destructive Tool Confirmation

The system MUST render a `<DestructiveToolConfirmation>` for `deleteRoutine` and `deleteTask` in `state: 'input-available'`.

#### Scenario: Confirmation shows delete details
- GIVEN the agent attempts to delete a routine or task
- WHEN the destructive tool enters `state: 'input-available'`
- THEN a confirmation card shows the entity name and details
- AND the user can confirm (executes server action) or cancel (aborts)

#### Scenario: Cancelled deletion returns error
- GIVEN the user cancels a destructive action
- WHEN cancel is triggered
- THEN `addToolOutput` is called with `{ ok: false, error: 'cancelado' }`
- AND the agent responds without performing the mutation

### Requirement: App Refresh After Mutation

The system MUST call `router.refresh()` when the last assistant message contains mutation tool results.

#### Scenario: Home reflects chat-created routine
- GIVEN the agent creates a routine via chat
- WHEN the last assistant message has mutation tools in `state: 'output-available'`
- THEN `router.refresh()` is called
- AND navigating to the Home tab shows the new routine
