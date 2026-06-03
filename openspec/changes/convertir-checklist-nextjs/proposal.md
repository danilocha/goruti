# Proposal: Convertir Checklist JS → Next.js App Router

## Intent

Replace the 371-line `checklist.js` monolith (no build tool, no TypeScript, no persistence) with a Next.js App Router project. The goal is EXACT feature parity — not new features. The single biggest UX improvement is localStorage persistence (checks survive refresh). The app stays a single-page household routine planner for two people.

## Scope

### In Scope
- Next.js App Router scaffold with TypeScript, `src/` dir, path aliases
- All 7 day tabs with per-day color palettes, time-block task groups, rotation logic, micro-habits
- SVG circular progress bars per day
- localStorage persistence (debounced) — the critical UX win
- Component decomposition into 6 leaf components + 1 page orchestrator
- CSS Modules with CSS Custom Properties for per-day dynamic colors
- Vitest unit tests (reducers, pure functions, components) + Playwright E2E (load, toggle, persist)
- Old `checklist.js` preserved as fallback until verified

### Out of Scope
- New features (settings, history, dark mode) — deferred to separate changes
- Backend, API routes, database — not needed
- styled-components, Tailwind, or any CSS framework
- authentication, user accounts, multi-device sync
- PWA or offline support

## Capabilities

### New Capabilities
- `checklist-display`: Render 7-day household checklist with per-day colors, time blocks, task items, progress circles, micro-habits. MUST support two-person assignment with rotation logic.
- `checklist-persistence`: Persist and restore checkbox state via localStorage. MUST handle SSR safety, corrupted data fallback, and debounced writes.
- `checklist-testing`: Unit tests (Vitest) for reducers, pure functions, and components; E2E tests (Playwright) for full user flow including persistence across refresh.

### Modified Capabilities
None — this is a greenfield project with no existing specs.

## Approach

Full rewrite in 3 sessions per exploration recommendations:

1. **Session 1 — Scaffold + Data**: `npx create-next-app@latest .`, build `src/data/` (tasks, constants, types, utils), test pure functions
2. **Session 2 — Components + State**: Build all components + hooks (`useChecklist`, `useLocalStorage`), wire `page.tsx`, verify visual match
3. **Session 3 — Polish + Tests**: Playwright E2E, remaining unit tests, remove `checklist.js` (or archive), git init

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `checklist.js` | Removed | Entire file replaced by Next.js project (kept as fallback) |
| `package.json` | New | Next.js + devDependencies (Vitest, Playwright, RTL) |
| `src/app/layout.tsx` | New | Root layout with metadata, fonts |
| `src/app/page.tsx` | New | Main checklist orchestration page |
| `src/components/` | New | 6 extracted components (Header, DayTabs, TaskBlock, TaskItem, ProgressCircle, MicroHabits) |
| `src/hooks/` | New | `useChecklist` (reducer + derived state), `useLocalStorage` (persistence) |
| `src/data/` | New | `tasks.ts`, `constants.ts`, `types.ts`, `utils.ts` |
| `openspec/config.yaml` | Updated | Update tech stack, testing config after migration |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Hydration mismatch (SSR vs client state) | Medium | Use `useEffect` for localStorage reads; render placeholder during SSR |
| Visual fidelity loss in rewrite | Low | Keep `checklist.js` as reference; side-by-side comparison |
| Scope creep (adding features during migration) | Medium | Strict rule: rebuild EXACTLY what exists. New features = new change. |
| localStorage quota or SSR crash | Low | try/catch wrappers, `typeof window !== "undefined"` guard |

## Rollback Plan

1. Old `checklist.js` stays in the repo root verbatim throughout Sessions 1–3
2. If new app is broken or incomplete after any session: delete Next.js scaffold, restore `checklist.js`, revert `package.json`
3. Only delete `checklist.js` after Session 3 verification passes
4. Git init happens LAST (Session 3) — previous sessions are trivially revertable by deleting the scaffold

## Dependencies

- Node.js 18+ (Next.js 14 requirement)
- `npx create-next-app@latest` (internet access for scaffolding)

## Success Criteria

- [ ] `npm run dev` starts without errors; page renders all 7 days with tasks
- [ ] Toggling a task updates the UI immediately; progress circle reflects percentage
- [ ] Refreshing the page restores all checkbox state from localStorage
- [ ] Visual match: each day's colors, badges, rotation, and layout match the original `checklist.js`
- [ ] `npm test` passes (Vitest unit tests for reducer, utils, components)
- [ ] `npx playwright test` passes (E2E: load, toggle, persist across refresh)
- [ ] Old `checklist.js` can be deleted only after above criteria are met
