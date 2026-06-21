import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { RoutineTask } from "@/data/types";
import { useChecklist } from "../useChecklist";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTask(
  id: string,
  block: string,
  position: number,
  days: RoutineTask["schedule"]["days"] = ["Lunes"],
): RoutineTask {
  return {
    id,
    routineId: "routine-1",
    name: `Task ${id}`,
    icon: "•",
    block,
    timeLabel: null,
    note: null,
    noCheck: false,
    schedule: { type: "weekly", days },
    assignedTo: null,
    position,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useChecklist — block ordering", () => {
  it("orders blocks by first appearance (sort_order), NOT alphabetically", () => {
    /**
     * Blocks in routine order: Noche (pos 1) → Mañana (pos 2) → Tarde (pos 3)
     * Alphabetical order would be: Mañana → Noche → Tarde
     * Expected: block labels follow appearance order [Noche, Mañana, Tarde]
     */
    const tasks: RoutineTask[] = [
      makeTask("t1", "Noche", 1),
      makeTask("t2", "Noche", 2),
      makeTask("t3", "Mañana", 3),
      makeTask("t4", "Mañana", 4),
      makeTask("t5", "Tarde", 5),
    ];

    const { result } = renderHook(() => useChecklist(tasks, "Lunes"));

    const blockLabels = result.current.blocks.map((b) => b.label);
    expect(blockLabels).toEqual(["Noche", "Mañana", "Tarde"]);
  });

  it("orders Mañana → Tarde → Noche when that is the sort_order sequence", () => {
    const tasks: RoutineTask[] = [
      makeTask("t1", "Mañana", 1),
      makeTask("t2", "Tarde", 2),
      makeTask("t3", "Noche", 3),
    ];

    const { result } = renderHook(() => useChecklist(tasks, "Lunes"));

    const blockLabels = result.current.blocks.map((b) => b.label);
    expect(blockLabels).toEqual(["Mañana", "Tarde", "Noche"]);
  });

  it("tasks within a block are ordered by position ascending", () => {
    const tasks: RoutineTask[] = [
      makeTask("t3", "Mañana", 3),
      makeTask("t1", "Mañana", 1),
      makeTask("t2", "Mañana", 2),
    ];

    const { result } = renderHook(() => useChecklist(tasks, "Lunes"));

    const items = result.current.blocks[0].items;
    expect(items.map((i) => i.id)).toEqual(["t1", "t2", "t3"]);
  });
});
