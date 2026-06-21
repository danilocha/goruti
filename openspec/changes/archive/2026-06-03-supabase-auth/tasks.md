# Tasks: Supabase Auth Integration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500–650 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Auth Hook + Pages) → PR 3 (Integration + Tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation — deps, env vars, Supabase client factories, middleware | PR 1 | No user-facing change; each factory independently testable |
| 2 | Auth Core — useAuth hook, login, register, error, callback pages | PR 2 | Builds on PR 1; pages functional, header stub works |
| 3 | Integration + Tests — AuthProvider wiring, layout, Header, all tests | PR 3 | Completes the feature on top of PR 2 |

## Phase 1: Foundation

- [x] 1.1 Add `@supabase/supabase-js` + `@supabase/ssr` to `package.json` dependencies; run `npm install`
- [x] 1.2 Rename `SUPABASE_PROJECT_URL` → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_API_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local.example` (remove `SUPABASE_PASSWORD` and `SUPABASE_POSTGRESQL` if outdated)
- [x] 1.3 Create `src/lib/supabase/client.ts` — export `createClient()` using `createBrowserClient` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] 1.4 Create `src/lib/supabase/server.ts` — export `createClient()` using `createServerClient` with cookie store and `maxAge: 60*60*24*30`
- [x] 1.5 Create `middleware.ts` — export `config.matcher` exclusion pattern + `updateSession(request)` using `createServerClient` and `supabase.auth.getUser()`; redirect to `/login` if no session

## Phase 2: Auth Hook & Pages

- [x] 2.1 Create `src/hooks/useAuth.ts` — define `AuthContextValue` interface, `AuthContext` with `createContext`, `AuthProvider` (getSession on mount, loading state), and `useAuth` hook exposing `user`, `session`, `isLoading`, `login`, `signup`, `signOut`
- [x] 2.2 Create `src/app/login/page.tsx` — email/password form, error state display, calls `useAuth().login()`, redirects to `/` on success
- [x] 2.3 Create `src/app/register/page.tsx` — email/password form, error state display, calls `useAuth().signup()`, redirects to `/` on success
- [x] 2.4 Create `src/app/auth/callback/route.ts` — GET handler that exchanges PKCE code via `createServerClient`, redirects to `/` on success, `/error` on failure
- [x] 2.5 Create `src/app/error/page.tsx` — generic error page with message prop fallback and "Volver al inicio" link to `/login`

## Phase 3: Integration

- [x] 3.1 Modify `src/app/providers.tsx` — accept `session` prop, wrap children with `AuthProvider` outside `ChecklistContext.Provider`
- [x] 3.2 Modify `src/app/layout.tsx` — import `createClient` from server, call `auth.getUser()` (or getSession), pass `session={session}` to `<Providers>`
- [x] 3.3 Modify `src/components/Header.tsx` — add `"use client"` directive, import `useAuth`, render user email + sign-out button when authenticated

## Phase 4: Tests

- [x] 4.1 Write `src/hooks/__tests__/useAuth.test.ts` — mock `supabase.auth`; test loading → authenticated → unauthenticated transitions, and `login`, `signup`, `signOut` methods
- [x] 4.2 Write React Testing Library tests for login page — fill form, submit valid credentials (redirect), invalid credentials (inline error)
- [x] 4.3 Write React Testing Library tests for register page — fill form, submit valid data (redirect), duplicate email (inline error)
- [x] 4.4 Write test for middleware — verify matcher pattern excludes public routes, mock `updateSession` for redirect/allow branches
- [x] 4.5 Update `src/components/__tests__/Header.test.tsx` — mock `useAuth`; test authenticated render (email + sign-out button) and unauthenticated render (no user content)
- [x] 4.6 Write Playwright E2E test — register user, confirm session survives refresh, sign out, verify redirect to `/login`
