# Proposal: Goruti Brand Redesign

## Intent

The app has zero brand identity — hardcoded colors, system fonts, generic gradients. The Goruti brand bible (Black, Cream, Lime, Gold + Syne/DM Sans) exists but isn't applied. This change makes the UI visually coherent with the brand while keeping all existing behavior and structure intact.

## Scope

### In Scope
- Design token system (CSS custom properties + `next/font`)
- Brand restyle: Header, DayTabs, TaskBlock, TaskItem, ProgressCircle, MicroHabits
- Auth pages conversion from inline styles → CSS Modules + brand tokens
- ProgressCircle `variant` prop (lime for progress, gold for streaks)

### Out of Scope
- Dark mode (token system prepares for it, but light mode ships)
- Structural component refactors or logic changes
- New features or capabilities
- Theme toggle UI

## Capabilities

### New Capabilities
None — pure visual refactor, no new behavioral capabilities.

### Modified Capabilities
None — spec-level requirements unchanged. Auth still auths, checklist still displays and persists identically.

## Approach

4-phase hybrid per exploration recommendation:

| Phase | Scope | Est. Lines |
|-------|-------|-----------|
| **P0** | `tokens.css` + `fonts.ts` + `globals.css` + `layout.tsx` | ~150 |
| **P1** | Header + ProgressCircle (`variant` prop) | ~120 |
| **P2** | DayTabs + TaskBlock + TaskItem + MicroHabits | ~200 |
| **P3** | Auth pages — inline styles → CSS Modules + brand | ~180 |

P0 must ship first (everything depends on tokens). P1–P3 can ship in any order after P0.

Key decisions: Go Lime for primary CTAs + progress, Ruti Gold for streaks, Cream backgrounds, per-day color variety preserved but brand-harmonized, light mode default.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/styles/tokens.css` | New | All brand CSS custom properties |
| `src/styles/components/*.css` | New | Button, input, badge, card component tokens |
| `src/app/fonts.ts` | New | `next/font` for Syne + DM Sans |
| `src/app/globals.css` | Modified | Import tokens, brand body background |
| `src/app/layout.tsx` | Modified | Font class on `<html>` |
| `src/components/*.tsx` | Minor | Header colors, ProgressCircle `variant` prop |
| `src/components/*.module.css` | Modified | Replace hardcoded colors → brand tokens |
| `src/app/login/page.tsx` | Modified | Inline styles → CSS Module |
| `src/app/register/page.tsx` | Modified | Inline styles → CSS Module |
| `src/app/error/page.tsx` | Modified | Inline styles → CSS Module |
| `src/app/login/login.module.css` | New | Auth page CSS module |
| `src/app/register/register.module.css` | New | Auth page CSS module |
| `src/app/error/error.module.css` | New | Auth page CSS module |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Font FOUT | Low | `next/font` + `display: "swap"` + `preload` |
| Go Lime overuse | Med | Visual review: lime only on primary CTA + progress |
| Day color variety lost | Low | Keep per-day accent, harmonize to brand palette |
| Component test failures from CSS class changes | Med | Run tests after each phase, update selectors |
| `next/font` API breaking in Next.js 16 | Low | Consult `node_modules/next/dist/docs/` |

## Rollback Plan

Each phase is independently revertible via `git revert <phase-commit>`. Full rollback = revert all 4 phase commits in reverse order. No data migration involved — CSS-only changes cannot corrupt user data in localStorage.

## Dependencies

- Next.js 16 `next/font` API (verify docs before P0)
- No external design tool dependencies

## Success Criteria

- [ ] All hardcoded colors replaced by CSS custom properties from `tokens.css`
- [ ] Syne + DM Sans rendered via `next/font` with no FOUT
- [ ] Auth pages use CSS Modules with brand tokens (no inline styles)
- [ ] ProgressCircle accepts `variant` prop, renders lime or gold stroke
- [ ] All existing tests pass after each phase
- [ ] `rg "#[0-9A-Fa-f]{6}" src/components/ src/app/` returns zero non-brand hits
- [ ] Visual review confirms Go Lime used only on primary CTA + progress (brand rule)
