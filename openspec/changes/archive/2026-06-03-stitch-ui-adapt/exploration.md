## Exploration: Stitch Design UI Adaptation

### Current State

The Goruti app is a Next.js 16 (App Router) household chore checklist for two people. It uses:

- **CSS Modules + CSS Custom Properties** for styling (15 brand tokens, 12 semantic tokens)
- **Framer Motion** for animated day transitions and checkbox spring effects
- **useReducer + Context** for checklist state (persisted to localStorage)
- **ThemeProvider + `[data-theme="dark"]`** for dark mode toggle
- **SVG `<circle>`** for progress display (stroke-dasharray arc)
- **Custom div-based checkboxes** with Framer Motion spring animations
- **Emoji icons** for nav and task items
- **Horizontal day tabs** with 3-letter day abbreviations + mini progress bars
- **Slim sticky header** with subtitle, day name, and ProgressCircle
- **7 day-name tabs** (horizontal scroll) + block-grouped task items + micro-habits

The Stitch design reference (`openspec/references/stitch-design.html`) introduces a significantly overhauled UI built with Tailwind CSS.

---

### 1. Color System Migration

#### Current tokens (~15 brand + 12 semantic)
```
--color-black: #0F0D0C      --color-cream: #F5F2EC
--color-lime: #C4F135        --color-gold: #E8C547
--color-surface-dark: #161412
--color-muted: #8A8580       --color-border-dark: #242220
--bg-primary / --bg-card / --text-primary / --text-secondary / --text-on-dark
--border-default / --shadow-card
```
`[data-theme="dark"]` swaps bg/text/border. Light mode: cream bg, white cards, black text. Dark mode: black bg, dark surface cards, white text.

#### Stitch MD3 Palette (~40+ tokens)
The Stitch design uses Full Material Design 3 dark theme palette:
- `--md-sys-color-background: #141218` (near-black)
- `--md-sys-color-surface: #1D1B20` / `--md-sys-color-surface-container: #211F26` / `--md-sys-color-surface-container-high: #2B2930` / `--md-sys-color-surface-bright: #3B383E`
- `--md-sys-color-on-background: #E6E0E9` / `--md-sys-color-on-surface: #E6E0E9` / `--md-sys-color-on-surface-variant: #CAC4D0`
- `--md-sys-color-primary: #D0BCFF` / `--md-sys-color-primary-container: #C4F135` (Go Lime!)
- `--md-sys-color-secondary: #CCC2DC` / `--md-sys-color-outline: #938F99` / `--md-sys-color-outline-variant: #44474E`
- `--md-sys-color-surface-variant: #49454F` (for the assignee badge bg)

#### Options

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **Full MD3 adoption** | Matching Stitch exactly, richer surface hierarchy, professional | Loses brand identity if over-adopted, many unused tokens | High |
| **Selective merge** — adopt surface-container/bright/variant + outline tokens into existing system | Keeps brand colors (Black, Cream, Lime, Gold), adds needed surface depth | Hybrid system — not pure MD3 or pure brand | Medium |
| **Keep current + add needed tokens** — only add what the layout needs (backdrop-blur surfaces, outline-variant borders) | Minimal change, lowest risk | May not look polished enough, piecemeal approach | Low |

**Recommendation**: Selective merge. Keep Goruti brand colors (Black, Cream, Lime, Gold) as semantic anchors. Add MD3-inspired surface tokens: `--bg-surface-container`, `--bg-surface-container-high`, `--border-outline-variant`, `--bg-surface-variant`. The `primary-container` maps directly to `--color-lime (#C4F135)`. Keep the `[data-theme="dark"]` attribute; add equivalent light-mode values for the new tokens.

---

### 2. Layout Changes

#### Header
| Current | Stitch |
|---------|--------|
| Solid `--color-black` bg, `position: sticky` | Fixed top, `bg-background/90 backdrop-blur-md` |
| Subtitle "Rutina de Hogar" + day name h1 | Calendar icon + uppercase day name (e.g. "DOMINGO") |
| SVG ProgressCircle (52x52) with lime arc | Horizontal progress bar (w-16 h-1, 16px wide, 4px tall) |
| No blur effect | `backdrop-blur-md` shows content behind subtly |

**Changes needed**:
- Replace solid header bg with `background/90 + backdrop-blur-md`
- Add calendar icon (Material Symbols `calendar_today`)
- Remove subtitle, keep uppercase day name
- Replace ProgressCircle with horizontal progress bar
- Change from `position: sticky` to `position: fixed` (Stitch top bar is fixed)

**Risk**: Changing from sticky to fixed means the main content needs `padding-top` to clear the header. The Stitch header is also **taller** (mobile: `px-margin-mobile py-sm` = 16px horizontal, ~8px vertical vs current 12+18px).

#### Day Selector
| Current | Stitch |
|---------|--------|
| 7 day name tabs: "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom" | 6 date-based buttons: "VIE 29", "SAB 30", "DOM 1", "LUN 2", "MAR 3", "MIE 4" |
| Selected tab: bottom border in day color | Selected: `bg-surface-bright border border-outline-variant shadow-sm`, day name in `text-primary-container` |
| Mini progress bar under each tab | No progress indicator per day |

**Changes needed**:
- Replace static day names with **date calculation**: current date + offset to show 5-7 days starting from today (or yesterday)
- Show day abbreviation (3-letter Spanish) ABOVE date number
- Selected day gets a surface-bright background with outline border (instead of just bottom border)
- Remove per-day mini progress bars from tabs
- Add horizontal scroll with `hide-scrollbar`

**Date calculation**: Need a helper that takes today's date, subtracts 1 (to show yesterday), and generates 6 buttons with `.toLocaleDateString('es-ES', { weekday: 'short' })` and `.getDate()`. The Stitch shows Jun 29–Jul 4 (today is ~Jul 1), starting from yesterday.

#### Progress Bar
| Current | Stitch |
|---------|--------|
| SVG ProgressCircle (lime arc on dark track) in header | Tiny horizontal bar: `w-16 h-1 bg-surface-container-high`, fill `bg-primary-container` |
| Percentage label inside circle | Percentage label above bar: `font-label-md text-label-md text-secondary` |

**Changes needed**: Replace `ProgressCircle.tsx` with a simple `<div>` bar. The bar is purely presentational — the percentage value is already in the reducer. Can keep the component interface but change render output. Much simpler DOM, no SVG math.

#### Bottom Nav
| Current | Stitch |
|---------|--------|
| 3 SVG icons (house, chart bars, gear) + labels | 3 Material Symbols (`home_app_logo`, `analytics`, `settings`) |
| Black background, lime active tab, top accent bar | `bg-surface/80 backdrop-blur-md rounded-t-xl` |
| Both mobile (fixed bottom) and desktop (inline) | Mobile-only (`md:hidden`), lighter surface blur |
| Active: SVG color changes to lime | Active: `bg-secondary-container/10 text-secondary rounded-full p-2` |

**Changes needed**:
- Replace SVG icons with Material Symbols Outlined
- Change bg from solid to surface + backdrop-blur
- Add rounded top corners
- Active tab gets a filled pill background instead of accent bar

---

### 3. Day Selector Redesign (Detailed)

The Stitch day selector is fundamentally different from the current DayTabs.

**Current DayTabs**:
- 7 hardcoded static Spanish day names
- Per-day mini progress bars
- Selection: bottom border in day color
- Data model: `DAYS` constant array from `constants.ts`

**Stitch day selector**:
- Calendar-date-based: shows actual dates
- 6 buttons visible at a time (not 7)
- Current day highlighted with `bg-surface-bright border-outline-variant`
- Day abbreviation + date number stacked vertically
- All styled in surface-container colors, no per-day theming

**Implementation requirements**:
1. New utility function in `src/data/utils.ts` (or a new file like `src/data/dates.ts`): `buildDayRange()` that returns `{ label: string; date: number; dayAbbr: string; fullDate: Date }[]`
2. Drop the per-day color palette dependency for tabs — Stitch uses uniform surface colors
3. Update `page.tsx` to pass this new data instead of `dayProgressMap` and `DAYS`
4. Selected day tracking still uses the day name string (for compatibility with reducer/state)

**Trade-off**: The current app uses Spanish day names as keys for state (`state["Lunes"]`, `state["Martes"]`, etc.). If we switch to date-based keys, we'd need to migrate the reducer/state model. **Recommendation**: Keep day names as state keys — display them in the new date-based format but map selection back to day names for state operations.

---

### 4. Checkbox Migration

| Aspect | Current (div-based) | Stitch (native input) |
|--------|-------------------|---------------------|
| Element | `<motion.div>` with `whileTap` + spring | `<input type="checkbox" class="task-checkbox">` |
| Styling | CSS border + bg + checkmark span | `appearance-none w-6 h-6 rounded border border-outline bg-transparent` |
| Checked state | `border-color: lime`, `bg: lime`, shadow | `checked:bg-primary-container checked:border-primary-container` |
| Accessibility | `role="button"`, `tabIndex`, `onKeyDown` for Enter/Space | Native keyboard + screen reader support |
| Checked label effect | Text: `color-muted`, `line-through`, opacity | Checked task row: sibling `<div>` gets `color: surface-variant`, `line-through`, `opacity: 0.5` |
| Animation | Framer Motion spring (scale: [1, 1.2, 1]) | CSS transition only (`transition-colors`) |

**Pros of native checkbox**:
- Built-in accessibility: keyboard navigation, screen reader announcements
- Simpler markup (no role/aria/tabIndex boilerplate)
- Works with CSS-only checked state via `:checked + div` sibling selector
- Lighter: no JS animation overhead per checkbox

**Cons of native checkbox**:
- No spring animation (but CSS `transition-colors` is sufficient)
- `appearance-none` removes all native styling — must rebuild with CSS
- Some CSS `+ sibling` selectors needed for the checked label effect

**Recommendation**: Migrate to native `<input type="checkbox">`. The Stitch design uses CSS-only transitions (no Framer Motion on checkboxes). This removes the per-checkbox Framer Motion overhead and improves a11y. The `appearance-none` + custom CSS rebuild gives full styling control. Keep Framer Motion for page-level transitions (day slides) and the header progress bar.

---

### 5. Tailwind Evaluation

The app currently has **zero Tailwind dependencies** — no `tailwind.config`, no `postcss.config`, no `@tailwindcss` packages. The Stitch design is built with Tailwind v3 (via CDN).

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A) No Tailwind — translate to CSS Modules** | 0 new deps, consistent with existing code, no learning curve, faster build | Manual translation of every Tailwind class, potential for mismatch | High (translation) |
| **B) Adopt Tailwind alongside CSS Modules** | Direct use of Stitch classes, can gradually migrate, industry standard | Adds deps (tailwindcss, postcss, autoprefixer), dual systems in codebase | Medium |
| **C) Full migration to Tailwind** | Unified system, Stitch classes work as-is, modern approach | Massive refactor of all CSS Modules, breaking changes | Very High |

**Trade-off analysis for Option B**:
- Installation: `npm install -D tailwindcss @tailwindcss/postcss postcss` and create `tailwind.config.ts` and `postcss.config.mjs`
- Existing CSS Modules remain untouched
- New components (or redesigned ones) use Tailwind utility classes
- Risk: CSS Custom Properties need to be both in Tailwind config `theme.extend` AND in CSS Modules — maintenance burden of keeping in sync
- The Stitch design uses custom Tailwind theme tokens (`colors.primary-container`, `colors.surface-variant`, spacing tokens like `margin-mobile`, `px-margin-mobile`) — these need to be defined in `tailwind.config.ts`

**Recommendation**: Option A — **translate the Stitch design to CSS Modules**. We already have a mature CSS Modules setup with CSS Custom Properties. Adding Tailwind for a single UI refresh introduces a parallel styling system with no clear migration path. The tokens can be defined as CSS Custom Properties in `tokens.css` and consumed by CSS Modules. The effort is higher upfront but avoids technical debt of dual systems.

If the project later decides to migrate to Tailwind fully, that's a separate architectural change.

---

### 6. Icons

| Current | Stitch |
|---------|--------|
| Emoji for nav (🏠📊⚙️ rendered as SVG in BottomNav) and tasks | Material Symbols Outlined for nav (`home_app_logo`, `analytics`, `settings`) |
| Emoji for task icons (🛏️🧹🍳 etc.) | Same emoji for task icons |
| No icon library dependency | Material Symbols from Google Fonts CDN |

**Options for adding Material Symbols**:

1. **Google Fonts CSS** — add `<link>` in `layout.tsx`:
   ```html
   <link rel="stylesheet"
     href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
   ```
   - Pros: zero install, CDN cached, matches Stitch exactly
   - Cons: requires network, adds FOUT potential
   - Effort: Trivial (add link + replace SVG/emoji in BottomNav)

2. **npm package** (`material-symbols`):
   ```bash
   npm install material-symbols
   ```
   Then `import "material-symbols"` in globals.css or layout.
   - Pros: bundled, offline, no network dependency
   - Cons: adds ~200KB to bundle (can tree-shake with CSS)
   - Effort: Low

**Recommendation**: npm package `material-symbols` for offline support. Import the `outlined` variant stylesheet. Replace `TabIcon` in BottomNav with `<span class="material-symbols-outlined">icon_name</span>`. Add the calendar icon to the header. Keep emoji for task items (they're content, not UI chrome).

---

### 7. What to Keep from Current App

| Component/File | Action | Reason |
|---|---|---|
| **Framer Motion** | Keep | Page-level day slide transitions, reduced-motion support |
| **ThemeProvider (`useTheme.tsx`)** | Keep | Theme toggling logic works — just add new CSS tokens |
| **useChecklist hook** | Keep | State logic (reducer, derived state, day selection) is unchanged |
| **reducer.ts** | Keep | Pure function, data layer unchanged |
| **constants.ts** | Keep (update PAL tuple) | `DAYS`, `WHO_STYLE`, `STORAGE_KEY` still needed. `PAL`/`PAL_DARK` can be simplified since Stitch doesn't use per-day colors for tabs |
| **tasks.ts** | Keep | Task data and `buildTasks()` logic unchanged |
| **types.ts** | Keep | `Task`, `Person`, `DayName`, `CheckState`, `ChecklistAction` unchanged |
| **utils.ts** | Keep | `resolvePersonStyle`, `getProgress`, `groupByBlock` still needed |
| **useAuth.tsx** | Keep | Auth flow unchanged (Supabase) |
| **useMicroHabits.ts** | Keep | Micro-habits logic unchanged |
| **Providers / ChecklistContext** | Keep | Context structure unchanged |
| **SettingsPanel** | Keep | Settings content unchanged (may need visual refresh to match new theme) |
| **Dark mode toggle** | Keep | Works via `ThemeProvider` — add new dark tokens |
| **Container-presentational pattern** | Keep | Works well; page.tsx orchestrates, presentational components render |

---

### 8. What to Replace

| File | Current | Stitch Equivalent | Effort |
|------|---------|-------------------|--------|
| **Header.tsx** | Slim header with subtitle + ProgressCircle | Fixed top app bar with calendar icon, day name, progress bar | Medium |
| **Header.module.css** | Solid black bg, sticky | backdrop-blur, fixed, different layout | Medium |
| **DayTabs.tsx** | 7 day names + mini progress | Date-based buttons with day-abbr + date number | Medium |
| **DayTabs.module.css** | Tab styles + progress track | New styles: surface-container, outline-variant border | Medium |
| **ProgressCircle.tsx + .module.css** | SVG circle with stroke-dasharray | Horizontal `<div>` bar (16px wide, 4px tall) | Low |
| **TaskItem.tsx** | Custom div checkbox + Framer Motion | Native `<input type="checkbox">` with CSS checkmark | Medium |
| **TaskItem.module.css** | Custom checkbox styles | appearance-none + custom checkmark pseudo-element | Medium |
| **BottomNav.tsx** | SVG icons in `TabIcon` | Material Symbols Outlined | Low |
| **BottomNav.module.css** | Solid black bg, lime accent top bar | surface/80 + backdrop-blur, rounded top, pill active | Medium |
| **tokens.css** | 15 brand + 12 semantic tokens | Add ~10-15 new surface/container/outline tokens | Medium |
| **page.module.css** | Cream bg, padding | Adjust padding for fixed header | Low |
| **page.tsx** | Passes dayProgressMap to DayTabs | Pass new date-range data, no dayProgressMap for tabs | Low |

---

### 9. File Inventory — Proposed Changes

```
src/
├── styles/
│   └── tokens.css              ← ADD ~15 new MD3-inspired tokens
├── data/
│   ├── dates.ts                 ← NEW: buildDayRange() utility
│   ├── types.ts                 ← unchanged
│   ├── constants.ts             ← update: simplify PAL/PAL_DARK (keep WHO_STYLE, DAYS)
│   ├── tasks.ts                 ← unchanged
│   ├── utils.ts                 ← unchanged
│   └── reducer.ts               ← unchanged
├── hooks/
│   ├── useChecklist.ts          ← unchanged
│   ├── useTheme.tsx             ← unchanged
│   ├── useAuth.tsx              ← unchanged
│   └── useMicroHabits.ts        ← unchanged
├── components/
│   ├── Header.tsx               ← REWRITE: app bar with blur, progress bar, calendar icon
│   ├── Header.module.css        ← REWRITE
│   ├── DayTabs.tsx              ← REWRITE: date-based day selector
│   ├── DayTabs.module.css       ← REWRITE
│   ├── TaskItem.tsx             ← REWRITE: native checkbox, CSS checkmark
│   ├── TaskItem.module.css      ← REWRITE
│   ├── BottomNav.tsx            ← MODIFY: replace SVG with Material Symbols
│   ├── BottomNav.module.css     ← MODIFY: new bg/blur/active
│   ├── ProgressCircle.tsx       ← REWRITE: horizontal bar
│   ├── ProgressCircle.module.css ← REWRITE
│   ├── TaskBlock.tsx            ← unchanged (or minor visual tweak)
│   ├── TaskBlock.module.css     ← maybe update card bg token
│   ├── MicroHabits.tsx          ← unchanged
│   └── MicroHabits.module.css   ← maybe update chip bg token
├── app/
│   ├── layout.tsx               ← ADD: Material Symbols font links
│   ├── globals.css              ← ADD: Material Symbols import, new token import
│   ├── page.tsx                 ← MODIFY: pass new props to DayTabs
│   └── page.module.css          ← MODIFY: padding for fixed header
└── lib/                         ← unchanged
```

---

### 10. Approach Comparison

| Approach | Description | Effort | Risk | A11y Impact | Codebase Cohesion |
|----------|-------------|--------|------|-------------|-------------------|
| **Full Stitch port** | Adopt all changes (MD3 palette, Tailwind, native checkboxes, Material Symbols, date-based days) | Very High | Medium — many moving parts | ✅ Native checkboxes, Material Symbols are accessible | ❌ Dual styling systems (if Tailwind added) |
| **Selective UI refresh** | Keep CSS Modules + current tokens + current state model. Translate Stitch layout visually: new header, date-based days, progress bar, native checkboxes, Material Symbols | Medium | Low — incremental, no state model changes | ✅ Native checkboxes | ✅ CSS Modules throughout |
| **Minimal lift** | Only adopt header blur + progress bar. Keep day tabs, checkboxes, icons as-is | Low | Very Low | No change | ✅ Perfect |

**Recommendation**: **Selective UI refresh**. Implement the visual improvements that make the biggest impact without introducing architectural debt:
1. ✅ New header with backdrop-blur + progress bar
2. ✅ Date-based day selector (with date utility)
3. ✅ Native checkboxes (better a11y, simpler CSS)
4. ✅ Material Symbols for nav
5. ✅ Add MD3-inspired surface tokens to existing system
6. ❌ Skip Tailwind — translate to CSS Modules
7. ✅ Keep Framer Motion for page transitions only

---

### Risks

1. **Header `position: fixed` vs `sticky`** — Fixed header takes content out of flow. All pages need `padding-top` to clear the header height. The header is responsive (mobile vs desktop padding), so the padding value needs to match. Use CSS Custom Property or CSS `calc()` with the header height.

2. **Date-based day selector UX** — Current app shows all 7 days. Stitch shows 6 dates starting from yesterday. Users who want to plan ahead (e.g., check tasks for Wednesday on Monday) still can scroll to the right. But this changes mental model from "day of week" to "calendar date." Consider the couple's actual usage: do they plan ahead or only check today?

3. **Date calculation edge cases** — Month boundaries (Jun 30 → Jul 1), year boundaries (Dec 31 → Jan 1). The `buildDayRange()` utility must handle this correctly. Also, the app doesn't currently care about dates — only day names. If session data persists across months, the day-name-to-date mapping changes.

4. **State key compatibility** — The reducer uses day names as keys (`state["Lunes"]`). If we switch to date-based keys (`state["2026-07-01"]`), hydration breaks. **Mitigation**: Keep day names as state keys; only change the display layer.

5. **Backdrop-blur performance on low-end devices** — `backdrop-filter: blur()` can be GPU-intensive. Test on older phones. Consider using `@supports not (backdrop-filter: blur())` fallback to solid background.

6. **Material Symbols bundle size** — The `material-symbols` npm package is large. Import only the `outlined` variant, or use the CDN approach for zero-bundle cost.

7. **Checkbox migration breaks tests** — Current tests may reference div-based checkboxes. Update test selectors to target native `<input type="checkbox">`.

---

### Ready for Proposal

Yes. The exploration is complete with clear recommendations. The proposed change is a **Selective UI Refresh** — medium effort, low risk, preserves all existing data layer and state management. The orchestrator should proceed to **sdd-propose** with the recommendation.

**Key next step**: Before proposing, the user should confirm:
1. Do they want date-based day tabs or keep the current 7-day-name approach?
2. Date calculation starting from yesterday (Stitch default) or from today?
3. Day selector showing 6 days (Stitch) or 7 (current)?
