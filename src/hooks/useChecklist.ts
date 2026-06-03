"use client";

import { useReducer, useMemo, useCallback, useState } from "react";
import { checklistReducer } from "@/data/reducer";
import type { DayName } from "@/data/types";
import { DAYS } from "@/data/constants";
import { buildTasks } from "@/data/tasks";
import { getProgress, groupByBlock } from "@/data/utils";

/** Map JS getDay() (0=Sunday) to our DayName */
const TODAY_NAMES: string[] = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/**
 * Central state hook for the checklist.
 *
 * - Uses `useReducer` with the pure `checklistReducer` from the data layer
 * - Derives tasks, blocks, progress, and per-day progress map
 * - All derived values are memoized with `useMemo`
 * - `toggleTask` dispatches TOGGLE_TASK for the currently selected day
 */
export function useChecklist() {
  const [state, dispatch] = useReducer(checklistReducer, {});

  // ── Selected day ────────────────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const todayIdx = new Date().getDay();
    const name = TODAY_NAMES[todayIdx];
    return DAYS.includes(name as DayName) ? name : "Lunes";
  });

  const dayIdx = DAYS.indexOf(selectedDay as DayName);

  // ── Today's name (constant for the session) ─────────────────────
  const todayName = useMemo<string>(() => {
    return TODAY_NAMES[new Date().getDay()];
  }, []);

  // ── Derived state for the selected day ──────────────────────────
  const tasks = useMemo(() => buildTasks(selectedDay, dayIdx), [selectedDay, dayIdx]);

  const blocks = useMemo(() => groupByBlock(tasks), [tasks]);

  const dayChecks = useMemo<Record<string, boolean>>(
    () => state[selectedDay] ?? {},
    [state, selectedDay],
  );

  const checkable = useMemo(() => tasks.filter((t) => !t.noCheck), [tasks]);

  const done = useMemo(
    () => checkable.filter((t) => dayChecks[t.id]).length,
    [checkable, dayChecks],
  );

  const total = checkable.length;

  const progress = useMemo(
    () => getProgress(done, total),
    [done, total],
  );

  // ── Per-day progress for tab mini-bars ─────────────────────────
  const dayProgressMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const day of DAYS) {
      const idx = DAYS.indexOf(day);
      const dayTasks = buildTasks(day, idx);
      const ct = dayTasks.filter((t) => !t.noCheck).length;
      const dd = dayTasks.filter((t) => state[day]?.[t.id]).length;
      map[day] = getProgress(dd, ct);
    }
    return map;
  }, [state]);

  // ── Actions ────────────────────────────────────────────────────
  const toggleTask = useCallback(
    (taskId: string) => {
      dispatch({ type: "TOGGLE_TASK", day: selectedDay, taskId });
    },
    [dispatch, selectedDay],
  );

  return {
    state,
    dispatch,
    selectedDay,
    setSelectedDay,
    todayName,
    tasks,
    blocks,
    dayChecks,
    checkable,
    done,
    total,
    progress,
    toggleTask,
    dayProgressMap,
  } as const;
}
