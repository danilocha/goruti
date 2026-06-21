# Proposal: Supabase Auth Integration

## Intent

Add user authentication to the couple-life checklist app so users can log in, register, and maintain a session. Currently all routes are public with no auth infrastructure. Without this, adding a backend or user-scoped data later is blocked.

## Scope

### In Scope
- Supabase SSR client setup: browser client (`src/lib/supabase/client.ts`), server client (`src/lib/supabase/server.ts`), middleware client (`middleware.ts`)
- Route protection via middleware (server-side redirect) + client-side `AuthProvider` (loading/redirect guard)
- Login page (`/login`) and Register page (`/register`) with email/password forms
- Auth callback route handler for PKCE flow (`/auth/callback`)
- `useAuth` hook exposing session state, login, signup, sign-out
- Header integration: user email display + sign-out button
- Generic error page (`/error`) for auth redirects
- Env var rename in `.env.local.example`: `SUPABASE_PROJECT_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_API_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Out of Scope
- OAuth/social login providers (Google, GitHub, etc.)
- Password reset / forgot-password flow
- User-scoped backend data storage (future change)
- Role-based authorization (admin vs user)
- Email verification UI
- Migration of localStorage checklist data to per-user storage

## Capabilities

### New Capabilities
- `user-auth`: User authentication with Supabase — email/password registration, login, session management via PKCE, and sign-out. Covers auth UI (login/register pages), session persistence (SSR cookies), and route protection (middleware + client guard).

### Modified Capabilities
- None. Auth is additive — it wraps existing checklist functionality without changing checklist spec behavior.

## Approach

Direct Supabase SSR (`@supabase/ssr`) with PKCE flow — the officially supported pattern for Next.js App Router. Two-layer route protection: (1) middleware redirects unauthenticated requests to `/login`, (2) client-side `AuthProvider` checks session on mount and shows loading state. Auth sits orthogonal to the existing checklist — Providers wrapper nests `AuthProvider` around `ChecklistContext`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/supabase/` | New | Browser + server Supabase client factories |
| `middleware.ts` | New | Route protection via Supabase SSR middleware |
| `src/app/providers.tsx` | Modified | Wrap AuthProvider around ChecklistContext |
| `src/app/layout.tsx` | Modified | Pass session to Header (no structural change) |
| `src/components/Header.tsx` | Modified | Add user info + sign-out button |
| `src/app/login/page.tsx` | New | Email/password login form |
| `src/app/register/page.tsx` | New | Email/password registration form |
| `src/app/auth/callback/route.ts` | New | PKCE callback handler |
| `src/app/error/page.tsx` | New | Auth redirect error page |
| `src/hooks/useAuth.ts` | New | Auth session hook + sign-out |
| `.env.local.example` | Modified | Rename env vars to NEXT_PUBLIC_ prefix |
| `package.json` | Modified | Add `@supabase/supabase-js`, `@supabase/ssr` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| @supabase/ssr API changes in Next.js 16 | Low | Pin exact compatible version tested against Next.js 16 |
| Middleware runs on every route (performance) | Medium | Add `matcher` config to exclude static assets, API, `_next/static` |
| Session lost on browser close (session cookie) | Medium | Set `cookieOptions.maxAge` for persistent session |
| localStorage data shared across users on same browser | Low | Document as known limitation; user-scoped backend storage is future work |
| Error page missing breaks auth redirects | Low | Create `/error` page as part of this change |

## Rollback Plan

1. **Revert `package.json`**: Remove `@supabase/supabase-js` and `@supabase/ssr`, run `npm install`
2. **Delete new files**: Remove `src/lib/supabase/`, `middleware.ts`, `src/app/login/`, `src/app/register/`, `src/app/auth/`, `src/app/error/`, `src/hooks/useAuth.ts`
3. **Revert modified files**: Restore `providers.tsx`, `layout.tsx`, `Header.tsx`, `.env.local.example` from git
4. **Verify**: All routes are public again, checklist functions without auth

## Dependencies

- `@supabase/supabase-js` — Supabase JS client
- `@supabase/ssr` — Next.js SSR auth helpers (official)
- Existing Supabase project credentials (already in `.env.local`)

## Success Criteria

- [ ] User can register with email/password at `/register` and is redirected to `/`
- [ ] User can log in at `/login` and is redirected to `/`
- [ ] Unauthenticated users accessing `/` are redirected to `/login`
- [ ] Header shows logged-in user email and sign-out button
- [ ] Sign-out clears session and redirects to `/login`
- [ ] Middleware skips static assets and login/register pages (no redirect loops)
- [ ] Session persists across page refreshes and tab closes (with `maxAge`)
- [ ] `.env.local.example` uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
