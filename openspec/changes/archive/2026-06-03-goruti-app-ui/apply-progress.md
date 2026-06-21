# Apply Progress — Phase 4 Complete

## Status: ✅ Complete

Phases 1–3 completed previously. Phase 4 (Dark Mode) fully implemented and builds successfully.

## Files Changed (Phase 4)

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useTheme.tsx` | **Create** | ThemeProvider + useTheme hook. Detects `prefers-color-scheme`, persists to localStorage (`goruti-theme`), sets `data-theme` on `<html>`, listens for system preference changes. |
| `src/styles/tokens.css` | **Modify** | Added `[data-theme="dark"]` block overriding: --bg-primary, --bg-card, --text-primary, --text-secondary, --border-default, --shadow-card. |
| `src/app/layout.tsx` | **Modify** | Inline flash-prevention `<script>` reads localStorage synchronously before React hydrates. `suppressHydrationWarning`. `<ThemeProvider>` wraps `<Providers>` as outermost provider. |
| `src/data/constants.ts` | **Modify** | Added `PAL_DARK` — dark-mode day color variants for all 7 days (same border, pastel header, dark-surface light). |
| `src/app/page.tsx` | **Modify** | Imported `useTheme()` + `PAL_DARK`. Conditionally selects palette based on `theme` value. |
| `src/app/globals.css` | **Modify** | Added `transition: background-color 0.3s ease, color 0.3s ease` on body and universal `*` for smooth theme switches. |
| `src/components/SettingsPanel.tsx` | **Modify** | Replaced "Próximamente" placeholder with live `useTheme()` toggle. Shows "Modo claro" / "Modo oscuro" label. |
| `src/components/SettingsPanel.module.css` | **Modify** | Added toggle switch CSS (track, thumb, hover/focus-visible states, active lime track state). |

## Verification

- ✅ `npm run build` passes with zero errors (6.3s compile, 7.5s TypeScript)

## Remaining Tasks

- Phase 5: Auth refinements (login/register focus glow, inline validation, error shake)
- Phase 6: Micro-habit interactive chips (useMicroHabits hook, chip toggle, keyboard accessibility)
- Legacy tasks 1.8–1.9 (globals.css safe-area, viewport-fit meta — can be folded into later phases)
