"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Completion } from "@/data/types";
import { buildCompletionMap, applyCompletionEvent } from "@/data/completionStatus";

/**
 * useCompletions — optimistic completion toggle backed by Supabase, with
 * realtime updates for other group members via Supabase Realtime.
 *
 * Security: realtime relies on RLS — the client only receives postgres_changes
 * events for rows it can SELECT (its own group). See the publication migration
 * `supabase/migrations/20260621010000_realtime_completions.sql`.
 *
 * Signature: useCompletions(tasks, date, initial, currentUserId)
 *   tasks: { id, routineId }[] — needed because task_completions.routine_id is
 *   NOT NULL and the tc_insert RLS policy checks is_routine_member(routine_id).
 *   currentUserId: the authenticated user's id (passed from server component).
 *
 * - `checked` is initialised ONLY from MY completions (filtered by currentUserId).
 * - `otherCompletions` is live state updated via realtime subscription.
 * - `completedUserIds(taskId)`: returns the full set of userIds done for that task —
 *   combining live snapshot of OTHER members' completions with MY current optimistic state.
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

  // Live state for OTHER members' completions — updated via realtime subscription.
  const [otherCompletions, setOtherCompletions] = useState<Completion[]>(
    () => (currentUserId ? initial.filter((c) => c.userId !== currentUserId) : []),
  );

  // Derive the map from live state each render (cheap, avoids stale closures).
  const othersMap = useMemo(
    () => buildCompletionMap(otherCompletions),
    [otherCompletions],
  );

  const [failedTaskId, setFailedTaskId] = useState<string | null>(null);

  // Stable key for task ids to use as useEffect dependency.
  const taskIdsKey = tasks.map((t) => t.id).join(",");

  // Realtime subscription — re-subscribes when date, currentUserId, or task list changes.
  useEffect(() => {
    if (!currentUserId) return;

    const taskIdSet = new Set(tasks.map((t) => t.id));
    const supabase = createClient();

    const channel = supabase
      .channel(`realtime-completions-${date}-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_completions" },
        (payload) => {
          // Map snake_case DB columns → Completion type.
          // For DELETE, Supabase only sends the PK in `old_record`; we use that.
          const raw =
            payload.eventType === "DELETE"
              ? (payload.old as Record<string, unknown>)
              : (payload.new as Record<string, unknown>);

          const row: Completion = {
            id: raw["id"] as string,
            routineId: raw["routine_id"] as string,
            taskId: raw["task_id"] as string,
            userId: raw["user_id"] as string,
            completedDate: raw["completed_date"] as string,
            completedAt: raw["completed_at"] as string,
          };

          // Ignore own events — my state is managed optimistically.
          if (row.userId === currentUserId) return;
          // Ignore events for tasks not in the current view or the wrong date.
          if (!taskIdSet.has(row.taskId)) return;
          if (row.completedDate !== date) return;

          const kind =
            payload.eventType === "DELETE"
              ? "DELETE"
              : "INSERT"; // treat UPDATE as upsert (INSERT path dedupes by id)

          setOtherCompletions((prev) =>
            applyCompletionEvent(prev, { kind, row }),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, currentUserId, taskIdsKey]);

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
   * this task: live snapshot of others' completions (via realtime) merged with
   * my current optimistic state. Used to drive per-member status badges in
   * shared groups.
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
