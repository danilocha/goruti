# Tasks: Convertir Checklist JS → Next.js App Router

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1000–1400 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Scaffold + Data layer + tests | PR 1 | `create-next-app`, `src/data/*`, vitest config, data tests |
| 2 | All components + hooks + page | PR 2 | 6 components + styles, 2 hooks, `page.tsx` |
| 3 | E2E + polish + git init | PR 3 | Playwright, remaining tests, delete `checklist.js`, config update |

## Phase 1: Scaffold + Data (Session 1)

- [x] 1.1 Run `create-next-app` with TypeScript, App Router, `src/` dir, path aliases
- [x] 1.2 Create `src/data/types.ts` — CheckState, ChecklistAction, Task, DayPalette, Person, DayName
- [x] 1.3 Create `src/data/constants.ts` — DAYS, PAL (color palettes), WHO_STYLE, STORAGE_KEY
- [x] 1.4 Create `src/data/tasks.ts` — buildTasks() with almuerzoPerson alternation, day extras
- [x] 1.5 Create `src/data/utils.ts` — resolvePersonStyle, resolveAssignee (parity), getProgress, groupByBlock
- [x] 1.6 Create `vitest.config.ts` + `src/data/reducer.ts`; write `src/data/__tests__/reducer.test.ts` — TOGGLE, HYDRATE, RESET, unknown action noop
- [x] 1.7 Write `src/data/__tests__/utils.test.ts` (17 tests) + `tasks.test.ts` (18 tests) — rotation, getProgress(0), groupByBlock, day extras

## Phase 2: Components + State (Session 2)

- [x] 2.1 Create `src/hooks/useLocalStorage.ts` — SSR guard, 300ms debounce, try/catch parse, corrupted data fallback
- [x] 2.2 Create `src/hooks/useChecklist.ts` — imports reducer from `src/data/reducer.ts`, useReducer + derived state (tasks, blocks, progress), memoize with useMemo
- [x] 2.3 Create `src/app/providers.tsx` — client wrapper that loads localStorage on mount and dispatches HYDRATE (prevents hydration mismatch)
- [x] 2.4 Create `src/components/Header.tsx` + `Header.module.css` — gradient header bar, day name, legend badges (D/A/Rot/D+A), embeds ProgressCircle
- [x] 2.5 Create `src/components/DayTabs.tsx` + `DayTabs.module.css` — 7 scrollable tabs with per-day mini progress bar, active color from palette
- [x] 2.6 Create `src/components/ProgressCircle.tsx` + `ProgressCircle.module.css` — SVG circle using stroke-dasharray, shows percentage text in center
- [x] 2.7 Create `src/components/TaskItem.tsx` + `TaskItem.module.css` — checkbox (styled div), time, task name + icon, assignee badge, note, line-through when checked, CSS Custom Properties for dynamic day colors
- [x] 2.8 Create `src/components/TaskBlock.tsx` + `TaskBlock.module.css` — time block wrapper with left border accent in day color, collapsible with local useState
- [x] 2.9 Create `src/components/MicroHabits.tsx` + `MicroHabits.module.css` — static 2-column grid of 6 habits, green badges
- [x] 2.10 Wire `src/app/page.tsx` + `page.module.css` — orchestrator: useChecklist, sets CSS Custom Properties on container, renders all components
- [x] 2.11 Update `src/app/layout.tsx` + `globals.css` — root layout with metadata, Providers wrapper, global styles

## Phase 3: Polish + Tests (Session 3)

- [x] 3.1 Write component RTL tests: DayTabs (7 tabs, 6 tests), TaskItem (checkbox+label+badge, 11 tests), ProgressCircle (6 tests), Header (6 tests), TaskBlock (7 tests), MicroHabits (3 tests) — 39 component tests total
- [x] 3.2 Create `playwright.config.ts`; write `e2e/checklist.spec.ts` — 5 E2E tests: render 7 tabs, toggle+progress, multi-day toggle, persist after reload, corrupted JSON clean render
- [x] 3.3 Verify `npm test` (Vitest: 83/83 pass) and `npx playwright test` (5/5 pass); visual compare with original checklist.js — behaviors match
- [x] 3.4 Delete `checklist.js` (E2E persistence test passed); update `openspec/config.yaml` context block to Next.js stack
- [x] 3.5 `.gitignore` created; `git init` + initial commit: "feat: convert monolithic checklist.js to Next.js 16 App Router"
