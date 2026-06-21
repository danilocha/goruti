"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Completion, RoutineTask, TaskSchedule } from "@/data/types";
import {
  currentWeekDates,
  computeWeeklyProgress,
  computeStreak,
  type DayProgress,
} from "@/data/weeklyProgress";

interface UseWeeklyProgressResult {
  loading: boolean;
  error: string | null;
  weekProgress: DayProgress[];
  weekPct: number;
  streak: number;
}

/**
 * useWeeklyProgress — browser-client hook that fetches all tasks for the group
 * and completions for the current week (Mon–Sun), then derives per-day progress,
 * overall week percentage, and the current streak using pure helpers.
 *
 * Mirror of fetchDayData's query shape, extended to the whole week.
 * Completions are filtered to currentUserId server-side (where clause).
 */
export function useWeeklyProgress(
  groupId: string,
  currentUserId: string,
): UseWeeklyProgressResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekProgress, setWeekProgress] = useState<DayProgress[]>([]);
  const [weekPct, setWeekPct] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!groupId || !currentUserId) return;

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const today = new Date();
      const weekDates = currentWeekDates(today);
      const todayStr = weekDates.find((d) => {
        const t = new Date();
        return (
          d.date ===
          `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
        );
      })?.date ?? weekDates[weekDates.findIndex((_, i) => i === 4)]?.date ?? weekDates[0].date;

      const dateStrings = weekDates.map((d) => d.date);

      // 1. Fetch routines for the group
      const { data: routines, error: routinesErr } = await supabase
        .from("routines")
        .select("id")
        .eq("group_id", groupId);

      if (routinesErr) {
        if (!cancelled) {
          setError(routinesErr.message);
          setLoading(false);
        }
        return;
      }

      if (!routines || routines.length === 0) {
        if (!cancelled) {
          setWeekProgress(computeWeeklyProgress([], [], weekDates, currentUserId));
          setWeekPct(0);
          setStreak(0);
          setLoading(false);
        }
        return;
      }

      const routineIds = routines.map((r: { id: string }) => r.id);

      // 2. Fetch all tasks for those routines
      const { data: rawTasks, error: tasksErr } = await supabase
        .from("tasks")
        .select("*")
        .in("routine_id", routineIds)
        .order("position");

      if (tasksErr) {
        if (!cancelled) {
          setError(tasksErr.message);
          setLoading(false);
        }
        return;
      }

      const tasks: RoutineTask[] = (rawTasks ?? []).map(
        (row: Record<string, unknown>) => ({
          id: row.id as string,
          routineId: row.routine_id as string,
          name: row.name as string,
          icon: (row.icon as string | null) ?? null,
          block: (row.block as string | null) ?? null,
          timeLabel: (row.time_label as string | null) ?? null,
          note: (row.note as string | null) ?? null,
          noCheck: row.no_check as boolean,
          schedule: row.schedule as TaskSchedule,
          assignedTo: (row.assigned_to as string[] | null) ?? null,
          position: row.position as number,
        }),
      );

      const taskIds = tasks.map((t) => t.id);
      if (taskIds.length === 0) {
        if (!cancelled) {
          setWeekProgress(computeWeeklyProgress([], [], weekDates, currentUserId));
          setWeekPct(0);
          setStreak(0);
          setLoading(false);
        }
        return;
      }

      // 3. Fetch completions for the 7 week dates, current user only
      const { data: rawCompletions, error: completionsErr } = await supabase
        .from("task_completions")
        .select("*")
        .in("task_id", taskIds)
        .in("completed_date", dateStrings)
        .eq("user_id", currentUserId);

      if (completionsErr) {
        if (!cancelled) {
          setError(completionsErr.message);
          setLoading(false);
        }
        return;
      }

      const completions: Completion[] = (rawCompletions ?? []).map(
        (row: Record<string, unknown>) => ({
          id: row.id as string,
          routineId: row.routine_id as string,
          taskId: row.task_id as string,
          userId: row.user_id as string,
          completedDate: row.completed_date as string,
          completedAt: row.completed_at as string,
        }),
      );

      // 4. Compute derived values
      const progress = computeWeeklyProgress(tasks, completions, weekDates, currentUserId);
      const totalCheckable = progress.reduce((s, d) => s + d.total, 0);
      const totalDone = progress.reduce((s, d) => s + d.done, 0);
      const pct = totalCheckable === 0 ? 0 : Math.round((totalDone / totalCheckable) * 100);
      const str = computeStreak(progress, todayStr);

      if (!cancelled) {
        setWeekProgress(progress);
        setWeekPct(pct);
        setStreak(str);
        setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [groupId, currentUserId]);

  return { loading, error, weekProgress, weekPct, streak };
}
