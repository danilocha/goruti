# Exploration: supabase-auth

## Current State

The project is a single-page Next.js 16 App Router checklist app with NO authentication. Currently:

- No middleware exists; all routes are public
- No auth infrastructure (no Supabase client, no session handling)
- Single `Providers` wrapper in `src/app/providers.tsx` that provides only `ChecklistContext`
- Root layout at `src/app/layout.tsx` wraps `<Providers>{children}</Providers>`
- Data persisted via `localStorage` only — no backend
- Header component is purely presentational (day name, progress circle, legend)
- `src/lib/` directory does not exist
- `.env.local` has Supabase credentials but they use non-standard variable names (`SUPABASE_PROJECT_URL`, `SUPABASE_API_KEY`) — browser code needs `NEXT_PUBLIC_` prefix to be accessible on the client

## Affected Areas

- `src/app/layout.tsx` — must wrap content with AuthProvider (nest inside or wrap around Providers)
- `src/app/providers.tsx` — needs AuthProvider integration or a separate provider
- `src/app/page.tsx` — must check auth session on load, redirect if unauthenticated
- `src/components/Header.tsx` — needs user info display and sign-out button
- `.env.local` — env vars need `NEXT_PUBLIC_` prefix for client-side access
- `src/lib/supabase/client.ts` — NEW: browser-side Supabase client
- `src/lib/supabase/server.ts` — NEW: server-side Supabase client (for server actions / RSC)
- `middleware.ts` — NEW: root-level Next.js middleware for route protection
- `src/app/login/page.tsx` — NEW: login page with email/password form
- `src/app/register/page.tsx` — NEW: registration page with email/password form
- `src/app/auth/callback/route.ts` — NEW: PKCE auth callback handler (if using PKCE flow)
- `src/hooks/useAuth.ts` — NEW: auth session hook
- `src/app/error/page.tsx` — NEW: generic error page (for auth redirects)
- `package.json` — add `@supabase/supabase-js` and `@supabase/ssr` dependencies

## Key Findings

### Environment Variable Naming
Current `.env.local` uses `SUPABASE_PROJECT_URL` and `SUPABASE_API_KEY`. For client-side code in Next.js, env vars MUST be prefixed with `NEXT_PUBLIC_` or they'll be `undefined` in the browser. The `SUPABASE_API_KEY` value starts with `sb_publishable_` which confirms it's the anon/publishable key.

**Required rename:**
- `SUPABASE_PROJECT_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_API_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Authentication Flow
Supabase Auth with Next.js App Router uses PKCE by default. The flow:
1. Client calls `supabase.auth.signInWithPassword()` or `supabase.auth.signUp()`
2. Supabase sets session cookies via the SSR cookie handler
3. Middleware reads/refreshes cookies on every request via `createServerClient`
4. Server actions read session via the server client

### Route Protection Strategy
Two layers of protection:
1. **Middleware** (server-side): Redirects unauthenticated requests to `/login` for protected routes
2. **Client-side**: AuthProvider checks session on mount, renders loading state while checking

## Approaches

### Approach 1: Direct Supabase SSR (Recommended)
The standard `@supabase/ssr` setup following the official patterns:
- `createBrowserClient` in `client.ts`
- `createServerClient` in `server.ts`
- `createServerClient` in `middleware.ts` with `getAll`/`setAll` cookie handlers
- Server actions for login/signup
- Auth context hook with session state

**Pros:**
- Official, well-documented pattern
- Works with PKCE flow (more secure)
- Handles cookie lifecycle automatically
- Middleware refreshes session transparently
- Works with Next.js 16 App Router

**Cons:**
- Server actions need separate error handling vs client-side redirects
- Need to handle both loading and error states

**Effort:** Medium

### Approach 2: Client-Only Auth
Skip middleware and server actions; handle everything client-side:
- Create the Supabase browser client only
- Store session in React context
- Check session on mount, redirect client-side
- Use client components for everything

**Pros:**
- Simpler to implement
- Fewer files to create
- Works without middleware

**Cons:**
- Less secure (no server-side enforcement)
- Flash of unprotected content before JS loads
- No SSR benefits for protected pages
- Cookie management is manual

**Effort:** Low

### Approach 3: Auth Helpers Pattern (Deprecated)
The old `@supabase/auth-helpers-nextjs` package.

**Pros:**
- Some projects still use it

**Cons:**
- Officially deprecated in favor of `@supabase/ssr`
- Incompatible with newer Supabase features
- Not recommended for new projects

**Effort:** Low (but blocked by deprecation)

## Recommendation

**Approach 1 (Direct Supabase SSR)** is the correct choice. This is the officially supported pattern and the most secure. The setup is well-documented with clear examples from the `@supabase/ssr` package.

## Risks

1. **Env var rename required**: The existing `SUPABASE_PROJECT_URL` and `SUPABASE_API_KEY` must be renamed to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` respectively. This is a breaking change for any code that reads the old names. The `SUPABASE_PASSWORD` and `SUPABASE_POSTGRESQL` vars are not needed for auth and can stay as-is (or be removed from `.env.local`).

2. **Next.js 16 compatibility**: The `@supabase/ssr` package's cookie API changed across versions. The current snippets show `async` cookie handling with `getAll`/`setAll`. Need to pin the correct version compatible with Next.js 16.

3. **Middleware execution order**: Next.js middleware runs on every matching route. The `matcher` config in `middleware.ts` must exclude static assets and API routes to avoid unnecessary Supabase calls.

4. **Session not persistent after browser close**: By default, Supabase session cookies are session cookies. If the user closes the browser, they'll need to log in again. Consider `cookieOptions.maxAge` for persistence.

5. **Existing localStorage data**: After adding auth, the checklist data in localStorage is per-browser, not per-user. Future user-scoped backend storage would need migration. For now, localStorage continues to work but all users on the same browser share data.

6. **Error page dependency**: The login/signup server actions redirect to `/error` on failure. An error page must exist or the redirects need to point elsewhere (e.g., back to login with query params).

## Ready for Proposal

Yes. The approach is clear, the risks are understood, and the integration points are well-identified. Proceed to `sdd-propose` to define scope, requirements, and the rollout plan.

Page Budget Forecast (400-line review guard): **Medium**. The change spans ~8-10 new/modified files. Total additions will likely be 350-600 lines. If it exceeds 400, recommend chained PRs: first PR = Supabase client setup + env vars + middleware, second PR = auth pages + integration.
