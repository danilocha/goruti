import type { Completion } from "./types";

export interface MemberStatus {
  userId: string;
  displayName: string | null;
  done: boolean;
}

/**
 * buildCompletionMap — builds a Map<taskId, Set<userId>> from a flat list of
 * Completion records. Useful for quickly looking up which users completed a task.
 *
 * Pure function — no side effects.
 */
export function buildCompletionMap(completions: Completion[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const c of completions) {
    const set = map.get(c.taskId) ?? new Set<string>();
    set.add(c.userId);
    map.set(c.taskId, set);
  }
  return map;
}

/**
 * memberStatusForTask — given a taskId, a list of group members, and the set of
 * userIds who completed the task, returns one MemberStatus per member indicating
 * whether they are done.
 *
 * Pure function — no side effects.
 */
export function memberStatusForTask(
  _taskId: string,
  members: Array<{ userId: string; displayName: string | null; role: "owner" | "member" }>,
  completedUserIds: Set<string>,
): MemberStatus[] {
  return members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    done: completedUserIds.has(m.userId),
  }));
}
