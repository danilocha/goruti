# Delta for user-auth

## MODIFIED Requirements

### Requirement: Header Auth Display

The system MUST display the authenticated user's email and a sign-out action in the Settings panel. The slim header MUST NOT show user email or sign-out action.
(Previously: email and sign-out shown in the header on every protected page)

#### Scenario: Authenticated settings view
- GIVEN a user is authenticated
- WHEN they navigate to the Settings tab
- THEN the Settings panel displays the user's email
- AND shows a sign-out button

#### Scenario: Slim header omits auth info
- GIVEN a user is authenticated
- WHEN any protected page renders
- THEN the slim header does NOT display user email or sign-out button

#### Scenario: Unauthenticated settings view
- GIVEN a visitor has no session
- WHEN they land on the Settings tab
- THEN the Settings panel does not show user email or sign-out button
