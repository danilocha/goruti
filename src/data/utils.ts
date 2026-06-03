import type { Task } from "./types";
import { WHO_STYLE } from "./constants";

/**
 * Resolves the visual style (background + text color) for a person badge.
 * Falls back to the "DA" (both) style for unknown values.
 */
export function resolvePersonStyle(who: string): { bg: string; color: string } {
  return WHO_STYLE[who] ?? WHO_STYLE["DA"];
}

/**
 * Determines the rotating assignee based on day index parity.
 * Even index → "D", Odd index → "A".
 */
export function resolveAssignee(dayIdx: number): "D" | "A" {
  return dayIdx % 2 === 0 ? "D" : "A";
}

/**
 * Calculates the completion percentage.
 * Returns 0 when there are no checkable tasks (avoids division by zero).
 */
export function getProgress(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

/**
 * Groups an array of tasks by their `block` field, preserving chronological
 * order of blocks as they first appear in the array.
 */
export function groupByBlock(tasks: Task[]): { label: string; items: Task[] }[] {
  const seen = new Set<string>();
  const blocks: { label: string; items: Task[] }[] = [];

  for (const task of tasks) {
    if (!seen.has(task.block)) {
      seen.add(task.block);
      blocks.push({ label: task.block, items: [] });
    }
  }

  // Use a map for O(1) lookup when populating items
  const blockMap = new Map<string, Task[]>();
  for (const block of blocks) {
    blockMap.set(block.label, block.items);
  }
  for (const task of tasks) {
    blockMap.get(task.block)?.push(task);
  }

  return blocks;
}
