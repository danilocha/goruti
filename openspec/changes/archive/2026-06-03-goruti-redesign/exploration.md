# Exploration: Goruti Brand Redesign

## Current State

The app is a household checklist for two people with auth, currently using zero brand identity:

1. **No design tokens exist** — all colors are hardcoded per component (blues, grays, greens from default palette). No CSS custom properties for brand values, spacing, typography, or shadows.

2. **Header** — Dark gradient `#0F172A → #1E1B4B` (indigo/navy, not brand black), system font Georgia for heading, `Segoe UI` for body. Progress circle uses green `#22C55E`.

3. **Day tabs** — White background, per-day color palettes defined in `src/data/constants.ts` (`PAL` object with `border`, `header`, `light` per day). Uses default emoji indicator `🟢` for today.

4. **Task items** — White cards with left `--day-border` accent, hardcoded green checkbox `#22C55E`. Assignee badges use `WHO_STYLE` constants (blues/pinks/purples/greens).

5. **Progress circle** — SVG with green `#22C55E` arc, dark blue `#1E3A5F` track. Always green regardless of completion level.

6. **Micro-habits** — White card with green `#F0FDF4` background, green border, gray title.

7. **Auth pages** (`/login`, `/register`, `/error`) — Generic unstyled forms with inline styles, blue CTA buttons `#1D4ED8`.

8. **`globals.css`** — Only has reset + base styles. No brand tokens, no font imports.

9. **Typography** — `Segoe UI` + `Georgia` (serif heading in Header). No Google Fonts or `next/font` configured.

---

## Affected Areas

### Files to CREATE
| File | Purpose |
|------|---------|
| `src/styles/tokens.css` | All CSS custom properties (colors, typography, spacing, radii, shadows) |
| `src/styles/components/button.css` | Button variants (primary/Go Lime, secondary, ghost) |
| `src/styles/components/input.css` | Input field tokens for auth forms |
| `src/styles/components/badge.css` | Badge/assignee token variants |
| `src/styles/components/card.css` | Card surface tokens |
| `src/app/fonts.ts` | `next/font` configuration for Syne + DM Sans |

### Files to MODIFY
| File | Why |
|------|-----|
| `src/app/globals.css` | Add brand CSS custom properties import, font-family, body background |
| `src/app/layout.tsx` | Import fonts from `fonts.ts`, add font classes to `<html>` |
| `src/app/page.tsx` | Update page background, container styling |
| `src/app/page.module.css` | Replace `#F1F5F9` with `var(--color-cream)`, update font |
| `src/components/Header.tsx` | Update LEgends colors to brand palette (optional) |
| `src/components/Header.module.css` | Replace gradient with `var(--color-black)`, use Syne font, update legend colors |
| `src/components/DayTabs.tsx` | Remove emoji today indicator, use brand-colored active indicator |
| `src/components/DayTabs.module.css` | Replace `#fff` bg with `var(--color-cream)`, update tab styles |
| `src/components/TaskBlock.module.css` | Replace `#fff` card bg with `var(--color-cream)`, update border colors |
| `src/components/TaskItem.module.css` | Replace checkbox green `#22C55E` with `var(--color-lime)`, update colors |
| `src/components/ProgressCircle.tsx` | Accept color prop for stroke (lime vs gold) |
| `src/components/ProgressCircle.module.css` | Replace `#22C55E` with brand tokens, dynamic stroke |
| `src/components/MicroHabits.module.css` | Replace green shades with brand tokens |
| `src/app/login/page.tsx` | Replace inline styles with CSS module + brand tokens |
| `src/app/register/page.tsx` | Replace inline styles with CSS module + brand tokens |
| `src/app/error/page.tsx` | Replace inline styles with CSS module + brand tokens |
| `src/data/constants.ts` | Optionally update `PAL` day colors to be brand-harmonized, update `WHO_STYLE` |

### Files potentially created for auth
| File | Purpose |
|------|---------|
| `src/app/login/login.module.css` | CSS module for login page |
| `src/app/register/register.module.css` | CSS module for register page |
| `src/app/error/error.module.css` | CSS module for error page |

---

## Approaches

### Approach 1: Incremental — Design tokens first, components second

**Description**: Create the token system first, then update components one by one. No structural changes to component logic. Pure CSS/theming change.

- **Pros**:
  - Lowest risk — visual change only, no logic changed
  - Easy to review — each commit is a clear unit (tokens → header → tabs → items → auth)
  - Rollback is trivial — revert CSS changes
  - Works perfectly with existing CSS Modules architecture
  - `next/font` loading is non-breaking

- **Cons**:
  - Auth pages need restructuring from inline styles to CSS modules (additional setup)
  - Component props may need minor signature changes (e.g., ProgressCircle accepting stroke color)
  - Day color palettes (`PAL` in constants) may need brand harmonization discussion

- **Effort**: Medium (3–4 focused sessions)

### Approach 2: Full redesign — Rewrite all at once

**Description**: Replace all CSS and component styling in one pass. Rewrite auth pages to CSS modules simultaneously.

- **Pros**:
  - Single coherent visual result — no intermediate states
  - Faster overall if done in one session

- **Cons**:
  - HIGH risk — 10+ CSS modules + 3 new files + layout changes = large diff
  - Hard to review — too many changes at once
  - Cannot rollback partially
  - Breaks existing tests until all CSS is updated

- **Effort**: High (but same total work as incremental)

### Approach 3: Hybrid — Token foundation + component layers

**Description**:
Phase 1: Create `tokens.css` + `fonts.ts` + update `globals.css` + `layout.tsx`
Phase 2: Redesign Header + ProgressCircle (visible top-level change)
Phase 3: Redesign DayTabs + TaskBlock + TaskItem + MicroHabits
Phase 4: Redesign auth pages (login, register, error)

- **Pros**:
  - Phased delivery with working app after each phase
  - Each phase is reviewable (< 200 lines each)
  - Tests can be updated incrementally
  - Auth (Phase 4) is isolated and can be deferred

- **Cons**:
  - More coordination (4 PRs vs 1)
  - Slightly more overhead per phase

- **Effort**: Medium (same total, but spread across phases)

---

## Recommendation

**Approach 3: Hybrid — Token foundation + component layers.**

Rationale:
1. The design system (tokens + fonts) is the **foundation** everything else depends on — it MUST come first.
2. Components can then consume tokens incrementally, which is safer and easier to review.
3. Auth pages need structural changes (inline styles → CSS modules), which is a separate concern from brand styling — best handled as its own phase.
4. The 400-line review budget (per SDD protocol) strongly favors phased delivery.

### Proposed Phase Breakdown

| Phase | Scope | Est. Lines Changed | Risk |
|-------|-------|-------------------|------|
| **P0** | `tokens.css` + `fonts.ts` + `globals.css` + `layout.tsx` | ~150 | Low |
| **P1** | Header + ProgressCircle | ~120 | Low |
| **P2** | DayTabs + TaskBlock + TaskItem + MicroHabits | ~200 | Low |
| **P3** | Auth pages (login, register, error) — CSS modules + brand | ~180 | Low |

### Key Design Decisions to Make

1. **Day color palettes**: The current `PAL` colors (blue, purple, pink, amber, green, rose, indigo) were designed for variety. The brand palette is intentionally restrained (Black, Cream, Lime, Gold). **Recommendation**: Keep per-day color variety but shift hues to be brand-compatible — use Cream backgrounds, brand accent for the selected day, and muted brand tones for inactive days. The `--day-border` and `--day-header` custom properties should reference brand tokens.

2. **ProgressCircle stroke**: Currently always green. Brand says Go Lime for progress, Ruti Gold for streaks/achievements. **Recommendation**: Add a `variant` prop (`"progress" | "streak"`) that selects lime vs gold stroke. Default to lime.

3. **Assignee badges**: Current `WHO_STYLE` uses distinct colors per person. The brand palette doesn't define per-person colors. **Recommendation**: Keep distinct per-person colors but use brand-compatible tints (cream-based backgrounds with brand accent text). Document that these are UI-utility colors, not brand colors.

4. **Checkbox style**: Currently green `#22C55E` rounded square. **Recommendation**: Use Go Lime `#C4F135` for checked state, brand-accent rounded checkbox with custom SVG checkmark. This is the CTA element per brand rules.

5. **Today indicator**: Currently emoji `🟢`. **Recommendation**: Replace with a brand-styled indicator — small Go Lime dot or underline on the active tab.

6. **Light/Dark mode**: Brand defines both Black (dark) and Cream (light) as surfaces. The current app is light-only. **Recommendation**: Start with light mode (Cream background) as default, since the brand tile is "warm cream backgrounds instead of gray." Dark mode can be a future enhancement. The token system should define both sets of values for preparedness.

7. **Syne font loading via `next/font`**: Use `next/font/google` for Syne (weights 700, 800) and DM Sans (weights 300, 400, 500). Configure `display: "swap"` and subset `["latin"]`.

---

## Risks

1. **Font loading flash** — If `next/font` is not configured with `display: "swap"`, users may see a flash of unstyled text (FOUT). Mitigation: use `next/font` with proper `display` and `preload`.

2. **Day palette visual regression** — The current per-day colors provide visual variety. Removing them entirely may reduce scanability. Mitigation: keep per-day accent colors but harmonized to brand.

3. **Auth page restructure from inline styles** — Login/register pages use raw inline `style` props. Converting to CSS modules requires creating new `.module.css` files and updating imports. Low risk but needs attention.

4. **Test snapshots may break** — If any tests assert on CSS class names or visual structure (e.g., `page.module.css` selectors), they will need updating. Review `src/components/__tests__/` and `src/data/__tests__/` for affected tests.

5. **Go Lime overuse** — Brand rules explicitly state Go Lime should be "solo para el elemento más importante de la pantalla." Must ensure it's not used decoratively across too many elements. Specifically: only the primary CTA (login/signup button) and the progress circle stroke should use lime.

6. **`next/font` in Next.js 16** — The version is Next.js 16.2.7. Must consult `node_modules/next/dist/docs/` for any breaking changes in font loading API per the AGENTS.md instruction.

---

## Ready for Proposal
Yes — all areas have been investigated. The recommendation is Approach 3 (Hybrid/Phased). The proposal should define the 4 phases with delivery order and rollback strategy for each.
