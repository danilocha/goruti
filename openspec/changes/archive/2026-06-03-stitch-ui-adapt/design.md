# Design: Stitch UI Adaptation

## Technical Approach

Selective visual refresh — translate Stitch's Tailwind+MD3 layout to CSS Modules while keeping Goruti's data layer untouched. Rewrite 5 components (Header, DayTabs, TaskItem, ProgressBar, BottomNav), merge ~9 MD3 surface tokens into the existing brand system, use Material Symbols for nav icons. Day names remain state keys — only the display layer changes.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Color system | Selective MD3 merge — add surface-container, surface-bright, outline-variant, surface-variant | Full MD3 (loses brand identity), keep current (not polished enough) | Keeps Goruti brand (Black, Cream, Lime, Gold) as semantic anchors |
| Styling | CSS Modules — translate Tailwind utilities manually | Adopt Tailwind (dual system), full migration (massive refactor) | Zero new deps, consistent with existing codebase |
| State keys | Keep day names (`Lunes`, `Martes`...) | Date-based keys (`2026-07-01`) require reducer migration | Only display layer changes; localStorage untouched |
| Checkbox | Native `<input type="checkbox">` + CSS-only transitions | Framer Motion spring divs | Better a11y, no JS per-item, simpler markup |
| Progress display | Horizontal `<div>` bar | SVG circle (current) | Simpler DOM, no circumference math, matches Stitch |
| Icons | `material-symbols` npm (outlined) | Google Fonts CDN | Offline, bundled, tree-shakeable |
| Header positioning | `position: fixed` | `position: sticky` (current) | Matches Stitch; use `--header-height` custom property |
| Day range | 7 days starting yesterday | 6 (Stitch), 7 from today (current) | Parity with current 7-tab model |

## Token Schema Additions

Add to `:root` in `tokens.css`:

```css
--header-height: 56px;
--bg-surface: rgba(255,255,255,0.8);
--bg-surface-container: #FFFFFF;
--bg-surface-container-high: #F5F2EC;
--bg-surface-bright: #FFFFFF;
--bg-surface-variant: #E8E4DD;
--border-outline: #D4D0CC;
--border-outline-variant: #E2E0DC;
--text-on-surface-variant: #6B6662;
```

`[data-theme="dark"]` overrides:

```css
--bg-surface: rgba(29,27,32,0.8);
--bg-surface-container: #211F26;
--bg-surface-container-high: #2B2930;
--bg-surface-bright: #3B383E;
--bg-surface-variant: #49454F;
--border-outline: #938F99;
--border-outline-variant: #44474E;
--text-on-surface-variant: #CAC4D0;
```

## Component Blueprints

### Header
- **Props**: `dayName`, `progress`, `done`, `total` — identical interface
- **Render**: `<header fixed top>` → calendar icon (`<span class="material-symbols-outlined">calendar_today</span>`) + `<h1>{dayName.toUpperCase()}</h1>` | percentage + horizontal progress bar
- **No more** `ProgressCircle` import, no subtitle
- **CSS**: `backdrop-filter: blur(12px)`, `position: fixed`, padding with safe-area

### DayTabs
- **Props**: `days: DayItem[]`, `selectedDay: string`, `onSelect: (day: string) => void`
- **New type**: `DayItem = { dayName: string; dayAbbr: string; dateNumber: number }`
- **Render**: horizontal scroll (`hide-scrollbar`), each button = `dayAbbr` (label-sm) stacked over `dateNumber` (title-md). Selected: `bg-surface-bright border border-outline-variant`
- **No more** `dayProgressMap` prop, no `PAL`/`PAL_DARK`, no per-day mini bars

### TaskItem
- **Props**: identical (`task`, `checked`, `onToggle`)
- **Render**: `<label>` wrapping `<input type="checkbox" className={styles.checkbox}>` + content `<div>`. Checked label uses `input:checked + div` sibling selector for opacity 0.5 + line-through
- **No more** `<motion.div>`, `role="button"`, `tabIndex`, `onKeyDown` — native checkbox handles all a11y
- **CSS**: `appearance: none`, custom `::after` checkmark pseudo-element, `transition-colors`

### ProgressBar (replaces ProgressCircle)
- **Props**: `progress`, `done`, `total` — same interface
- **Render**: `<span>{progress}%</span>` above a 64×4px bar track `<div>` with a fill child `<div>` at `width: progress%`
- **No more** SVG, `motion.circle`, `RADIUS`/`CIRCUMFERENCE` constants
- **CSS**: Track `bg-surface-container-high`, fill `bg-primary-container` (= `var(--color-lime)`)

### BottomNav
- **Props**: identical (`activeTab`, `onTabChange`)
- **Render**: Replace `TabIcon` SVG switch with `<span className="material-symbols-outlined">{icon}</span>`. Icons: `home_app_logo` / `analytics` / `settings`
- **CSS**: `bg-surface/80 backdrop-blur-md rounded-t-xl`. Active tab: `bg-surface-variant rounded-full`. Desktop variant unchanged

## Data Flow

```
page.tsx (orchestrator)
  ├── useChecklistContext() → selectedDay, todayName, blocks, progress, done, total, toggleTask
  ├── buildDayRange() → DayItem[]                          ← NEW: dates.ts
  ├── Header(dayName={selectedDay}, progress, done, total) ← uses todayName, no PAL
  ├── DayTabs(days={DayItem[]}, selectedDay, onSelect)     ← no dayProgressMap
  ├── AnimatePresence → TaskBlock[] → TaskItem(task, checked, onToggle)
  └── BottomNav(activeTab, onTabChange)
```

`buildDayRange()` maps date positions to day names via `.toLocaleDateString('es-ES', { weekday: 'long' })` — state keys (`selectedDay`) remain `"Lunes"`–`"Domingo"`.

## Date Calculation (`src/data/dates.ts`)

```typescript
export interface DayItem {
  dayName: string;  // "Lunes" (long form — matches state key)
  dayAbbr: string;  // "LUN" (uppercase 3-letter)
  dateNumber: number; // 1..31
}

export function buildDayRange(): DayItem[] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      dayName: d.toLocaleDateString("es-ES", { weekday: "long" }),
      dayAbbr: d.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 3).toUpperCase(),
      dateNumber: d.getDate(),
    };
  });
}
```

Native `Date` handles month/year boundaries automatically. Unit test edge cases: Dec→Jan, Jun→Jul, Feb 28→Mar 1 (leap year).

## Material Symbols Integration

```bash
npm install material-symbols
```

In `layout.tsx`: `import "material-symbols/outlined"`. Usage: `<span className="material-symbols-outlined">icon_name</span>`. Three nav icons: `home_app_logo`, `analytics`, `settings`. Header calendar icon: `calendar_today`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/data/dates.ts` | **Create** | `buildDayRange()` — 7 DayItem entries from yesterday |
| `src/styles/tokens.css` | Modify | +9 MD3 surface tokens + `--header-height` + dark overrides |
| `src/components/Header.tsx` | Rewrite | Fixed app bar, calendar icon, uppercase day, progress bar |
| `src/components/Header.module.css` | Rewrite | backdrop-blur, fixed, safe-area padding |
| `src/components/DayTabs.tsx` | Rewrite | Date-based tabs, uniform surface styling |
| `src/components/DayTabs.module.css` | Rewrite | surface-container bg, hide-scrollbar |
| `src/components/TaskItem.tsx` | Rewrite | Native checkbox, CSS checkmark |
| `src/components/TaskItem.module.css` | Rewrite | `appearance: none` + `::after` checkmark |
| `src/components/ProgressCircle.tsx` | Rewrite | Horizontal bar (file rename not needed) |
| `src/components/ProgressCircle.module.css` | Rewrite | Track + fill, no SVG |
| `src/components/BottomNav.tsx` | Modify | Replace SVG switch with Material Symbols |
| `src/components/BottomNav.module.css` | Modify | surface/80 + backdrop-blur + pill active |
| `src/app/page.tsx` | Modify | Pass `DayItem[]` to DayTabs, remove `dayProgressMap` |
| `src/app/page.module.css` | Modify | `padding-top: var(--header-height)` for fixed header |
| `src/app/layout.tsx` | Modify | `import "material-symbols/outlined"` |
| `src/data/constants.ts` | Minor | PAL/PAL_DARK unused by rewritten components (can remove later) |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `buildDayRange()` | Vitest — length=7, correct format, month/year boundaries, leap year |
| Unit | TaskItem render | Vitest — native `<input type="checkbox">` exists, `:checked` CSS class applied |
| Unit | Header render | Vitest — calendar icon span present, uppercase day displayed |
| Unit | DayTabs render | Vitest — N buttons = 7, selected has `.active` class |
| E2E | Full task flow | Playwright — update selectors from `[role="button"]` to `input[type="checkbox"]` |

## Migration / Rollout

No data migration — state keys unchanged. Components are independent; partial rollback safe per component. If `backdrop-filter` unsupported, `@supports not (backdrop-filter: blur())` fallback to solid `bg-surface`.
