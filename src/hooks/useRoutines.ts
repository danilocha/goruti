"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Routine, RoutineTask, DayName, TaskSchedule } from "@/data/types";
import type { RoutineTemplate } from "@/data/templates";
import { templateToTaskInputs } from "@/data/templates";

export interface RoutineWithTasks extends Routine {
  tasks: RoutineTask[];
}

export interface UseRoutinesResult {
  routines: RoutineWithTasks[];
  loading: boolean;
  error: string | null;
  createRoutine: (name: string, description?: string) => Promise<void>;
  updateRoutine: (
    id: string,
    fields: Partial<Pick<Routine, "name" | "description">>,
  ) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  addTask: (routineId: string, taskInput: TaskInput) => Promise<void>;
  updateTask: (taskId: string, fields: Partial<TaskInput>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  installTemplate: (template: RoutineTemplate) => Promise<void>;
}

export interface TaskInput {
  name: string;
  icon?: string | null;
  block?: string | null;
  timeLabel?: string | null;
  note?: string | null;
  noCheck?: boolean;
  schedule: TaskSchedule;
  position?: number;
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
 * Exposes full CRUD for routines and tasks.
 * Uses the browser Supabase client (authenticated).
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

  // ── Mutations ──────────────────────────────────────────────────

  const createRoutine = useCallback(
    async (name: string, description?: string) => {
      const supabase = createClient();
      const { error: err } = await supabase.from("routines").insert({
        group_id: groupId,
        name,
        description: description ?? null,
      });
      if (err) {
        setError(err.message);
        return;
      }
      await fetchAll();
    },
    [groupId, fetchAll],
  );

  const updateRoutine = useCallback(
    async (id: string, fields: Partial<Pick<Routine, "name" | "description">>) => {
      const supabase = createClient();
      const update: Record<string, unknown> = {};
      if (fields.name !== undefined) update.name = fields.name;
      if (fields.description !== undefined) update.description = fields.description;

      const { error: err } = await supabase
        .from("routines")
        .update(update)
        .eq("id", id);
      if (err) {
        setError(err.message);
        return;
      }
      await fetchAll();
    },
    [fetchAll],
  );

  const deleteRoutine = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("routines")
        .delete()
        .eq("id", id);
      if (err) {
        setError(err.message);
        return;
      }
      await fetchAll();
    },
    [fetchAll],
  );

  const addTask = useCallback(
    async (routineId: string, taskInput: TaskInput) => {
      const supabase = createClient();

      // Determine position: max existing + 1
      const existing = routines.find((r) => r.id === routineId);
      const position =
        taskInput.position ??
        (existing ? existing.tasks.length : 0);

      const { error: err } = await supabase.from("tasks").insert({
        routine_id: routineId,
        name: taskInput.name,
        icon: taskInput.icon ?? null,
        block: taskInput.block ?? null,
        time_label: taskInput.timeLabel ?? null,
        note: taskInput.note ?? null,
        no_check: taskInput.noCheck ?? false,
        schedule: taskInput.schedule,
        assigned_to: null,
        position,
      });
      if (err) {
        setError(err.message);
        return;
      }
      await fetchAll();
    },
    [routines, fetchAll],
  );

  const updateTask = useCallback(
    async (taskId: string, fields: Partial<TaskInput>) => {
      const supabase = createClient();
      const update: Record<string, unknown> = {};
      if (fields.name !== undefined) update.name = fields.name;
      if (fields.icon !== undefined) update.icon = fields.icon;
      if (fields.block !== undefined) update.block = fields.block;
      if (fields.timeLabel !== undefined) update.time_label = fields.timeLabel;
      if (fields.note !== undefined) update.note = fields.note;
      if (fields.noCheck !== undefined) update.no_check = fields.noCheck;
      if (fields.schedule !== undefined) update.schedule = fields.schedule;
      if (fields.position !== undefined) update.position = fields.position;

      const { error: err } = await supabase
        .from("tasks")
        .update(update)
        .eq("id", taskId);
      if (err) {
        setError(err.message);
        return;
      }
      await fetchAll();
    },
    [fetchAll],
  );

  const installTemplate = useCallback(
    async (template: RoutineTemplate) => {
      const supabase = createClient();

      // 1. Insert the routine and get its id
      const { data: routineRow, error: routineErr } = await supabase
        .from("routines")
        .insert({
          group_id: groupId,
          name: template.name,
          description: template.description,
          // template_id stays null for user installs: the unique
          // (group_id, template_id) is only for seed idempotency, and null
          // lets the same template be installed more than once as separate
          // editable copies (no unique-violation error on re-install).
          template_id: null,
        })
        .select("id")
        .single();

      if (routineErr || !routineRow) {
        setError(routineErr?.message ?? "Error creando rutina desde plantilla");
        return;
      }

      const routineId = routineRow.id as string;

      // 2. Bulk-insert all task rows
      const taskInputs = templateToTaskInputs(template);
      const taskRows = taskInputs.map((t) => ({
        routine_id: routineId,
        name: t.name,
        icon: t.icon ?? null,
        block: t.block ?? null,
        time_label: t.timeLabel ?? null,
        note: t.note ?? null,
        no_check: t.noCheck ?? false,
        schedule: t.schedule,
        assigned_to: null,
        position: t.position ?? 0,
      }));

      const { error: taskErr } = await supabase.from("tasks").insert(taskRows);
      if (taskErr) {
        setError(taskErr.message);
        return;
      }

      await fetchAll();
    },
    [groupId, fetchAll],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);
      if (err) {
        setError(err.message);
        return;
      }
      await fetchAll();
    },
    [fetchAll],
  );

  return {
    routines,
    loading,
    error,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addTask,
    updateTask,
    deleteTask,
    installTemplate,
  };
}
