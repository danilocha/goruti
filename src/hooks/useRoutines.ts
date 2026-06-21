"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Routine, RoutineTask, TaskSchedule } from "@/data/types";

export interface RoutineWithTasks extends Routine {
  tasks: RoutineTask[];
}

export interface UseRoutinesResult {
  routines: RoutineWithTasks[];
  loading: boolean;
  error: string | null;
  /** Re-fetch routines + tasks from the DB. Call after a mutation. */
  refetch: () => Promise<void>;
}

// ── DB row → camelCase mappers ─────────────────────────────────────

interface DbRoutine {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  template_id: string | null;
}

interface DbTask {
  id: string;
  routine_id: string;
  name: string;
  icon: string | null;
  block: string | null;
  time_label: string | null;
  note: string | null;
  no_check: boolean;
  schedule: TaskSchedule;
  assigned_to: string[] | null;
  position: number;
}

function mapRoutine(row: DbRoutine): Routine {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    description: row.description,
    templateId: row.template_id,
  };
}

function mapTask(row: DbTask): RoutineTask {
  return {
    id: row.id,
    routineId: row.routine_id,
    name: row.name,
    icon: row.icon,
    block: row.block,
    timeLabel: row.time_label,
    note: row.note,
    noCheck: row.no_check,
    schedule: row.schedule,
    assignedTo: row.assigned_to,
    position: row.position,
  };
}

/**
 * useRoutines — fetches routines and their tasks for a group.
 *
 * Read-only hook. Mutations go through server actions.
 * Maps snake_case DB columns to camelCase TypeScript types.
 */
export function useRoutines(groupId: string): UseRoutinesResult {
  const [routines, setRoutines] = useState<RoutineWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: routineRows, error: routineErr } = await supabase
      .from("routines")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (routineErr) {
      setError(routineErr.message);
      setLoading(false);
      return;
    }

    const routineIds = (routineRows ?? []).map((r: DbRoutine) => r.id);

    let taskRows: DbTask[] = [];
    if (routineIds.length > 0) {
      const { data: tasks, error: taskErr } = await supabase
        .from("tasks")
        .select("*")
        .in("routine_id", routineIds)
        .order("position", { ascending: true });

      if (taskErr) {
        setError(taskErr.message);
        setLoading(false);
        return;
      }
      taskRows = tasks ?? [];
    }

    const tasksByRoutine = new Map<string, RoutineTask[]>();
    for (const row of taskRows) {
      const mapped = mapTask(row);
      const list = tasksByRoutine.get(mapped.routineId) ?? [];
      list.push(mapped);
      tasksByRoutine.set(mapped.routineId, list);
    }

    const result: RoutineWithTasks[] = (routineRows ?? []).map(
      (r: DbRoutine) => ({
        ...mapRoutine(r),
        tasks: tasksByRoutine.get(r.id) ?? [],
      }),
    );

    setRoutines(result);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    routines,
    loading,
    error,
    refetch: fetchAll,
  };
}
