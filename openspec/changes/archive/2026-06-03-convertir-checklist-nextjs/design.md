# Design: Convertir Checklist JS → Next.js App Router

## Technical Approach

Full rewrite of `checklist.js` into a Next.js 14 App Router project (TypeScript, CSS Modules, localStorage). One page orchestrator owns state via `useReducer`; 6 leaf components render via props. Data flows unidirectionally: click → reducer → re-render → debounced localStorage write.

## Architecture Decisions

**Container-Presentational Split** — Each visual section (Header, DayTabs, TaskBlock, TaskItem, ProgressCircle, MicroHabits) is a standalone `.tsx` + `.module.css`. Page orchestrator holds state, passes props down. No prop drilling beyond 1 level. Alternatives rejected: monolithic page (untestable), Atomic Design (overkill for 6 components).

**useReducer over useState** — Reducer is a pure function `(state, action) → state` with 3 actions: `TOGGLE_TASK`, `HYDRATE`, `RESET_ALL`. Each maps 1:1 to spec scenarios and is independently testable. Zustand/Redux rejected as overkill for a nested boolean map.

**CSS Custom Properties for Day Colors** — Day wrapper sets `--day-border`, `--day-header`, `--day-light` via inline style. Children reference `var()` in CSS Modules. No runtime style computation. Rejected: inline styles (defeat CSS Modules), dynamic classes (pointless complexity).

**300ms Debounced localStorage** — `useLocalStorage` hook uses `useRef` debounce timer. Clears on each state change, writes on settle. SSR safety via `useEffect` + `typeof window`. Spec requires ≤1000ms. Rejected: save-on-every-toggle (wasteful), save-on-unload-only (crash risk).

## Data Flow

```
page.tsx (useReducer + useLocalStorage)
  │ props
  ├── Header ─── ProgressCircle (SVG via stroke-dasharray)
  ├── DayTabs (7 tabs, per-day mini bar)
  ├── TaskBlock ─── TaskItem (checkbox toggles dispatch)
  └── MicroHabits (static grid)
       │
  dispatch(TOGGLE_TASK) → reducer → re-render
                              ↓
                    useLocalStorage (300ms debounce)
                              ↓
                    localStorage key "couple-life-checklist"
```

## File Changes

| File | Action |
|------|--------|
| `checklist.js` | Keep until Session 3 |
| `package.json`, `tsconfig.json`, `next.config.mjs` | Modify (create-next-app) |
| `vitest.config.ts`, `playwright.config.ts` | Create (test configs) |
| `src/app/layout.tsx`, `page.tsx`, `globals.css`, `page.module.css` | Create (app scaffold) |
| `src/data/types.ts`, `constants.ts`, `tasks.ts`, `utils.ts` | Create (data layer) |
| `src/hooks/useChecklist.ts`, `useLocalStorage.ts` | Create (state + persistence) |
| `src/components/Header.{tsx,module.css}` + DayTabs, TaskBlock, TaskItem, ProgressCircle, MicroHabits | Create (6 × 2 files) |
| `src/data/__tests__/*.test.ts`, `src/hooks/__tests__/*.test.ts`, `src/components/__tests__/*.test.tsx` | Create (unit tests) |
| `e2e/checklist.spec.ts` | Create (Playwright) |
| `openspec/config.yaml` | Modify (context block) |

## Interfaces

```typescript
type Person = "D" | "A" | "Rot" | "DA";
type DayName = "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";

interface Task { id: string; time: string; block: string; task: string; who: Person; icon: string; note?: string; noCheck?: boolean; }
interface DayPalette { border: string; header: string; light: string; }
interface CheckState { [day: string]: { [taskId: string]: boolean } | undefined; }

type ChecklistAction =
  | { type: "TOGGLE_TASK"; day: string; taskId: string }
  | { type: "HYDRATE"; state: CheckState }
  | { type: "RESET_ALL" };
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit — Reducer | TOGGLE flips boolean, HYDRATE loads, RESET clears, unknown action noop | Vitest, pure assertions |
| Unit — Utils | resolveAssignee parity, getProgress 0 tasks, groupByBlock order | Vitest, 2+ cases each |
| Unit — Tasks | almuerzoPerson alternation, buildTasks day-specific extras | Vitest + snapshot |
| Component RTL | DayTabs 7 tabs, TaskItem checkbox+label, ProgressCircle 75% | Vitest + RTL |
| E2E | load → toggle 3 → reload verify; corrupted JSON → clean render | Playwright |

## Migration

`checklist.js` stays in root through all 3 sessions. Deleted only after Playwright persistence test passes. Git init in Session 3. Prior sessions revertable by deleting scaffold and restoring `checklist.js`.

## Session Plan

| Session | Focus |
|---------|-------|
| 1 — Scaffold + Data | `create-next-app`, `src/data/*`, `vitest.config.ts`, data tests |
| 2 — Components + State | All `src/components/*`, `src/hooks/*`, `src/app/page.tsx` |
| 3 — Polish + Tests | Playwright, remaining tests, git init, delete `checklist.js` |
