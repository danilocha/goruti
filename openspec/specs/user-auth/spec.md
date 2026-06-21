# user-auth Specification

## Purpose

User authentication with Supabase — email/password registration, login, session management via PKCE, and sign-out. Covers auth UI (login/register pages), session persistence (SSR cookies), and route protection (middleware + client guard).

## Requirements

### Requirement: Registration

New users MUST register with email and password at `/register`.

#### Scenario: Successful registration
- GIVEN a visitor is on the `/register` page
- WHEN they submit a valid email and password
- THEN a Supabase auth account is created
- AND redirected to `/`

#### Scenario: Duplicate email
- GIVEN a visitor submits an email already in use
- WHEN they submit the registration form
- THEN an inline error is displayed
- AND they remain on `/register`

### Requirement: Login

Existing users MUST authenticate with email and password at `/login`.

#### Scenario: Successful login
- GIVEN a registered user is on the `/login` page
- WHEN they submit correct credentials
- THEN a Supabase session is created
- AND they are redirected to `/`

#### Scenario: Invalid credentials
- GIVEN a registered user is on the `/login` page
- WHEN they submit incorrect email or password
- THEN an inline error is displayed
- AND they remain on `/login`

### Requirement: Route Protection (Middleware)

Unauthenticated requests to protected routes MUST redirect to `/login`.

#### Scenario: Unauthenticated access
- GIVEN a visitor has no valid session
- WHEN they request `/` (or a protected route)
- THEN the middleware redirects to `/login`

#### Scenario: Authenticated access
- GIVEN a user has a valid session cookie
- WHEN they request `/`
- THEN the middleware allows the request

#### Scenario: Public route bypass
- GIVEN any visitor
- WHEN they request `/login`, `/register`, `/auth/callback`, `/error`, or static assets
- THEN the middleware allows the request without auth check

### Requirement: Client-Side Auth Guard

A client-side AuthProvider MUST prevent flash of unauthenticated content.

#### Scenario: Loading state
- GIVEN a user navigates to a protected route
- WHEN the session is being checked client-side
- THEN a loading indicator is shown
- AND page content is not rendered until session status is known

#### Scenario: Client redirect
- GIVEN a user without a valid session reaches a protected route client-side
- WHEN the AuthProvider completes its session check
- THEN it redirects to `/login`

### Requirement: Session Persistence

The system MUST persist the auth session across page refreshes and browser restarts.

#### Scenario: Survives page refresh
- GIVEN a user is authenticated
- WHEN they refresh the page
- THEN the session is recovered from cookies
- AND the user remains authenticated

#### Scenario: Survives browser close
- GIVEN a user is authenticated
- WHEN they close and reopen the browser
- THEN the session is recovered from persistent cookies (via maxAge)

#### Scenario: Sign-out clears session
- GIVEN an authenticated user
- WHEN they click sign-out
- THEN the session cookie is cleared
- AND they are redirected to `/login`

### Requirement: PKCE Callback

The system MUST handle the PKCE auth callback at `/auth/callback`.

#### Scenario: Successful code exchange
- GIVEN Supabase redirects to `/auth/callback` with a valid auth code
- WHEN the handler exchanges the code for a session
- THEN the user is redirected to `/`

#### Scenario: Failed code exchange
- GIVEN Supabase redirects to `/auth/callback` with an invalid or expired code
- WHEN the handler attempts to exchange the code
- THEN the user is redirected to `/error`

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
