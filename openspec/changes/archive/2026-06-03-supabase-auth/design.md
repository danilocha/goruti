# Design: Supabase Auth Integration

## Technical Approach

Direct Supabase SSR via `@supabase/ssr` — the official Next.js App Router pattern. Three client factories (browser, server, middleware) map to the three runtime contexts. Two-layer route protection: middleware (server-side redirect) + `AuthProvider` (client-side loading guard). Auth context wraps `ChecklistContext` in the existing `Providers` tree. PKCE flow handles the OAuth-style code exchange via a route handler at `/auth/callback`.

## Architecture Decisions

### Decision: Client Factory Split

| Choice | Alternatives | Rationale |
|--------|-------------|-----------|
| Three files: `client.ts`, `server.ts`, `middleware.ts` | Single factory with runtime checks | Next.js runtime environments (browser, server, edge) require different cookie/URL handling. Separate files keep each context's import chain clean. |

### Decision: Session Persistence via Cookie maxAge

| Choice | Alternatives | Rationale |
|--------|-------------|-----------|
| Set `maxAge: 60 * 60 * 24 * 30` (30d) on server client cookies | Session-only cookies; localStorage fallback | Matches Supabase SSR defaults. Survives browser close. No extra storage layer needed. |

### Decision: Middleware Matcher (Exclusion Pattern)

| Choice | Alternatives | Rationale |
|--------|-------------|-----------|
| Regex exclude: `login`, `register`, `auth/callback`, `error`, `_next/*`, static assets | Include-only (list every protected route) | With 1 protected page today, include-only works. Exclusion pattern scales better as the app grows — new routes are protected by default. |

### Decision: Header as Client Component

| Choice | Alternatives | Rationale |
|--------|-------------|-----------|
| Convert Header to `"use client"` using `useAuth` | Server fetch + pass session via props | Sign-out button needs a client click handler. Making Header a client component avoids prop-drilling session through `page.tsx` into `Header`. No performance concern — page is already `"use client"`. |

## Data Flow

### Login Flow

```
User ──→ /login (email+password)
         │
         ▼
    supabase.auth.signInWithPassword()
         │
         ▼
    Supabase sets session cookie (PKCE)
         │
         ▼
    Router.push("/") ──→ Middleware: session exists → allow
                         AuthProvider: mounts → getSession() → user found → render
```

### Middleware Flow

```
Request ──→ middleware.ts
            │
            ▼
        matcher: protected route?
         YES          NO (public)
          │            │
          ▼            ▼
    updateSession(request)    skip
          │
    session? ─YES──→ allow
          │
         NO
          │
          ▼
    redirect("/login?redirect=...")
```

### PKCE Callback Flow

```
Supabase ──→ /auth/callback?code=...&...
              │
              ▼
         createServerClient(cookies)
              │
              ▼
         exchange code for session
              │
         success ──→ redirect("/")
         failure ──→ redirect("/error")
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/supabase/client.ts` | Create | Browser client factory via `createBrowserClient` |
| `src/lib/supabase/server.ts` | Create | Server client factory via `createServerClient` (reads cookies) |
| `middleware.ts` | Create | `updateSession` middleware + matcher config |
| `src/hooks/useAuth.ts` | Create | `AuthContext`, `AuthProvider`, `useAuth` hook |
| `src/app/login/page.tsx` | Create | Login form (email/password, error state, redirect) |
| `src/app/register/page.tsx` | Create | Registration form (email/password, error state, redirect) |
| `src/app/auth/callback/route.ts` | Create | PKCE code exchange handler |
| `src/app/error/page.tsx` | Create | Generic error page for auth failures |
| `src/app/providers.tsx` | Modify | Wrap `AuthProvider` around `ChecklistContext`; accept initial session |
| `src/app/layout.tsx` | Modify | Fetch session server-side, pass to `Providers` |
| `src/components/Header.tsx` | Modify | Add `"use client"`, use `useAuth`, render email + sign-out |
| `.env.local.example` | Modify | Rename env vars to `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `package.json` | Modify | Add `@supabase/supabase-js`, `@supabase/ssr` |

## Interfaces / Contracts

```typescript
// ── src/hooks/useAuth.ts ──

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}
```

```typescript
// ── middleware.ts — matcher config ──
export const config = {
  matcher: ['/((?!login|register|auth/callback|error|_next/static|_next/image|favicon.ico).*)'],
};
```

```typescript
// ── src/app/providers.tsx — modified signature ──
interface ProvidersProps {
  children: ReactNode;
  session: Session | null;   // ← new: server-fetched initial session
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useAuth` hook (login, signup, signOut, session state) | Mock `supabase.auth` — test loading → authenticated → unauthenticated transitions |
| Integration | Login/register form submission, error display | Vitest + React Testing Library — render form, fill inputs, submit, assert redirect/error |
| Integration | Middleware redirect logic | Test matcher patterns directly; mock `updateSession` for redirect/allow branches |
| E2E | Full PKCE login flow, session persistence, sign-out | Playwright — register user, confirm session survives refresh, sign out, verify redirect |

## Migration / Rollout

No migration required. Auth is additive — existing localStorage data is untouched. Existing users without `.env.local` env vars will see runtime errors for Supabase client (expected — new env vars are required).

## Open Questions

None — all decisions have clear rationale and are scoped per proposal.
