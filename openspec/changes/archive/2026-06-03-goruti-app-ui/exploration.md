# Exploration: Goruti App UI — Modern "App-like" Redesign

## Current State

The Goruti app (couple-life) has undergone a brand redesign (Goruti identity: Black, Cream, Lime, Gold + Syne/DM Sans fonts), but the layout remains a traditional **web page** — not an **app-like** experience.

### How the System Works Today

**Layout (single page, scrollable):**
```
┌─────────────────────────────────┐
│         HEADER (black)          │  ← Day name, legend badges, user email,
│   Rutina de Hogar   ┌────────┐ │     sign-out button, ProgressCircle
│   Lunes             │  45%   │ │     ALL crammed into one bar
│   D A Rot D+A       └────────┘ │
├─────────────────────────────────┤
│  LUN  MAR  MIÉ  JUE  VIE  SÁB  │  ← DayTabs: horizontal scroll, mini bars
├─────────────────────────────────┤
│ ▼ MAÑANA                  [6]  │  ← TaskBlock: left accent border, collapsible
│ ┌─────────────────────────┐   │
│ │ ☐  6:00  ⏰ Levantarse  D │   │  ← TaskItem: checkbox → time → icon+name → badge
│ │ ☑  6:10  🍳 Desayuno    D │   │
│ └─────────────────────────┘   │
│ ▼ TRABAJO                [1]  │  ← Another TaskBlock (noCheck tasks)
│ ▼ MEDIODÍA               [3]  │
│ ▼ NOCHE                  [4]  │
│ ┌─────────────────────────┐   │
│ │ ✨ Micro-hábitos         │   │  ← MicroHabits: static 2-col grid
│ │ 🚿 Secar baño  🍽️ Loza  │   │
│ └─────────────────────────┘   │
└─────────────────────────────────┘
```

**Component structure:**
- **Header.tsx** — Black background bar. Top row: subtitle + day name (left), email + sign-out + ProgressCircle (right). Bottom: 4 legend badges.
- **DayTabs.tsx** — Horizontal scrollable `<nav>` with 7 buttons, selected tab gets day-color border + label color. Mini progress bar per tab.
- **TaskBlock.tsx** — Section wrapper with collapsible toggle, left border accent via `--day-border` CSS custom property. Contains TaskItem list.
- **TaskItem.tsx** — Row: checkbox/icon → time → icon+task+optional note → person badge. NoCheck tasks display informational.
- **MicroHabits.tsx** — Static 2-column grid, 6 habits, green border, non-interactive.
- **ProgressCircle.tsx** — SVG circle using `stroke-dasharray`. Transition on `stroke-dashoffset` (0.4s).

**Auth pages:** Centered card on cream background. Minimal — brand name, tagline, email/password form, link to other page.

**State management:** `useReducer` + Context. localStorage persistence via `useLocalStorage`. No animations library, no gesture handling, no routing beyond Next.js page routes.

**Key technical details:**
- Next.js 16 App Router, TypeScript, CSS Modules + CSS Custom Properties
- Supabase Auth (middleware redirects unauthenticated users to `/login`)
- 6 UI components, all presentational, state lifted to Providers
- No tailwind, no animation library, no gesture library
- Dynamic day palette: each day has border/header/light colors
- Brand tokens in `src/styles/tokens.css`

### What Makes It Feel Like a "Web Page" vs "App"

| Aspect | Current (Web Page) | Desired (App-like) |
|--------|-------------------|-------------------|
| Navigation | Scroll to top to change day | Fixed bottom nav / swipeable views |
| Header | Takes ~180px with ALL info | Minimal, contextual, or collapsible |
| Day switching | Click tab → instant rerender | Animated slide transition |
| Task toggling | Instant checkmark, no feedback | Bounce/scale animation, haptic-like feedback |
| Task items | Flat row in bordered card | Elevated cards, richer visuals |
| Micro-habits | Static grid, no interaction | Tappable chips with visual state |
| FAB | No FAB | Floating Action Button for quick add |
| Bottom sheet | No bottom sheet | Task details expand from bottom |
| Animations | 0.15s–0.4s CSS transitions only | Spring animations, layout transitions |
| Progress view | Per-day circle only | Weekly overview, streaks, charts |
| Dark mode | Not supported | Toggle + system preference detection |
| Mobile feel | Browser chrome visible, no safe areas | PWA-like, full-bleed, safe areas |

---

## Affected Areas

| File | Why It's Affected |
|------|------------------|
| `src/app/layout.tsx` | Will need viewport meta, theme class injection, safe area handling |
| `src/app/globals.css` | Will need dark mode variables, safe area env(), scroll behavior, animations |
| `src/app/page.module.css` | Complete layout restructure — from scroll page to app shell |
| `src/app/page.tsx` | Top-level orchestration changes — new layout shell, navigation slots |
| `src/components/Header.tsx` + CSS | Major redesign — slim header or replace with floating mini-header/bottom nav |
| `src/components/DayTabs.tsx` + CSS | Redesign as carousel/swipeable tabs or integrate into a fixed nav bar |
| `src/components/TaskBlock.tsx` + CSS | Redesign card style, add animations, drag-to-reorder consideration |
| `src/components/TaskItem.tsx` + CSS | Add toggle animation, richer card elevation, bottom sheet interactions |
| `src/components/MicroHabits.tsx` + CSS | Make interactive (tappable chips with state), redesign grid |
| `src/components/ProgressCircle.tsx` + CSS | Add mount animation, consider extracting to shared animation hook |
| `src/app/login/page.tsx` + CSS | Add welcome/splash aesthetic, animated form transitions |
| `src/app/register/page.tsx` + CSS | Same as login — visual parity |
| `src/styles/tokens.css` | Add dark mode color tokens, animation timing tokens |
| `src/data/types.ts` | May need new types for theme/preferences (if done in data layer) |
| `src/data/constants.ts` | May add dark mode palette constants |
| `src/app/providers.tsx` | May need ThemeContext, animation preferences |
| `src/hooks/useChecklist.ts` | No changes expected — pure data logic stays |
| `src/hooks/useAuth.tsx` | No changes expected |
| `src/app/error/page.tsx` | Minor styling updates for brand consistency |
| `middleware.ts` | No changes expected |

---

## Approaches

### 1. Navigation / Layout

#### A. Bottom Tab Bar + Slim Header
- Replace the full header with a slim fixed header (just day name + progress circle)
- Add a fixed bottom tab bar: **Home** (current checklist), **Progress** (weekly view), **Settings** (theme, account)
- Day tabs remain above content but become swipeable (Approach B below)

| Pros | Cons | Effort |
|------|------|--------|
| True app-like navigation, familiar mobile pattern | Reduces vertical space, bottom bar = +56px fixed | Medium |
| Three tabs give room for future features (dashboard, settings) | Need to add client-side routing or view switching | |
| Home tab focuses on the current day's tasks | Desktop users might find bottom nav unusual | |

#### B. Swipeable Day Views (Carousel)
- Replace horizontal DayTabs with a swipeable carousel (pan gestures between days)
- Day tabs become a slim pagination indicator (dots or abbreviated labels)
- Use Framer Motion `AnimatePresence` for slide left/right transitions

| Pros | Cons | Effort |
|------|------|--------|
| Most app-like experience, native feel | Requires gesture library (Framer Motion or use-gesture) | High |
| Natural mobile UX — swipe between days | Must keep keyboard nav: ArrowLeft/ArrowRight on tabs | |
| Day tabs can still exist as clickable headers | Touch gesture handling needs careful implementation | |

#### C. Desktop Sidebar + Mobile Bottom Nav (Adaptive)
- **Desktop (>768px)**: Fixed sidebar on left with day list + brand + nav options. Content area on right.
- **Mobile**: Bottom tab bar, swipeable days, slim header.

| Pros | Cons | Effort |
|------|------|--------|
| Best use of desktop space | Two layout systems to maintain | High |
| Sidebar can show week overview + streaks | Breakpoints add testing surface | |
| Scales naturally across form factors | Most complex approach | |

### 2. Interactions & Animations

#### A. Framer Motion Library
- Add `framer-motion` as dependency (already compatible with React 19)
- Animate day transitions with `AnimatePresence` + slide variants
- Animate task checkmarks with `layoutId` (spring scale on checkmark)
- Animate progress circle on mount (`initial` + `animate` on SVG)
- `useReducedMotion()` for accessibility

| Pros | Cons | Effort |
|------|------|--------|
| Declarative API, great React integration, spring physics | ~32KB gzipped bundle cost | Medium |
| `layout` animations for smooth list reordering | Learning curve for team | |
| Gesture support (`useDrag`, `useSwipe`) for swipeable days | Some animations need `layout animations` which require `AnimatePresence` wrapper | |

#### B. CSS-Only Animations (No Library)
- Use CSS `@keyframes` + `transition` for all animations
- Progress circle: `transition: stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)`
- Task toggle: subtle scale pulse on checkbox via `transform: scale()` animation
- Day switch: CSS `::view-transition` (View Transition API) if supported
- Add `prefers-reduced-motion` media query

| Pros | Cons | Effort |
|------|------|--------|
| Zero bundle cost | Limited gesture/spring support | Medium-Low |
| Built-in browser optimization | View Transition API not in all browsers | |
| Simpler mental model | Swipe gestures require JS anyway | |

#### C. Hybrid (CSS for micro-interactions, Framer for transitions)
- CSS transitions for: hover states, focus ring, active press, simple opacity/color changes
- Framer Motion only for: day slide transitions, progress circle mount, task toggle bounce
- Custom `useSwipe` hook for day carousel (re-uses motion gesture but without full `useDrag`)

| Pros | Cons | Effort |
|------|------|--------|
| Best of both — zero-cost micro-interactions, rich transitions only where needed | Two animation systems to learn | Medium |
| Reduced Framer Motion usage → can tree-shake unused features | Need to define clear boundary: "CSS for X, Framer for Y" | |
| Progressive enhancement: CSS animates first, JS enriches | | |

### 3. Task Card Redesign

#### A. Elevated Cards with Rich Visuals
- TaskBlock: larger white card with subtle shadow, left accent border thicker (6px), rounded corners
- Individual TaskItem: no longer bordered rows — instead floated cards with subtle shadow
- Checkbox: bigger (28px), with a subtle pulse animation on toggle
- Progress indicator per block: small bar at top of card showing block completion
- Person badge: elevated chip with subtle shadow

| Pros | Cons | Effort |
|------|------|--------|
| Rich, modern visual hierarchy | More vertical space per task | Medium |
| Better touch targets (bigger checkbox, more padding) | More complex CSS | |
| Clearer visual progression | | |

#### B. Bottom Sheet for Task Detail
- Tapping a task opens a bottom sheet (slide-up panel) instead of inline toggle
- Sheet shows: task icon (large), name, time, notes, assignee, history
- Swipe down to dismiss
- Checkmark toggle inside the sheet

| Pros | Cons | Effort |
|------|------|--------|
| App-like pattern, spacious detail view | Adds interaction cost (tap → sheet → toggle → dismiss) | High |
| Can show more info (assignee history, notes) | Could feel slower for quick toggling | |
| Opens door for task editing/notes in future | Must ensure keyboard accessibility for sheet | |

#### C. Current Inline with Visual Upgrade
- Keep the current inline toggle pattern (instant checkmark is core to the app's speed)
- Upgrade: animated checkmark (draw path), spring scale on the icon, color transition
- Add a subtle row-level pulse when toggled
- TaskBlock: curved corners, day-colored top accent instead of side border

| Pros | Cons | Effort |
|------|------|--------|
| Preserves current fast interaction model | Less "app-like" than bottom sheet | Medium-Low |
| Simplest code change | Still feels row-based | |
| Animation improvements keep it feeling fresh | | |

### 4. Dark Mode

#### A. CSS Custom Properties Only
- Add `[data-theme="dark"]` selector in `tokens.css` overriding all color tokens
- Use `prefers-color-scheme: dark` for initial mode detection
- Store preference in localStorage
- Toggle button in app header or settings

| Pros | Cons | Effort |
|------|------|--------|
| Zero runtime CSS-in-JS, pure CSS | Need to define all dark tokens correctly | Medium-Low |
| Works with existing CSS Module architecture | Dynamic day palette colors need dark variants | |
| No additional dependencies | | |

#### B. CSS + Context Provider
- `ThemeProvider` component wrapping the app
- Exposes `{ theme, toggleTheme }` via context
- Sets `data-theme` on `<html>` element
- Persists choice to localStorage
- Components can react to theme (e.g., ProgressCircle stroke color)

| Pros | Cons | Effort |
|------|------|--------|
| Components can adapt behavior based on theme | Slightly more code than pure CSS | Medium-Low |
| Clean React integration | Same CSS variable approach underneath | |
| Easy to add animations on theme switch (`transition: background 0.3s`) | | |

### 5. Auth Pages Redesign

#### A. Splash/Welcome Screen with Animated Brand
- Login page transforms into a splash screen with large "Goruti" wordmark + tagline
- Subtle background animation (lime gradient sweep, floating shapes)
- Form slides in from bottom (or fades in after delay)
- Smooth page transition between login ↔ register (no full page reload feel)

| Pros | Cons | Effort |
|------|------|--------|
| Strong brand impression on first visit | Login becomes multi-step (see → interact → fill) | Medium |
| Sets "app" expectations from first screen | May slow down returning users | |
| Opportunity for animated brand mark | | |

#### B. Streamlined Minimal Card
- Keep current centered card pattern but refine:
  - Larger brand mark at top (SVG logo instead of text)
  - Card has subtle border + shadow
  - Input focus: lime glow is more pronounced
  - "Magic" link: passwordless email link option for login
  - Form validation: inline errors, shake animation on error
  - Smooth transition to register page (CSS View Transition API)

| Pros | Cons | Effort |
|------|------|--------|
| Faster access for returning users | Less brand impact on first visit | Low-Medium |
| Clean, focused form | Unlikely to use View Transition API for cross-page nav | |
| Lower complexity | | |

---

## Recommendation

**Navigation**: Go with **Approach A (Bottom Tab Bar + Slim Header)** — this is the single highest-impact change for "app-like" feel. Keep the header slim (day name + progress circle only). Move user info and sign-out to a Settings tab. Day tabs stay as swipeable horizontal tabs (not full carousel — horizontal scroll is fine and familiar).

**Animations**: **Approach C (Hybrid)** — CSS transitions for micro-interactions (hover, focus, color changes). Add Framer Motion **only** for:
1. Day tab switch animation (slide left/right with `AnimatePresence`)
2. Task toggle spring animation (subtle scale on checkmark)
3. Progress circle mount animation
4. Progress circle smooth value change

Keep the library footprint minimal — only import `motion`, `AnimatePresence`, `useReducedMotion`.

**Task Cards**: **Approach C (Current Inline with Visual Upgrade)** — the app's core value is fast task toggling. A bottom sheet would slow that down. Instead, upgrade the visual:
- Larger checkbox (28px target)
- Animated checkmark draw
- Elevated card with left accent → switch to top accent bar
- Subtle row background change on toggle with spring animation

**Dark Mode**: **Approach B (CSS Custom Properties + Context Provider)** — it's clean, future-proof, and lets components react. Will need dark variants for the 7 day palette colors.

**Auth Pages**: **Approach B (Streamlined Minimal Card)** — keep it fast for returning users, but refine the visual details. Add a lime-glow focus state, inline validation, and an animated error shake.

### Implementation Order (from highest impact to lowest effort)

| Phase | What | Why First |
|-------|------|-----------|
| 1 | **Bottom tab bar + slim header** | Transforms navigation fundamentally |
| 2 | **Day switch animations** | Most visible animation — feels like a real app |
| 3 | **Task toggle animation + card upgrade** | Core interaction gets the most polish |
| 4 | **Dark mode** | Brand-defined, big visual impact |
| 5 | **Progress circle mount anim** | Small effort, noticeable on page load |
| 6 | **Auth page refinements** | Lower priority — returning users see it less |
| 7 | **Micro-habits interactivity** | Lowest priority — static content is fine for now |

### What to NOT Do (for this phase)
- **Bottom sheet for task details** — adds friction to the core action
- **Desktop sidebar layout** — the app is primarily mobile-first; desktop works fine with max-width
- **PWA/offline support** — significant scope, separate project
- **Drag-to-reorder tasks** — no current data model for ordering, big complexity
- **Supabase Realtime sync** — future feature, unrelated to UI
- **Full carousel swipe days** — horizontal scroll tabs + slide animation is sufficient

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Animations break accessibility** | Low | High | Always use `prefers-reduced-motion` and `useReducedMotion()` |
| **Bottom nav works poorly on desktop** | Medium | Medium | On >768px, bottom nav becomes a slim top bar or left sidebar |
| **Framer Motion bundle size** | Medium | Medium | Import only specific modules (`motion`, `AnimatePresence`), tree-shake rest |
| **CSS Modules + dynamic classes for animations** | Low | Medium | Use CSS Modules `composes` pattern or inline `style` for dynamic values |
| **Dark mode color a11y contrast** | Medium | High | Audit all dark mode colors against WCAG AA contrast ratios |
| **Safe area handling (iOS notch)** | Medium | Low | Use `env(safe-area-inset-*)` and `viewport-fit=cover` in viewport meta |
| **Swipe gestures conflict with horizontal scroll** | Low | Medium | Use explicit gesture regions and `touch-action: pan-y` to disambiguate |
| **Keyboard nav breaks with swipeable days** | Low | Medium | Swipe is additive — keyboard ArrowLeft/ArrowRight must still work |

---

## Ready for Proposal

**Yes.** The exploration is thorough enough to move to the Proposal phase. Key findings:

1. **Navigation overhaul** (bottom tab bar + slim header) is the fundamental change
2. **Framer Motion** should be added but used sparingly (hybrid with CSS)
3. **Animation changes** must respect `prefers-reduced-motion`
4. **Task card inline pattern should stay** — the speed of toggling is more important than bottom sheet richness
5. **Dark mode** is well-defined by brand tokens, straight-forward to implement
6. **Day palette colors** need dark-mode variants — this is the most subtle design challenge
7. **No breaking changes** to the data layer, reducer, or hooks — this is purely presentational

### Next: sdd-propose
The orchestrator should run `sdd-propose` to formalize scope, approach, and rollback plan before moving to spec/design.
