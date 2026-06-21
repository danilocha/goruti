# Design: Goruti App-UI Redesign

## Technical Approach

Phase-based, non-breaking UI overhaul using the existing container-presentational architecture. Keep `useChecklist`, reducer, and persistence untouched. Add three new components (BottomNav, SettingsPanel, ThemeProvider) and modify 8 existing ones. Animations use the proposed hybrid strategy: CSS transitions for micro-interactions, Framer Motion (only `motion` + `AnimatePresence` + `useReducedMotion`) for day slides, task springs, and progress circle mount.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| View switching | `useState` in `page.tsx` + conditional render | Next.js parallel routes, URL search params | Single-page app with no route changes — lowest complexity, no router coupling |
| Tab state | Local state in page shell | Context, zustand | State is only needed by BottomNav + content area — no prop drilling issue |
| Animations library | Framer Motion (minimal imports) | CSS-only, react-spring, motion-one | Best React integration, spring physics for toggle, `AnimatePresence` for layout exit/enter. Import only what's used for <4KB gzip |
| Dark mode | ThemeProvider + `[data-theme]` CSS vars | Tailwind dark:, CSS-only without context | Components need runtime theme awareness (e.g., SVG stroke color). Context enables toggle without prop drilling |
| Micro-habits state | Local `useState` array + derived progress | Store in reducer, context | Zero data-layer changes mandate. Local state with completion callback for progress contribution |
| Desktop breakpoint | BottomNav → slim top bar at ≥768px | Sidebar, no change | Minimal code change. Top bar reuses same tab components with a horizontal layout |
| Framer Motion bundling | Dynamic `import()` in animation wrapper | Static import everywhere | Defers library load until first animation trigger. Keeps initial bundle lean |

## Data Flow

```
Theme switching:
  Settings toggle → ThemeContext.toggleTheme()
    → localStorage.setItem("theme", "dark")
    → document.documentElement.dataset.theme = "dark"
    → CSS [data-theme="dark"] vars activate
    → body { background: var(--bg-primary) } reacts automatically

Micro-habit toggle:
  Chip click → useMicroHabits.toggle(index)
    → local state updates checked set
    → CSS class flips for visual state
    → derived localProgress recalculated
    → MicroHabits section shows sub-progress

Day slide (Framer Motion):
  DayTabs onSelect(dir) → track direction (left/right)
    → selectedDay state updates
    → AnimatePresence captures exiting content
    → motion.div slides in from direction; exiting slides opposite
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/BottomNav.tsx` + CSS | Create | 3-tab bar (Home, Progreso, Ajustes). Active tab indicator. |
| `src/components/SettingsPanel.tsx` + CSS | Create | Settings view: theme toggle + user email + sign-out. |
| `src/contexts/ThemeContext.tsx` | Create | ThemeProvider + `useTheme()` hook. Sets `data-theme`, detects `prefers-color-scheme`, persists to localStorage. |
| `src/hooks/useMicroHabits.ts` | Create | Toggle state for 6 habits + derived completion count. |
| `src/app/page.tsx` | Modify | App shell — BottomNav + active tab state + conditional view rendering. Pass `setSelectedDay` with direction for Framer Motion. |
| `src/app/layout.tsx` | Modify | Add `<meta viewport-fit=cover>`, wrap with ThemeProvider. |
| `src/app/providers.tsx` | Modify | Add ThemeProvider wrapper inside AuthProvider. |
| `src/components/Header.tsx` + CSS | Modify | Slim: day name + ProgressCircle only. Remove email, sign-out, legend badges. |
| `src/components/DayTabs.tsx` + CSS | Modify | Add direction tracking for slide animation. |
| `src/components/TaskItem.tsx` + CSS | Modify | 28px checkbox, spring checkmark via Framer Motion, elevated row. |
| `src/components/TaskBlock.tsx` + CSS | Modify | Top accent bar (was left border), shadow, `--day-header` top border. |
| `src/components/ProgressCircle.tsx` + CSS | Modify | Framer Motion `initial={{ pathLength: 0 }}` → `animate={{ pathLength: progress }}`. |
| `src/components/MicroHabits.tsx` + CSS | Modify | Use `useMicroHabits` hook. Tappable chips with CSS toggle state. Keyboard accessible. |
| `src/styles/tokens.css` | Modify | Add `[data-theme="dark"]` overrides for all color tokens. |
| `src/app/globals.css` | Modify | Safe area padding: `padding-bottom: env(safe-area-inset-bottom)`. Base transition for theme switch. |
| `src/app/login/page.tsx` + CSS | Modify | `:focus-visible` lime glow, inline validation, CSS error shake. |
| `src/app/register/page.tsx` + CSS | Modify | Same auth refinements as login. |

## Dark Mode Token Schema

```css
:root {
  --bg-primary: var(--color-cream);
  --bg-card: #FFFFFF;
  --text-primary: var(--color-black);
  /* ... light palette ... */
}

[data-theme="dark"] {
  --bg-primary: #1A1817;
  --bg-card: #242220;
  --text-primary: #E8E4DD;
  --text-secondary: #8A8580;
  --border-default: #3A3835;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.4);
}
/* Day palette dark variants use luminance-shifted values */
```

Day palettes (`PAL`) need dark variants — each day's `border`, `header`, `light` values get dark-mode overrides via `[data-theme="dark"] .day-{name}` or inline JS detection.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | ThemeContext — detection, toggle, persistence | Vitest: mock `matchMedia`, localStorage |
| Unit | useMicroHabits — toggle, progress derivation | Vitest: state transitions |
| Component | BottomNav — tab switch fires callback, active class | Vitest + RTL |
| Component | MicroHabits — click toggles visual state | Vitest + RTL, keyboard Enter/Space |
| E2E | Auth refinement — focus glow, error shake appears | Playwright: focus assertion, class presence |
| Visual | Dark mode — all views render without contrast issues | Manual WCAG AA audit |

## Migration / Rollout

Six independent phases, each atomically revertible. No data migration required. Phase order: (1) BottomNav + slim header + app shell, (2) Framer Motion day slide, (3) Task toggle spring + card upgrade, (4) Dark mode, (5) Auth refinements, (6) Micro-habit interactivity.

## Open Questions

- [ ] Day palette dark variants — need exact hex values from design for all 7 days' border/header/light colors
- [ ] Progress view tab content — placeholder page needed for "Progreso" tab until weekly view is specified
