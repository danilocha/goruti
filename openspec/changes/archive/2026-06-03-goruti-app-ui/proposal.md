# Proposal: Goruti App-UI Redesign

## Intent

Transform the current web-page layout into an app-like experience with bottom tab navigation, fluid animations, elevated task cards, dark mode support, and refined auth pages — without breaking any data/logic layer.

## Scope

### In Scope
- Bottom tab bar (Home, Progress, Settings) + slim fixed header
- Hybrid animations (CSS micro-interactions + Framer Motion for day slide, task spring, mount)
- Elevated task cards (top accent bar, shadow, 28px animated checkbox)
- Dark mode (CSS custom properties + ThemeProvider Context)
- Auth page refinements (lime glow focus, inline validation, error shake)
- Interactive micro-habit chips (tappable, visual toggle state)
- Phase-by-phase independent delivery

### Out of Scope
- Bottom sheet for task details, desktop sidebar layout, PWA/offline, drag-to-reorder, Supabase Realtime, full carousel swipe

## Capabilities

### New Capabilities
- `app-navigation`: Bottom tab bar + slim fixed header. Client-side view switching between Home (checklist), Progress (weekly), Settings (theme + account).
- `animations`: Hybrid system — CSS for micro-interactions, Framer Motion for day slide transitions, task toggle spring, progress circle mount. Respects `prefers-reduced-motion`.
- `dark-mode`: CSS custom properties + ThemeProvider Context. Detects `prefers-color-scheme`, persists to localStorage, sets `<html data-theme>`.
- `micro-habits-interaction`: Tappable chips with toggle state, visual feedback, and completion tracking (was static display only).

### Modified Capabilities
- `user-auth`: **Header Auth Display** requirement — email and sign-out move from header to Settings tab, no longer shown in the slim header.

## Approach

6-phase implementation (exploration-recommended order):
1. **Layout restructure** — BottomNav component, slim Header, app shell in `page.tsx` + CSS
2. **Day switch animations** — Framer Motion `AnimatePresence` + slide variants around day content
3. **Task toggle + card upgrade** — spring scale on checkmark, elevated CSS, top accent bar
4. **Dark mode** — ThemeProvider, dark palette tokens, toggle in Settings
5. **Auth refinements** — lime glow `:focus-visible`, inline validation, CSS error shake
6. **Micro-habit chips** — interactive toggle state with context integration

Zero changes to `useChecklist`, reducer, data types, or persistence layer.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/page.tsx` + CSS | Modified | App shell layout, nav orchestration |
| `src/app/layout.tsx` | Modified | ThemeProvider, viewport meta, safe areas |
| `src/app/globals.css` | Modified | Dark vars, `env(safe-area-inset-)`, animations |
| `src/app/providers.tsx` | Modified | ThemeProvider addition |
| `src/components/Header.tsx` | Modified | Slim: day name + progress circle only |
| `src/components/DayTabs.tsx` | Modified | Swipeable scroll, no full header |
| `src/components/TaskBlock.tsx` | Modified | Top accent bar, shadow, rounded corners |
| `src/components/TaskItem.tsx` | Modified | Animated checkmark, 28px target |
| `src/components/MicroHabits.tsx` | Modified | Interactive toggle, visual state |
| `src/components/ProgressCircle.tsx` | Modified | Mount animation, smoother transition |
| `src/styles/tokens.css` | Modified | Dark mode palette, animation timing tokens |
| `src/app/login`, `register/page` | Modified | Glow focus, error shake |
| `src/components/BottomNav.tsx` | **New** | Bottom tab bar with 3 tabs |
| `src/components/SettingsPanel.tsx` | **New** | Settings view (theme toggle, sign-out) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Animation a11y breakage | Low | `useReducedMotion()` + CSS `prefers-reduced-motion` |
| Desktop bottom nav UX | Med | ≥768px → slim top bar or left sidebar |
| Framer Motion bundle cost | Med | Import only `motion`, `AnimatePresence`, tree-shake |
| Dark mode color contrast | Med | WCAG AA audit on all dark palette variants |
| Swipe gesture vs scroll conflicts | Low | `touch-action: pan-y` on gesture regions |

## Rollback Plan

Phase-by-phase revert via git. Each phase is independently revertible: remove BottomNav + restore old header layout (phase 1), revert Framer Motion imports (phases 2-3), remove ThemeProvider + revert `globals.css` (phase 4). All phase commits are atomic — `git revert <commit>` is sufficient per phase.

## Dependencies

- `framer-motion` npm package (phases 2-3)
- Day palette dark variants from brand design (phase 4)

## Success Criteria

- [ ] Bottom tab bar renders 3 tabs; each switches content without page reload
- [ ] Day switch triggers smooth slide animation (Framer Motion)
- [ ] Task checkmark shows visible spring/bounce animation on toggle
- [ ] Progress circle animates on mount and on value change
- [ ] Dark mode toggle sets `<html data-theme="dark">` and persists across refresh
- [ ] All dark mode color combinations pass WCAG AA
- [ ] Auth inputs show lime glow on focus, inline errors, shake on submit error
- [ ] Micro-habit chips are tappable with visual toggle state
- [ ] All existing unit tests pass (no data/logic layer changes)
- [ ] Keyboard day tab navigation (ArrowLeft/ArrowRight) still functional
