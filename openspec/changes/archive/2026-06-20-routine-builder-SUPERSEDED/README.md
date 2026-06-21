# Archived: routine-builder (SUPERSEDED)

**Status**: Superseded by `routine-builder-v2` (2026-06-20)

## Summary

This change proposed a **localStorage-first routine builder** with client-side CRUD and a `RoutineStore` abstraction layer.

## Why Superseded

`routine-builder-v2` was launched instead, which implements the **Supabase data-driven core** — the Phase 2 vision from this proposal but delivered as Phase 1 Fase 1. The architectural shift from localStorage to Supabase was decided to support:

- Multi-device sync
- Shared groups (future multi-member)
- Proper RLS access control
- Server-side fetch (no client-side hardcoding)

The `RoutineStore` abstraction pattern from this proposal was preserved in spirit in the design, but the implementation uses Supabase tables directly instead of localStorage persistence.

## Artifacts

- `proposal.md` — localStorage-MVP strategy
- `design.md` — tab-based SPA routing + `RoutineStore` interface
- `tasks.md` — 5-phase breakdown (Types, Hook, Navigation, UI, Polish)
- `exploration.md` — comparison of localStorage vs. Supabase approaches

## For Future Reference

If reverting to a client-only solution is needed, this folder contains the full design and task breakdown.
