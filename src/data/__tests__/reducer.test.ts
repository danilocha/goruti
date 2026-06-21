// @legacy — checklistReducer is retired as part of routine-builder-v2.
// Completion state is now owned by useCompletions backed by Supabase task_completions.
// These tests are skipped per T-13 in tasks.md.
import { describe, it, expect } from "vitest";
import { checklistReducer } from "../reducer";
import type { CheckState } from "../types";

describe.skip("checklistReducer", () => {
  const emptyState: CheckState = {};

  const populatedState: CheckState = {
    Lunes: { lev: true, tend: false, desa: true },
    Martes: { gym: false },
  };

  // ── TOGGLE_TASK ──────────────────────────────────────────────

  it("flips an unchecked task to checked", () => {
    const state: CheckState = { Lunes: { task1: false } };
    const next = checklistReducer(state, {
      type: "TOGGLE_TASK",
      day: "Lunes",
      taskId: "task1",
    });
    expect(next.Lunes?.task1).toBe(true);
  });

  it("flips a checked task to unchecked", () => {
    const state: CheckState = { Lunes: { task1: true } };
    const next = checklistReducer(state, {
      type: "TOGGLE_TASK",
      day: "Lunes",
      taskId: "task1",
    });
    expect(next.Lunes?.task1).toBe(false);
  });

  it("creates a day entry when toggling a task in a new day", () => {
    const next = checklistReducer(emptyState, {
      type: "TOGGLE_TASK",
      day: "Miércoles",
      taskId: "barr",
    });
    expect(next.Miércoles).toBeDefined();
    expect(next.Miércoles?.barr).toBe(true);
  });

  it("does not affect other tasks when toggling", () => {
    const next = checklistReducer(populatedState, {
      type: "TOGGLE_TASK",
      day: "Lunes",
      taskId: "tend",
    });
    // toggled task changed
    expect(next.Lunes?.tend).toBe(true);
    // other tasks unchanged
    expect(next.Lunes?.lev).toBe(true);
    expect(next.Lunes?.desa).toBe(true);
    // other day unchanged
    expect(next.Martes?.gym).toBe(false);
  });

  // ── HYDRATE ──────────────────────────────────────────────────

  it("replaces the entire state with the provided state", () => {
    const snapshot: CheckState = {
      Viernes: { x1: true, x2: false },
    };
    const next = checklistReducer(emptyState, {
      type: "HYDRATE",
      state: snapshot,
    });
    expect(next).toEqual(snapshot);
  });

  it("overwrites existing state completely on hydrate", () => {
    const snapshot: CheckState = { Sábado: { gym: true } };
    const next = checklistReducer(populatedState, {
      type: "HYDRATE",
      state: snapshot,
    });
    expect(next).toEqual({ Sábado: { gym: true } });
  });

  // ── RESET_ALL ────────────────────────────────────────────────

  it("returns an empty object from a populated state", () => {
    const next = checklistReducer(populatedState, {
      type: "RESET_ALL",
    });
    expect(next).toEqual({});
  });

  it("returns an empty object from an already empty state", () => {
    const next = checklistReducer(emptyState, {
      type: "RESET_ALL",
    });
    expect(next).toEqual({});
  });

  // ── UNKNOWN ACTION ───────────────────────────────────────────

  it("returns the same state for an unknown action", () => {
    const next = checklistReducer(populatedState, {
      // @ts-expect-error — testing runtime behavior for unknown action type
      type: "UNKNOWN",
    });
    expect(next).toBe(populatedState);
  });
});
