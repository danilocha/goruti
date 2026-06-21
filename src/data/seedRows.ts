/**
 * buildSeedTaskRows — derives RoutineTask seed rows from buildTasks().
 *
 * Iterates all 7 days and deduplicates tasks into one row per unique
 * (id, timeLabel, block, name, note, noCheck) combination, accumulating
 * schedule.days for each occurrence.
 *
 * `who` is dropped → assignedTo = null (Fase 1: all members).
 * `position` is set from the first-seen insertion order.
 *
 * @param routineId - The UUID of the routine to attach these tasks to.
 *   Pass an empty string (default) when generating rows for inspection
 *   or testing before a routine row exists.
 */

import { buildTasks } from "./tasks";
import { DAYS } from "./constants";
import type { RoutineTask } from "./types";

export function buildSeedTaskRows(routineId = ""): RoutineTask[] {
  const map = new Map<string, RoutineTask>();
  let position = 0;

  for (const day of DAYS) {
    const dayIdx = DAYS.indexOf(day);
    const tasks = buildTasks(day, dayIdx);

    for (const task of tasks) {
      const timeLabel = task.time ?? null;
      const note = task.note ?? null;
      const noCheck = task.noCheck ?? false;

      // Dedup key: id + timeLabel + block + name + note + noCheck
      const key = `${task.id}__${timeLabel ?? ""}__${task.block}__${task.task}__${note ?? ""}__${noCheck}`;

      const existing = map.get(key);
      if (existing) {
        existing.schedule.days.push(day);
      } else {
        map.set(key, {
          id: "",          // DB assigns the UUID; left empty for seed template rows
          routineId,
          name: task.task,
          icon: task.icon ?? null,
          block: task.block ?? null,
          timeLabel,
          note,
          noCheck,
          schedule: { type: "weekly", days: [day] },
          assignedTo: null,
          position: position++,
        });
      }
    }
  }

  return Array.from(map.values());
}
