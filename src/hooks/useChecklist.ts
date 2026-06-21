"use client";

import { useMemo } from "react";
import type { DayName, RoutineTask, Task } from "@/data/types";
import { groupByBlock } from "@/data/utils";
import { getProgress } from "@/data/utils";

/**
 * useChecklist — derives display-ready task data from server-fetched RoutineTask[].
 *
 * New signature: useChecklist(tasks: RoutineTask[], dayName: DayName)
 *
 * - Filters tasks by schedule.days for the selected day
 * - Orders by block, then position (sortOrder)
 * - Maps RoutineTask → legacy Task shape expected by TaskBlock / TaskItem
 * - Computes progress (done / total checkable tasks)
 *
 * Note: "done" count is computed from the dayChecks passed in, not internal state.
 * Completion state is owned by useCompletions.
 */
export function useChecklist(tasks: RoutineTask[], dayName: DayName) {
  // Filter by schedule for the selected day
  const filteredTasks = useMemo(() => {
    const dayTasks = tasks.filter((t) => t.schedule.days.includes(dayName));

    // Build block-order map: the first position a block appears determines its rank.
    // We sort by position first so we get the minimum-position item per block.
    const byPosition = [...dayTasks].sort((a, b) => a.position - b.position);
    const blockOrder = new Map<string, number>();
    for (const t of byPosition) {
      const key = t.block ?? "";
      if (!blockOrder.has(key)) blockOrder.set(key, blockOrder.size);
    }

    return dayTasks.sort((a, b) => {
      const aRank = blockOrder.get(a.block ?? "") ?? 0;
      const bRank = blockOrder.get(b.block ?? "") ?? 0;
      if (aRank !== bRank) return aRank - bRank;
      return a.position - b.position;
    });
  }, [tasks, dayName]);

  // Map RoutineTask → legacy Task shape for UI components
  const legacyTasks = useMemo<Task[]>(
    () =>
      filteredTasks.map((t) => ({
        id: t.id,
        time: t.timeLabel ?? "",
        block: t.block ?? "Sin bloque",
        task: t.name,
        // assignedTo is stored as string[] | null; map to Person for badge display
        who: mapAssignedTo(t.assignedTo),
        icon: t.icon ?? "•",
        note: t.note ?? undefined,
        noCheck: t.noCheck,
      })),
    [filteredTasks],
  );

  const blocks = useMemo(() => groupByBlock(legacyTasks), [legacyTasks]);

  const checkable = useMemo(
    () => legacyTasks.filter((t) => !t.noCheck),
    [legacyTasks],
  );

  const total = checkable.length;

  return {
    filteredTasks,
    tasks: legacyTasks,
    blocks,
    checkable,
    total,
    // done and progress are computed by caller (HomeClient) using useCompletions
    done: 0,
    progress: 0,
  } as const;
}

// ── Progress helpers ───────────────────────────────────────────────────────────

export { getProgress };

// ── Shape adapter ──────────────────────────────────────────────────────────────

import type { Person } from "@/data/types";

/**
 * Maps the assignedTo array (or null) from RoutineTask to the legacy Person type.
 * Fase 1: all tasks have assignedTo = null → default to "DA".
 */
function mapAssignedTo(assignedTo: string[] | null): Person {
  if (!assignedTo || assignedTo.length === 0) return "DA";
  if (assignedTo.length >= 2) return "DA";
  const who = assignedTo[0];
  if (who === "D" || who === "A" || who === "Rot" || who === "DA") return who as Person;
  return "DA";
}
