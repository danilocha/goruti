"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Completion } from "@/data/types";
import { buildCompletionMap } from "@/data/completionStatus";

/**
 * useCompletions — optimistic completion toggle backed by Supabase.
 *
 * Signature: useCompletions(tasks, date, initial, currentUserId)
 *   tasks: { id, routineId }[] — needed because task_completions.routine_id is
 *   NOT NULL and the tc_insert RLS policy checks is_routine_member(routine_id).
 *   currentUserId: the authenticated user's id (passed from server component).
 *
 * - `checked` is initialised ONLY from MY completions (filtered by currentUserId).
 * - `completedUserIds(taskId)`: returns the full set of userIds done for that task —
 *   combining static snapshot of OTHER members' completions (from page load) with
 *   MY current optimistic state. Others are a snapshot; realtime is future work.
 * - toggle(taskId): optimistic update → upsert or delete → rollback on error.
 * - isChecked(taskId): returns true if THE CURRENT USER completed the task.
 *
 * Uses the browser Supabase client (not the server client).
 */
export function useCompletions(
  tasks: ReadonlyArray<{ id: string; routineId: string }>,
  date: string,
  initial: Completion[],
  currentUserId = "",
) {
  const routineByTask = new Map(tasks.map((t) => [t.id, t.routineId]));

  // My optimistic checked set — only MY completions.
  // When currentUserId is empty (legacy / test path), treat all completions as mine.
  const myCompletions = currentUserId
    ? initial.filter((c) => c.userId === currentUserId)
    : initial;

  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(myCompletions.map((c) => c.taskId)),
  );

  // Static snapshot of OTHER members' completions (used to show their status in shared groups).
  // NOTE: others' completions are not updated in realtime — realtime is future work.
  const othersMap = buildCompletionMap(
    currentUserId ? initial.filter((c) => c.userId !== currentUserId) : [],
  );

  const [failedTaskId, setFailedTaskId] = useState<string | null>(null);

  const toggle = useCallback(
    async (taskId: string) => {
      const wasChecked = checked.has(taskId);
      const supabase = createClient();

      // Clear any previous error for this interaction
      setFailedTaskId(null);

      // Optimistic update — happens synchronously before any await
      setChecked((prev) => {
        const next = new Set(prev);
        if (wasChecked) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
        return next;
      });

      // Use the known currentUserId for writes (avoids an extra getUser round-trip
      // for the optimistic path; getUser is still called as a safety fallback).
      const userId = currentUserId || ((await supabase.auth.getUser()).data.user?.id ?? "");

      if (!wasChecked) {
        // Upsert: mark as complete
        const { error } = await supabase.from("task_completions").upsert(
          {
            task_id: taskId,
            routine_id: routineByTask.get(taskId),
            user_id: userId,
            completed_date: date,
          },
          { onConflict: "task_id,user_id,completed_date" },
        );

        if (error) {
          // Rollback
          setChecked((prev) => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
          setFailedTaskId(taskId);
          console.error("useCompletions: upsert failed", error);
        }
      } else {
        // Delete: unmark as complete
        const { error } = await supabase
          .from("task_completions")
          .delete()
          .eq("task_id", taskId)
          .eq("user_id", userId)
          .eq("completed_date", date);

        if (error) {
          // Rollback
          setChecked((prev) => {
            const next = new Set(prev);
            next.add(taskId);
            return next;
          });
          setFailedTaskId(taskId);
          console.error("useCompletions: delete failed", error);
        }
      }
    },
    [checked, date, currentUserId],
  );

  const isChecked = useCallback(
    (taskId: string) => checked.has(taskId),
    [checked],
  );

  /**
   * completedUserIds(taskId) — returns the full set of userIds who completed
   * this task: static snapshot of others' completions merged with my current
   * optimistic state. Used to drive per-member status badges in shared groups.
   */
  const completedUserIds = useCallback(
    (taskId: string): Set<string> => {
      const result = new Set<string>(othersMap.get(taskId) ?? []);
      if (checked.has(taskId)) {
        result.add(currentUserId);
      } else {
        result.delete(currentUserId);
      }
      return result;
    },
    [checked, currentUserId, othersMap],
  );

  return { isChecked, toggle, checked, failedTaskId, completedUserIds } as const;
}
