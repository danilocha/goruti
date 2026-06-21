# Tasks: Goruti App-UI Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600-800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Phase 1 → PR 2: Phases 2-3 → PR 3: Phase 4 → PR 4: Phases 5-6 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | BottomNav + slim header + app shell | PR 1 | Base → main. Foundation all later phases depend on. |
| 2 | Framer Motion day slide + task spring + progress mount | PR 2 | Depends on PR 1 for shell structure. |
| 3 | Dark mode + ThemeProvider + palette tokens | PR 3 | Independent of animation changes. |
| 4 | Auth refinements + micro-habit interactive chips | PR 4 | Depends on PR 1 for SettingsPanel. Independent of PR 2-3. |

## Phase 1: BottomNav + Slim Header + App Shell

- [x] 1.1 Create `src/components/BottomNav.tsx` — 3-tab bar (Home, Progreso, Ajustes) with active indicator CSS class
- [x] 1.2 Create `src/components/BottomNav.module.css` — fixed bottom, `env(safe-area-inset-bottom)`, tab layout, active state, desktop ≥768px → hidden
- [x] 1.3 Create `src/components/SettingsPanel.tsx` — placeholder view container for theme toggle + user email + sign-out (wired in Phase 4)
- [x] 1.4 Create `src/components/SettingsPanel.module.css` — settings layout styles
- [x] 1.5 Modify `src/app/page.tsx` — add `useState<'home'|'progress'|'settings'>` tab state, conditional view rendering pass-through to children
- [x] 1.6 Modify `src/components/Header.tsx` — slim to day name + ProgressCircle only; remove email, sign-out, legend badges
- [x] 1.7 Modify Header CSS — slim height, sticky position, z-index above content
- [ ] 1.8 Modify `src/app/globals.css` — add `padding-bottom: env(safe-area-inset-bottom)` on main content, set `position: sticky` on header
- [ ] 1.9 Modify `src/app/layout.tsx` — add `<meta name="viewport" content="viewport-fit=cover">`

## Phase 2: Framer Motion Day Slide + Progress Mount

- [x] 2.1 Install `framer-motion` npm package (`12.40.0` — React 19 compat)
- [x] 2.2 Create animation wrapper utility — consolidated inline into `page.tsx` (direct import `motion`, `AnimatePresence`, `useReducedMotion` from `framer-motion` instead of a dynamic wrapper; simpler and avoids deferred-load complexity for a single-page app)
- [x] 2.3 Add direction tracking in `page.tsx` — `handleDayChange` compares `DAYS.indexOf(day) > DAYS.indexOf(prevRef)` to set `direction` (+1 forward, -1 backward) for slide variants
- [x] 2.4 Wrap day-dependent content in `page.tsx` — `<AnimatePresence mode="wait">` wraps `<motion.div key={selectedDay}>` with direction-aware horizontal slide variants (300ms spring)
- [x] 2.5 Modify `src/components/ProgressCircle.tsx` — replace `<circle>` with `<motion.circle>` using `initial={{ strokeDashoffset: circumference }}` → `animate={{ strokeDashoffset: offset }}` spring animation; track circumference in `useRef`
- [x] 2.6 Modify ProgressCircle CSS — SVG stroke already animatable via existing `.arc { transition: stroke-dashoffset 0.4s }`; kept as fallback behind the Framer Motion inline animation

## Phase 3: Task Card Upgrade + Toggle Animation

- [x] 3.1 Modify `src/components/TaskItem.tsx` — 28px checkbox target area, Framer Motion spring on checkmark icon (`scale` + `rotate` on toggle)
- [x] 3.2 Modify TaskItem CSS — elevated card (shadow, rounded corners, hover lift)
- [x] 3.3 Modify `src/components/TaskBlock.tsx` — replace left border with top accent bar (`--day-header` color), add shadow, rounded top corners
- [x] 3.4 Modify TaskBlock CSS — `border-top: 3px solid var(--day-color)`, `box-shadow`, border-radius

## Phase 4: Dark Mode

- [x] 4.1 Create `src/hooks/useTheme.tsx` — ThemeProvider + useTheme hook, localStorage persistence (`goruti-theme`), system preference detection via `matchMedia`, `data-theme` attribute setter, system preference change listener
- [x] 4.2 Modify `src/styles/tokens.css` — add `[data-theme="dark"]` overrides for all color tokens (--bg-primary, --bg-card, --text-primary, --text-secondary, --border-default, --shadow-card)
- [x] 4.3 Modify `src/app/layout.tsx` — add inline flash-prevention script (synchronous localStorage read), `suppressHydrationWarning`, wrap with `<ThemeProvider>` as outermost provider
- [x] 4.4 Modify `src/data/constants.ts` — add `PAL_DARK` object with dark-mode day color variants for all 7 days (same border, lighter header, dark-surface light)
- [x] 4.5 Modify `src/app/page.tsx` — import `useTheme()` + `PAL_DARK`, conditionally select palette based on `theme`; add smooth `transition` to `globals.css` for body and all elements
- [x] 4.6 Modify `src/components/SettingsPanel.tsx` — integrate `useTheme()` hook, replace `Próximamente` placeholder with toggle button + current theme label
- [x] 4.7 Modify `src/components/SettingsPanel.module.css` — add toggle switch CSS (track, thumb, hover/focus-visible states, active state with lime track)

## Phase 5: Auth Refinements

- [x] 5.1 Modify `src/app/login/page.tsx` — add `:focus-visible` lime glow ring on inputs, inline validation error messages, CSS error shake animation on submit failure
- [x] 5.2 Modify login CSS — `@keyframes shake`, `.shake` class, `:focus-visible` glow, `.fieldError` styling
- [x] 5.3 Modify `src/app/register/page.tsx` — same focus glow, inline validation, error shake as login
- [x] 5.4 Modify register CSS — same focus-visible glow, shake animation, `.fieldError` styling as login

## Phase 6: Micro-Habit Interactive Chips

- [x] 6.1 Create `src/hooks/useMicroHabits.ts` — `useState` array of 6 habit booleans, `toggle(index)` function, derived `completedCount`
- [x] 6.2 Modify `src/components/MicroHabits.tsx` — integrate `useMicroHabits` hook, `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space, CSS toggle class on click
- [x] 6.3 Modify MicroHabits CSS — chip fill transition, checked vs unchecked state (filled icon + color), `:focus-visible` ring
