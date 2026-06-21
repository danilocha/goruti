# Proposal: Stitch UI Adaptation

## Intent

Adapt the Stitch visual design into Goruti — new header, date-based day tabs, native checkboxes, progress bar, Material Symbols — without touching data layer or state management. Pure presentational refresh.

## Scope

### In Scope
- **Header**: fixed position, backdrop-blur, calendar icon, uppercase day name, horizontal progress bar
- **DayTabs**: 7 date-based entries starting yesterday, surface-bright selected style, no per-day progress
- **TaskItem**: native `<input type="checkbox">` with CSS checkmark, CSS-only checked transitions
- **ProgressCircle → ProgressBar**: horizontal `<div>` bar replacing SVG circle
- **BottomNav**: Material Symbols Outlined, surface/80 bg + backdrop-blur, pill active state
- **tokens.css**: +~15 MD3 surface tokens merged into dark/light system
- **New `src/data/dates.ts`**: `buildDayRange()` utility for date calculation
- **Material Symbols**: npm package + globals.css import

### Out of Scope
- No data layer, state model, or type changes (day names remain state keys)
- No Tailwind — all translated to CSS Modules
- No Framer Motion removal from page transitions
- No new features or content changes
- No task data, micro-habits, or settings panel changes

## Capabilities

### New Capabilities
None — this is a pure visual refresh, no new behavioral capability.

### Modified Capabilities
- `checklist-display`: Day tabs change from 7 static day names to date-based range starting yesterday. Progress display changes from SVG circle arc to horizontal bar. Per-day mini progress bars removed.
- `app-navigation`: Header replaces progress circle with horizontal bar, adds backdrop-blur, switches from sticky to fixed positioning. Bottom tabs replace SVG icons with Material Symbols.
- `animations`: Task toggle spring animation requirement REMOVED (native checkboxes use CSS-only transitions). Progress mount animation changes shape from circle fill to bar fill.

## Approach

Translate Stitch's Tailwind visuals to CSS Modules — zero new build dependencies. Merge MD3 surface tokens (surface-container, surface-bright, outline-variant, surface-variant) into existing `tokens.css` under `[data-theme]` attribute. Keep Goruti brand colors (Black, Cream, Lime, Gold) as semantic anchors. Each presentational component rewritten independently — Header, DayTabs, TaskItem, ProgressBar, BottomNav — preserving the container-presentational split. Day names stay as state keys; only the display layer changes.

## Affected Areas

| Area | Impact | Details |
|------|--------|---------|
| `src/styles/tokens.css` | Modified | +~15 MD3 surface tokens with dark/light values |
| `src/data/dates.ts` | **New** | `buildDayRange()` — handles month/year boundaries |
| `src/components/Header.tsx` + CSS | Rewrite | Fixed, backdrop-blur, progress bar, calendar icon |
| `src/components/DayTabs.tsx` + CSS | Rewrite | Date-based, uniform surface styling, no per-day colors |
| `src/components/TaskItem.tsx` + CSS | Rewrite | Native checkbox, `:checked + div` sibling checked label |
| `src/components/ProgressCircle.tsx` + CSS | Rewrite | Becomes horizontal `<div>`, no SVG |
| `src/components/BottomNav.tsx` + CSS | Modify | Material Symbols, bg + backdrop-blur, pill active |
| `src/app/layout.tsx`, `globals.css` | Modify | Material Symbols stylesheet import |
| `src/app/page.tsx`, `page.module.css` | Modify | Date-range props, padding-top for fixed header |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Fixed header breaks existing layout | Med | CSS custom property for header height + `calc()` on main padding |
| Checkbox migration breaks test selectors | Med | Update Vitest/Playwright selectors from div-based to `input[type="checkbox"]` |
| Backdrop-blur perf on old devices | Low | `@supports not (backdrop-filter: blur())` fallback to solid bg |
| Date calc edge cases (month/year boundaries) | Low | Test with `buildDayRange()` unit tests covering Dec→Jan, Jun→Jul |
| Material Symbols bundle bloat | Low | Import outlined variant only; CSS tree-shaking via entrypoint |

## Rollback Plan

1. `git checkout` each modified component file, `tokens.css`, and `globals.css`
2. Remove `src/data/dates.ts`
3. `npm uninstall material-symbols`
4. Components are independent — partial rollback is safe (e.g., keep Header but roll back TaskItem)

## Dependencies

- `npm install material-symbols` (outlined variant)
- No build tooling or config changes (no Tailwind, no PostCSS)

## Success Criteria

- [ ] All existing Vitest unit tests + Playwright E2E tests pass with zero modifications
- [ ] Header renders fixed at top with visible backdrop-blur, calendar icon, uppercase Spanish day name, and accurate progress bar
- [ ] Day tabs show 7 date-based entries starting from yesterday; selected tab gets surface-bright bg + outline-variant border
- [ ] Task checkboxes are native `<input type="checkbox">`, keyboard-focusable, show custom CSS checkmark on `:checked`
- [ ] Bottom nav renders Material Symbols icons with surface/80 backdrop-blur and pill-shaped active indicator
- [ ] Dark mode toggle switches all new surface tokens correctly; `[data-theme="dark"]` / `[data-theme="light"]` both render
- [ ] Framer Motion day-slide transitions animate correctly on day switch (AnimatePresence preserved)
