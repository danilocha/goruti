# Design: Goruti Brand Redesign

## Technical Approach

Four-phase hybrid rollout: **Tokens first, components second**. P0 establishes the design foundation (`tokens.css` + `fonts.ts`), then P1–P3 consume those tokens per component group. No component logic changes except ProgressCircle `variant` prop. Every phase leaves a working app.

---

## Architecture Decisions

### AD1: Token system — flat CSS custom properties file

| Option | Tradeoff | Decision |
|--------|----------|----------|
| CSS Modules per component + shared vars | Duplication across modules | ✗ |
| **Single `tokens.css`** with `:root` vars | Single import in `globals.css`, no build overhead | **✓** |
| Sass/SCSS variables | Adds preprocessor dep for marginal benefit | ✗ |

**Rationale**: The app has zero build-chain CSS preprocessing. A single `tokens.css` imported at the top of `globals.css` makes all brand tokens available globally via `var()`. Zero tooling changes.

### AD2: Font loading — `next/font/google` with variable weight range

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Google Fonts `<link>` tag | FOUT, no `next/font` optimizations | ✗ |
| **`next/font/google` variable axes** | Syne supports wght 700–800, DM Sans wght 300–500 via `variable: true` | **✓** |
| Individual weight arrays | Slightly more bytes; variable font is more performant | ✗ |

**Rationale**: Both Syne and DM Sans have variable axes for the weights we need. Variable font = single file, optimal loading, `display: "swap"` + `preload` eliminates FOUT.

### AD3: ProgressCircle — `variant` prop switching stroke color

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Two separate components | Duplication | ✗ |
| **Single component, `variant` prop** | Two CSS classes, stroke swaps via `var()` or class | **✓** |
| `color` prop passed from parent | Works but less type-safe | ✗ |

**Rationale**: One component, two visual states. The `variant` prop selects from `"progress" | "streak"` and maps to `var(--color-lime)` or `var(--color-gold)` for the arc stroke. The track also changes (dark surface for progress, muted for streak).

### AD4: Per-day colors — preserved but referenced from brand palette

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Remove per-day colors entirely | Loses visual scanability | ✗ |
| **Keep `PAL` but change hex values to brand-compatible tones** | Brand identity without losing day variety | **✓** |
| Reference brand tokens in PAL values | Cleaner but changes `types.ts` contract | ✗ |

**Rationale**: `PAL` already works via CSS custom properties `--day-border`, `--day-header`, `--day-light`. We update the hex values in `constants.ts` to brand-compatible hues (softened creams, warm borders) and keep the mechanic identical. No type changes needed.

### AD5: Go Lime constraint — enforced via CSS class scoping

**Choice**: Only `.primary` button class and `.arc` on progress variant use `var(--color-lime)`. Auth CTA is the single primary button. ProgressCircle is the single lime arc.

**Rationale**: CSS Modules naturally scope this — no way for a stray element to pick up lime unless it explicitly uses the class. Visual review is the final gate.

---

## Tokens Schema (`src/styles/tokens.css`)

```css
:root {
  /* Brand colors */
  --color-black: #0F0D0C;
  --color-cream: #F5F2EC;
  --color-lime: #C4F135;
  --color-gold: #E8C547;
  --color-surface-dark: #161412;
  --color-muted: #8A8580;
  --color-border-dark: #242220;
  --color-success: #3ECF8E;
  --color-warning: #E87B5B;
  --color-info: #5B8DEF;

  /* Semantic tokens */
  --bg-primary: var(--color-cream);
  --bg-card: #FFFFFF;
  --bg-header: var(--color-black);
  --text-primary: var(--color-black);
  --text-secondary: var(--color-muted);
  --text-on-dark: #FFFFFF;
  --border-default: #E2E8F0;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08);

  /* Typography */
  --font-display: "Syne", sans-serif;
  --font-body: "DM Sans", sans-serif;

  /* Radii & spacing */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-full: 999px;
}
```

---

## Font Configuration (`src/app/fonts.ts`)

```ts
import { Syne, DM_Sans } from "next/font/google";

export const syne = Syne({
  weight: ["700", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const dmSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
```

Applied in `layout.tsx` via `<body className={`${syne.variable} ${dmSans.variable}`}>`.

---

## Changed Interfaces

### ProgressCircle (`src/components/ProgressCircle.tsx`)

```ts
interface Props {
  progress: number;
  done: number;
  total: number;
  variant?: "progress" | "streak";  // NEW, defaults to "progress"
}
```

---

## File Changes by Phase

| Phase | File | Action |
|-------|------|--------|
| **P0** | `src/styles/tokens.css` | **Create** |
| **P0** | `src/app/fonts.ts` | **Create** |
| **P0** | `src/app/globals.css` | Modify — import tokens, brand body bg |
| **P0** | `src/app/layout.tsx` | Modify — font class on `<html>` |
| **P0** | `src/app/page.module.css` | Modify — `#F1F5F9` → `var(--color-cream)` |
| **P1** | `src/components/Header.module.css` | Modify — brand tokens |
| **P1** | `src/components/Header.tsx` | Modify — legend colors (brand-compatible) |
| **P1** | `src/components/ProgressCircle.tsx` | Modify — `variant` prop |
| **P1** | `src/components/ProgressCircle.module.css` | Modify — brand tokens |
| **P2** | `src/components/DayTabs.module.css` | Modify — brand tokens |
| **P2** | `src/components/DayTabs.tsx` | Modify — emoji → Go Lime dot indicator |
| **P2** | `src/components/TaskBlock.module.css` | Modify — brand tokens |
| **P2** | `src/components/TaskItem.module.css` | Modify — brand tokens |
| **P2** | `src/components/MicroHabits.module.css` | Modify — brand tokens |
| **P2** | `src/data/constants.ts` | Modify — `PAL` brand-harmonized hex |
| **P3** | `src/app/login/login.module.css` | **Create** |
| **P3** | `src/app/login/page.tsx` | Modify — inline → CSS Module |
| **P3** | `src/app/register/register.module.css` | **Create** |
| **P3** | `src/app/register/page.tsx` | Modify — inline → CSS Module |
| **P3** | `src/app/error/error.module.css` | **Create** |
| **P3** | `src/app/error/page.tsx` | Modify — inline → CSS Module |

---

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Emoji 🟢 removed in DayTabs | Low | Replace with Go Lime dot `<span>` + CSS border-bottom |
| Auth page visual diff | Low | Mirror existing layout exactly, only change = brand tokens |
| `rg` hex check fails after P0 | Med | Run after each phase, not just at end |
| Variable font unavailable | Low | Fallback to individual weight arrays |
