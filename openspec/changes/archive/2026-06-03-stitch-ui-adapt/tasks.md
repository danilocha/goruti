# Tasks: Stitch UI Adaptation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500–700 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation + Header + DayTabs + BottomNav + ProgressBar (structural) → PR 2: TaskItem + Tests (interaction) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + structural components | PR 1 | tokens, dates.ts, Material Symbols, Header, DayTabs, BottomNav, ProgressBar, layout padding |
| 2 | Interaction + tests | PR 2 | TaskItem rewrite, all test updates, E2E selector migration |

## Phase 1: Foundation

- [ ] 1.1 Run `npm install material-symbols`; add `import "material-symbols/outlined"` to `layout.tsx`
- [ ] 1.2 Add 9 MD3 surface tokens + `--header-height` to `tokens.css` with `[data-theme="dark"]` overrides
- [ ] 1.3 Create `src/data/dates.ts` — `buildDayRange()` returning 7 `DayItem[]` starting from yesterday
- [ ] 1.4 Update `page.module.css` — add `padding-top: var(--header-height)` for fixed header clearance

## Phase 2: Header

- [x] 2.1 Rewrite `Header.tsx` — fixed top, calendar icon `<span>`, uppercase `<h1>`, inline percentage + progress bar (remove ProgressCircle import)
- [x] 2.2 Rewrite `Header.module.css` — `position: fixed`, `backdrop-filter: blur(12px)`, safe-area padding, `@supports not` solid fallback

## Phase 3: DayTabs

- [x] 3.1 Rewrite `DayTabs.tsx` — Stitch-style: uses `buildDayRange()` internally, renders abbreviation + date number, selected gets `surface-bright` + `outline-variant` border, props simplified to `{ selectedDay, onSelect }`
- [x] 3.2 Rewrite `DayTabs.module.css` — hide-scrollbar, full-bleed mobile scroll (negative margins), `surface-container` unselected, `surface-bright` + `outline-variant` border selected

## Phase 4: TaskItem

- [x] 4.1 Rewrite `TaskItem.tsx` — `<label>` wrapping `<input type="checkbox">`, CSS-sibling `:checked + div` for line-through, remove Framer Motion `motion.div`, `role="button"`, `onKeyDown`
- [x] 4.2 Rewrite `TaskItem.module.css` — `appearance: none` on checkbox, `::after` checkmark pseudo-element on `:checked`, `transition-colors`

## Phase 5: ProgressCircle → ProgressBar

- [x] 5.1 Rewrite `ProgressCircle.tsx` — horizontal `<div>` track + fill child, percentage label, same props interface, no SVG/circle constants, no Framer Motion
- [x] 5.2 Rewrite `ProgressCircle.module.css` — 64×4px track `surface-container-high`, fill `var(--color-lime)`, `rounded-full`, `transition: width 0.3s ease`

## Phase 6: BottomNav

- [x] 6.1 Update `BottomNav.tsx` — replace SVG icon switch with `<span class="material-symbols-outlined">` for `home_app_logo`/`analytics`/`settings`
- [x] 6.2 Update `BottomNav.module.css` — `bg-surface/80`, `backdrop-blur-md`, pill active state `rounded-full` + `bg-surface-variant`

## Phase 7: Tests

- [ ] 7.1 Unit test `buildDayRange()`: length=7, correct format, month/year boundaries, leap year
- [ ] 7.2 Update Header test: verify calendar icon span, uppercase day, progress bar renders
- [ ] 7.3 Update DayTabs test: verify 7 buttons, selected gets `.active` class, no dayProgressMap
- [ ] 7.4 Update TaskItem test: verify `<input type="checkbox">` exists, `:checked` CSS applied, no `role="button"`
- [ ] 7.5 Update ProgressCircle test: verify horizontal bar + percentage, no SVG elements
- [ ] 7.6 Update Playwright E2E: change selectors from `[role="button"]` to `input[type="checkbox"]`
