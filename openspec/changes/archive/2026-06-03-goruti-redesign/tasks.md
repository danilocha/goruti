# Tasks: Goruti Brand Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650 (P0: 150, P1: 120, P2: 200, P3: 180) |
| 400-line budget risk | High (total exceeds standard guard) |
| Chained PRs recommended | No (budget set to 2000 lines per orchestrator) |
| Suggested split | Single PR — phases are sequential, each under 200 lines |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

---

## Phase 0: Foundation — Tokens & Fonts (P0, must ship first)

- [x] 0.1 Create `src/styles/tokens.css` — brand colors, typography, radii, spacing, shadows
- [x] 0.2 Create `src/app/fonts.ts` — Syne (700,800) + DM Sans (300,400,500) via `next/font/google`, variable axes, `display: "swap"`
- [x] 0.3 Modify `globals.css` — import tokens, body bg → `var(--bg-primary)`, font → `var(--font-body)`, hardcoded colors → tokens
- [x] 0.4 Modify `layout.tsx` — import font variables, apply `<body className={`${syne.variable} ${dmSans.variable}`}>`
- [x] 0.5 Modify `page.module.css` — `#F1F5F9` → `var(--color-cream)`, font → brand stack

## Phase 1: Header & ProgressCircle (P1)

- [x] 1.1 Modify `ProgressCircle.tsx` — add `variant?: "progress" | "streak"` prop, default `"progress"`
- [x] 1.2 Modify `ProgressCircle.module.css` — arc → `var(--color-lime)`, track → dark surface. Add `.streak` class with `var(--color-gold)`
- [x] 1.3 Modify `Header.module.css` — gradient → `var(--color-black)` bg, heading → `var(--font-syne)`, legend colors → brand-compatible
- [x] 1.4 Modify `Header.tsx` — update legend color map values to brand-compatible tones

## Phase 2: DayTabs, TaskBlock, TaskItem, MicroHabits & Constants (P2)

- [x] 2.1 Modify `DayTabs.tsx` — replaced emoji `🟢` with `<span className={styles.todayDot} />`
- [x] 2.2 Modify `DayTabs.module.css` — bg → `var(--color-cream)`, brand tabs, added `.todayDot` with `var(--color-lime)`
- [x] 2.3 Modify `TaskBlock.module.css` — card bg → `var(--bg-card)`, border → `var(--border-default)`, shadow → `var(--shadow-card)`
- [x] 2.4 Modify `TaskItem.module.css` — checkbox `#22C55E` → `var(--color-lime)`, accent colors, brand tokens throughout
- [x] 2.5 Modify `MicroHabits.module.css` — green shades → brand tokens, bg → `var(--bg-card)`, habit bg → `var(--color-cream)`, accent → `var(--color-lime)`
- [x] 2.6 Modify `src/data/constants.ts` — updated WHO_STYLE hex to brand-compatible warm tones, left PAL as-is (per orchestrator instruction)

## Phase 3: Auth Pages — Inline Styles → CSS Modules (P3)

- [x] 3.1 Create `src/app/login/login.module.css` — brand tokens, CTA with `var(--color-lime)`, branded inputs, card layout
- [x] 3.2 Modify `src/app/login/page.tsx` — replace all inline `style` props with CSS Module imports
- [x] 3.3 Create `src/app/register/register.module.css` — brand tokens, mirror login layout
- [x] 3.4 Modify `src/app/register/page.tsx` — replace inline styles with CSS Module imports
- [x] 3.5 Create `src/app/error/error.module.css` — brand tokens
- [x] 3.6 Modify `src/app/error/page.tsx` — replace inline styles with CSS Module imports

---

## Verification Tasks (run after each phase)

- [ ] V.1 Run `rg "#[0-9A-Fa-f]{6}" src/components/ src/app/` — confirm zero non-brand hex hits
- [ ] V.2 Run `npm run test` — confirm all existing tests pass per phase
- [ ] V.3 Visual review: Go Lime only on primary CTA + progress arc (brand rule)
