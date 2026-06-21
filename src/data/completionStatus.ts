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
 * applyCompletionEvent — pure reducer for realtime postgres_changes events.
 *
 * Security note: realtime rows are filtered by RLS — the client only receives
 * events for rows it can SELECT (its own group). The publication migration
 * `supabase/migrations/20260621010000_realtime_completions.sql` added
 * `task_completions` to `supabase_realtime`.
 *
 * INSERT: appends the row unless a completion with the same `id` already exists.
 * DELETE: removes the row whose `id` matches `event.row.id`.
 * Always returns a NEW array (pure function).
 */
export function applyCompletionEvent(
  others: Completion[],
  event: { kind: "INSERT" | "DELETE"; row: Completion },
): Completion[] {
  if (event.kind === "INSERT") {
    if (others.some((c) => c.id === event.row.id)) {
      return [...others];
    }
    return [...others, event.row];
  }
  // DELETE
  return others.filter((c) => c.id !== event.row.id);
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
