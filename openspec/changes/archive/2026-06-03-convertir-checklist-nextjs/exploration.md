# Exploration: Convertir Checklist JS → Next.js App Router

## Current State

The project is a single 371-line React component (`checklist.js`) that renders a household routine planner for two people (D = Daniel, A = Novia). It features:

- 7 color-coded day tabs (Lunes–Domingo) with per-day task lists
- Tasks grouped by time blocks (🌅 Mañana, 💼 Trabajo, ☀️ Mediodía, 🌙 Noche, etc.)
- SVG circular progress bar per day showing completion percentage
- Rotation logic for almuerzo cooking (even/odd day index)
- Per-day extra tasks (laundry, cleaning, bathroom, trash, etc.)
- Micro-habits section (6 instant habits grid)
- Inline styles via React `style` props
- All state in `useState` — **no persistence** (checks lost on refresh)
- **No package.json, no build tool, no TypeScript, no tests**

```text
couple-life/
├── checklist.js       ← 371-line monolith (the entire app)
├── openspec/
│   ├── config.yaml
│   └── changes/
└── .atl/
```

## Affected Areas

| Path | Why Affected |
|------|-------------|
| `checklist.js` | Entire file will be replaced by the Next.js app |
| `package.json` | Needs creation (currently none) |
| `next.config.js` | Needs creation for App Router setup |
| `tsconfig.json` | Needs creation if TypeScript is adopted |
| `src/app/layout.tsx` | Root layout (was implicit in the original single component) |
| `src/app/page.tsx` | Main checklist page (the new home of the feature) |
| `src/components/` | All extracted components from the monolith |
| `src/hooks/` | Custom hooks for state and persistence |
| `src/data/` | Task data, color palettes, constants |
| `src/types/` | TypeScript type definitions |
| `vitest.config.ts` | Test runner configuration |

---

## 1. File Structure & Routes

### Route Design

The current app is a single-page checklist — no routing is needed _today_. However, the App Router cost is minimal and future routes justify the structure:

| Route | Purpose | Priority |
|-------|---------|----------|
| `/` | Main checklist (day tabs, tasks, progress) | **Now** |
| `/settings` | Configure people names, rotation rules, theme | Future |
| `/history` | View past completion data (requires persistence) | Future |
| `/habits` | Dedicated micro-habits view | Future |

**Recommendation**: Start with a single route (`/`) but set up the App Router layout structure so adding routes later is a file creation, not a refactor.

### Proposed Directory Structure

```
src/
├── app/
│   ├── layout.tsx            ← Root layout (fonts, metadata, providers)
│   ├── page.tsx              ← Main checklist page
│   ├── globals.css           ← Tailwind base imports (if using Tailwind)
│   └── providers.tsx         ← Client-side context wrappers
├── components/
│   ├── layout/
│   │   ├── Header.tsx        ← Gradient header, title, legend
│   │   └── DayTabs.tsx       ← Scrollable day selector tabs
│   ├── tasks/
│   │   ├── TaskBlock.tsx     ← Time-block group (collapsible)
│   │   ├── TaskItem.tsx      ← Single task row (checkbox, time, name, badge)
│   │   └── TaskList.tsx      ← Renders all blocks for a day
│   ├── progress/
│   │   └── ProgressCircle.tsx← SVG circular progress bar
│   └── habits/
│       └── MicroHabits.tsx   ← Instant habits grid section
├── hooks/
│   ├── useChecklist.ts       ← Core checklist state logic
│   └── useLocalStorage.ts    ← Persistence to localStorage
├── data/
│   ├── tasks.ts              ← buildTasks() and day-specific extras
│   ├── constants.ts          ← DAYS, PAL, WHO_STYLE, colors
│   └── types.ts              ← Task, DayName, WhoBadge, etc.
└── lib/
    └── utils.ts              ← almuerzoPerson, helpers
```

**Rationale**: Every abstraction is one directory deep. The component split follows the visual hierarchy of the page. `data/` is separated from `components/` because the task definitions are pure data — they could be JSON or fetched from an API in the future.

---

## 2. Component Decomposition

The 371-line monolith decomposes naturally into these components:

### 2.1 `Header.tsx`
- **Responsibility**: Gradient header bar, day name, legend badges
- **Props**: `selectedDay: string`, `pct: number`, `done: number`, `total: number`, `pal: ColorPalette`
- **Sub-components embedded**: Legend badges (could be inline or a small `LegendBadge` sub-component)

### 2.2 `DayTabs.tsx`
- **Responsibility**: Horizontal scrollable tabs for 7 days, per-day mini progress bars
- **Props**: `days: DayData[]`, `selectedDay: string`, `onSelect: (day: string) => void`, `checks: CheckState`, `todayName: string`
- **State**: None (controlled by parent)

### 2.3 `TaskBlock.tsx`
- **Responsibility**: Group tasks by time block label; collapsible UI
- **Props**: `label: string`, `tasks: Task[]`, `dayChecks: Record<string, boolean>`, `pal: ColorPalette`, `onToggle: (id: string) => void`
- **State**: `collapsed: boolean` (local UI state)
- **Edge case**: When collapsed and all tasks are checked, consider auto-hide or visual cue

### 2.4 `TaskItem.tsx`
- **Responsibility**: Single task row — checkbox, time, task name, notes, who-badge
- **Props**: `task: Task`, `checked: boolean`, `pal: ColorPalette`, `onToggle: () => void`
- **Edge case**: `noCheck` tasks (like "Trabajo" or "Acostarse") show icon instead of checkbox and are not clickable

### 2.5 `ProgressCircle.tsx`
- **Responsibility**: SVG circular progress ring with percentage text
- **Props**: `pct: number`, `size?: number`, `strokeWidth?: number`
- **State**: None (pure SVG)
- **Design decision**: Make the SVG reusable by extracting the circle math into a pure function

### 2.6 `MicroHabits.tsx`
- **Responsibility**: Static 2-column grid of 6 micro-habits
- **Props**: None (could accept optional `habits` array for future customization)
- **State**: None (static content)

### 2.7 `ChecklistPage` (in `page.tsx`)
- **Responsibility**: Orchestrator — selects the active day, computes progress, coordinates all sub-components
- **Props**: None (page-level)
- **Hooks**: `useChecklist()`
- **State**: `selectedDay`, `checks` (via custom hook)

### State Flow Diagram

```
page.tsx (ChecklistPage)
  ├── Header            ← receives selectedDay, pct, pal
  ├── DayTabs           ← receives allDays, selectedDay, checks, onSelect
  ├── TaskList
  │   ├── TaskBlock     ← receives label, tasks[], dayChecks, onToggle
  │   │   └── TaskItem  ← receives task, checked, onToggle
  │   └── TaskBlock...
  ├── ProgressCircle    ← receives pct
  └── MicroHabits      ← static, no props needed
```

---

## 3. State Management & Persistence

### 3.1 useState vs useReducer

**Current state shape**:
```typescript
type CheckState = Record<string, Record<string, boolean>>;
// checks[dayName][taskId] = true/false
```

| Approach | Pros | Cons |
|----------|------|------|
| `useState` | Simple, matches current code, good enough for <50 tasks | Deeply nested update logic, prone to stale closures |
| `useReducer` | Predictable updates, easy to add undo/history, testable reducers | More boilerplate for a small app |

**Recommendation**: Start with `useReducer` because:
1. The toggle update (`...prev, [day]: { ...prev[day], [id]: !prev[day][id] }`) is exactly the kind of nested state that reducers handle cleanly
2. A reducer makes it trivial to add persistence syncing, logging, or undo later
3. The reducer is pure and trivially testable without React

```typescript
type Action =
  | { type: "TOGGLE"; day: string; taskId: string }
  | { type: "LOAD"; state: CheckState };

function checklistReducer(state: CheckState, action: Action): CheckState {
  switch (action.type) {
    case "TOGGLE":
      return {
        ...state,
        [action.day]: {
          ...state[action.day],
          [action.taskId]: !state[action.day]?.[action.taskId],
        },
      };
    case "LOAD":
      return action.state;
    default:
      return state;
  }
}
```

### 3.2 localStorage Persistence

**Current**: Checks are lost on every page refresh. This is the single biggest UX improvement the conversion brings.

**Design**:
- Read on mount: `localStorage.getItem("couple-life-checklist")` → parse → dispatch `LOAD`
- Write on change: `useEffect` watches `checks` state → `localStorage.setItem(...)` on every toggle
- Debounce writes (300ms) to avoid excessive serialization during rapid toggling

**Edge cases to handle**:
- Corrupted localStorage data → fall back to empty state
- SSR/SSG safety → check `typeof window !== "undefined"` before accessing localStorage
- Storage quota exceeded → graceful fallback (user can still use, just no persistence)

### 3.3 Custom Hook Design

```typescript
// useLocalStorage.ts
function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // Handles SSR, hydration mismatch, corrupted data
  // Returns [storedValue, setValue] mirroring useState
}

// useChecklist.ts
function useChecklist() {
  const [checks, dispatch] = useReducer(checklistReducer, {});
  const [selectedDay, setSelectedDay] = useState(defaultDay());

  // Load from localStorage on mount
  // Save to localStorage on every toggle (debounced)
  // Compute derived data: tasks, pct, blocks, etc.

  return {
    selectedDay,
    setSelectedDay,
    checks,
    toggle: (taskId: string) => dispatch({ type: "TOGGLE", day: selectedDay, taskId }),
    progress: { done, total, pct },
    tasks,
    blocks,
  };
}
```

**Important**: The `useChecklist` hook should NOT re-compute `tasks` and `blocks` on every render. Use `useMemo` for derived data. The `blocks` computation (filter + group) runs on every day change, which is O(n) on ~20 tasks — trivially fast, but a good habit to memoize.

---

## 4. Build Tool & Testing

### 4.1 Test Runner

| Feature | Vitest | Jest |
|---------|--------|------|
| Speed | Faster (esbuild-based) | Slower |
| ESM support | Native | Requires extra config |
| React Testing Library integration | Same API | Same API |
| Config overhead | Minimal (works with Vite) | More config |
| Community | Growing fast, standard in Next.js ecosystem | Mature but declining |

**Recommendation**: **Vitest** — it's the de-facto standard in the Next.js/Vite ecosystem, faster, and less config. The API is compatible with Jest (you can even use `expect` the same way).

### 4.2 Test Layers

| Layer | What to Test | Tool | Priority |
|-------|-------------|------|----------|
| **Unit** | Reducers, pure functions (`almuerzoPerson`, `buildTasks`), data transformations | Vitest | High |
| **Unit** | Individual components (`TaskItem`, `ProgressCircle`, `Header`) | Vitest + RTL | High |
| **Integration** | `useChecklist` hook behavior (toggle, persist, load) | Vitest + RTL | Medium |
| **E2E** | Full flow: select day, toggle tasks, verify progress bar updates, refresh and verify persistence | Playwright | Medium |

### 4.3 E2E Framework

| Feature | Playwright | Cypress |
|---------|-----------|---------|
| Speed | Fast (multi-browser parallel) | Slower |
| Browser support | Chromium, Firefox, WebKit | Chromium, Firefox, WebKit (Electron) |
| Component testing | Yes (experimental) | Yes (requires Cypress 10+) |
| File handling | Native | Requires plugins |
| TypeScript support | First-class | First-class |

**Recommendation**: **Playwright** — faster, better parallelization, and native TypeScript support. For a single-page checklist app, you mainly need:
- Load page, verify day tabs render
- Click a task, verify it checks and progress updates
- Refresh page, verify state persisted
- Test each day's tasks render correctly

### 4.4 Test Setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

For E2E:
```bash
npm install -D @playwright/test
npx playwright install
```

**Key config point**: `vitest.config.ts` needs `environment: "jsdom"` for React component tests, and the setup file should extend `@testing-library/jest-dom/vitest` (Vitest-compatible import).

---

## 5. Styling Approach

The current app uses:
- Dark gradient header (`#0F172A → #1E1B4B`)
- 7 distinct color palettes (one per day) with border/header/light variants
- Rounded cards, subtle borders, specific spacing
- Badges with background + text color per person (`WHO_STYLE`)

### Options Compared

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Tailwind CSS** | Fast prototyping, utility classes map 1:1 to current inline styles, excellent with Next.js, dark mode ready, small prod CSS (purge) | Learning curve, config overhead, long className strings, per-day colors require `@apply` or dynamic class generation | Fast-paced projects, devs familiar with Tailwind |
| **CSS Modules** | Zero runtime, scoped by default, no config (Next.js built-in), clean separation, easy to understand | More files, naming conventions, dynamic styles require inline overrides or CSS custom properties | Teams that prefer "real CSS", simpler mental model |
| **Inline styles** | What we have now, zero setup | No media queries, no pseudo-classes, no animations, no scoping, poor DX, no purging | Not recommended for a rebuild |

### Recommendation: **CSS Modules** with CSS Custom Properties for per-day colors

**Why CSS Modules over Tailwind**:
1. The current app's visual identity is highly **color-per-day** — each of the 7 days has a distinct color palette (border, header background, light background). With Tailwind, you'd need to either generate classes dynamically or use `style` fallbacks, defeating the purpose.
2. CSS Modules are **zero-config** in Next.js (built-in support).
3. The component count is small (6–8 components) — CSS Modules add proportionally fewer files than they would in a large app.
4. **CSS Custom Properties** solve the per-day color problem cleanly:

```css
/* TaskItem.module.css */
.row {
  border-left: 4px solid var(--day-border);
  background: var(--day-light);
}
```

```tsx
// Usage in component
<div className={styles.row} style={{
  "--day-border": pal.border,
  "--day-light": pal.light,
} as React.CSSProperties}>
```

This keeps the styling **declarative and scoped** while allowing dynamic day colors without inline styles everywhere.

**If Tailwind is preferred**: Create a plugin or use `style` prop for the dynamic colors, and use Tailwind utilities for layout, spacing, and typography. This hybrid approach works but is less clean.

---

## 6. Migration Strategy

### Options

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **Full Rewrite** | Clean architecture, no legacy baggage, can start fresh | Longer before first usable output, risk of missing behavior | 2–3 sessions |
| **Incremental** | Ship working pieces early, validate each step | Awkward interim state, dual-maintenance during migration, harder to test | 3–4 sessions |
| **Side-by-side** | Always have a working app, can A/B test | Duplicate effort, confusing file structure, no architectural benefit | Not recommended |

### Recommended: **Full Rewrite**

**Rationale**:
1. The source is 371 lines of a single component — there's nothing to incrementally extract. The entire file IS the app.
2. There's no build tool, no routing, no persistence — every session of "incremental migration" would be building the Next.js scaffolding anyway.
3. The old `checklist.js` stays in the repo verbatim until the new app is verified working. You can always fall back.
4. The risk of missing behavior is low — the visual output is deterministic (same inputs → same UI). Simply compare the rendered output for each day.

### Migration Steps

```
Session 1: Scaffold + Data Layer
  - npx create-next-app, TypeScript, App Router
  - Create src/data/ (tasks.ts, constants.ts, types.ts)
  - Write tests for pure functions
  - Verify: import and log buildTasks output

Session 2: Components + State
  - Create all components (Header, DayTabs, TaskBlock, TaskItem, ProgressCircle, MicroHabits)
  - Implement useChecklist + useLocalStorage hooks
  - Wire up page.tsx
  - Verify: visual match to original, toggle works, persistence works

Session 3: Polish + Testing + Cleanup
  - Add E2E test (Playwright)
  - Add remaining unit tests
  - Remove old checklist.js (or move to _archive/)
  - git init, first commit
```

---

## 7. Project Initialization

### 7.1 TypeScript: **YES**

**Reasons**:
1. The task data structure (`Task`, `DayName`, `CheckState`, `WhoBadge`) has explicit shapes — TypeScript catches mismatches at compile time
2. Next.js + App Router has first-class TypeScript support — not using it is fighting the framework
3. The project is small enough that adding types is trivial, but will catch real bugs (e.g., passing a wrong day name to `buildTasks`)

### 7.2 Core Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.0.0",
    "vitest": "^1.6.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^24.0.0",
    "@playwright/test": "^1.44.0"
  }
}
```

The app has **zero runtime dependencies** beyond React + Next.js — no state management library, no UI kit, no CSS framework. This is a strength, not a weakness.

### 7.3 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // No special config needed for App Router — it's the default
  // If using CSS Modules, no config needed (built-in)
};

module.exports = nextConfig;
```

### 7.4 Init Command

```bash
npx create-next-app@latest . --typescript --app --src-dir --no-tailwind --no-eslint --import-alias="@/*"
```

This creates the Next.js 14+ App Router project in the **current directory** (replacing nothing since there's no `package.json` yet), with TypeScript, src directory, and path aliases. The `--no-tailwind` flag is recommended because we're using CSS Modules per the styling analysis above.

---

## Approaches Summary

| Aspect | Recommendation | Key Justification |
|--------|---------------|-------------------|
| **Routing** | Single route (/) with App Router layout | Future-proof, minimal upfront cost |
| **Components** | 6 extracted components + 1 orchestrator | Follows visual hierarchy, single responsibility |
| **State** | useReducer + custom hooks | Predictable nested updates, testable, extensible |
| **Persistence** | localStorage (debounced) | Biggest UX win, simple, no backend needed |
| **Styling** | CSS Modules + CSS Custom Properties | Zero-config in Next.js, handles per-day colors cleanly |
| **Testing** | Vitest (unit) + Playwright (E2E) | Fast, modern, TypeScript-native |
| **Build** | create-next-app (App Router, TypeScript, src dir) | Industry standard, zero-effort scaffolding |
| **Strategy** | Full rewrite (keep old file as fallback) | 371 lines is small enough, no benefit to incremental |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Hydration mismatch** between SSR and client state | UI flicker, React error | Use `useEffect` for localStorage, render placeholder during SSR, or use `next/dynamic` with `ssr: false` for the client component |
| **Loss of visual fidelity** during rewrite | User experience degraded | Keep old `checklist.js` as reference, compare side-by-side during development |
| **localStorage quota exceeded** (unlikely for this data) | Persistence silently fails | Wrap `setItem` in try/catch, show subtle warning if storage fails |
| **Scope creep** — adding features during migration | Never ships | Strict rule: rebuild EXACTLY what exists. New features are a separate change. |
| **TSL errors scare a non-TypeScript user** | Abandonment | Use strict mode but with `strict: false` initially, then ratchet up. Or use JSDoc types. |

---

## Ready for Proposal

**Yes**. The exploration is complete and concrete. The orchestrator should proceed to `sdd-propose` with this analysis as the foundation.

The key decisions for the proposal phase:
1. **TypeScript**: yes (recommended) or no (user preference)?
2. **CSS approach**: CSS Modules (recommended), Tailwind, or inline?
3. **E2E**: include Playwright now or add in a follow-up?
4. **Migration order**: full rewrite in 3 sessions (recommended) vs a different split?
