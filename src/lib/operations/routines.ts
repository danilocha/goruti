import type { SupabaseClient } from "@supabase/supabase-js";
import type { Routine, RoutineTask, TaskInput, TaskSchedule } from "@/data/types";
import type { RoutineTemplate } from "@/data/templates";
import { templateToTaskInputs } from "@/data/templates";

// ── Tool result envelope ────────────────────────────────────

export type ToolResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: true }
  | { ok: false; error: string };

// ── Snake_case → camelCase mappers ──────────────────────────

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

// ── Read operations ─────────────────────────────────────────

export async function listRoutines(
  client: SupabaseClient,
  groupId: string,
): Promise<ToolResult<Routine[]>> {
  const { data, error } = await client
    .from("routines")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message };
  const routines: Routine[] = (data ?? []).map((r: DbRoutine) => mapRoutine(r));
  return { ok: true, data: routines };
}

export async function getRoutineTasks(
  client: SupabaseClient,
  routineId: string,
): Promise<ToolResult<RoutineTask[]>> {
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("routine_id", routineId)
    .order("position", { ascending: true });

  if (error) return { ok: false, error: error.message };
  const tasks: RoutineTask[] = (data ?? []).map((t: DbTask) => mapTask(t));
  return { ok: true, data: tasks };
}

// ── Mutation operations ─────────────────────────────────────

export async function createRoutine(
  client: SupabaseClient,
  input: { groupId: string; name: string; description?: string },
): Promise<ToolResult<Routine>> {
  const { data, error } = await client
    .from("routines")
    .insert({
      group_id: input.groupId,
      name: input.name,
      description: input.description ?? null,
    })
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No se pudo crear la rutina" };

  const routine: Routine = {
    id: data.id,
    groupId: data.group_id,
    name: data.name,
    description: data.description,
    templateId: data.template_id,
  };
  return { ok: true, data: routine };
}

export async function updateRoutine(
  client: SupabaseClient,
  id: string,
  fields: Partial<Pick<Routine, "name" | "description">>,
): Promise<ToolResult<void>> {
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.description !== undefined) update.description = fields.description;

  const { error } = await client.from("routines").update(update).eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteRoutine(
  client: SupabaseClient,
  id: string,
): Promise<ToolResult<void>> {
  const { error } = await client.from("routines").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function addTask(
  client: SupabaseClient,
  routineId: string,
  input: TaskInput,
): Promise<ToolResult<RoutineTask>> {
  const { data, error } = await client
    .from("tasks")
    .insert({
      routine_id: routineId,
      name: input.name,
      icon: input.icon ?? null,
      block: input.block ?? null,
      time_label: input.timeLabel ?? null,
      note: input.note ?? null,
      no_check: input.noCheck ?? false,
      schedule: input.schedule,
      assigned_to: null,
      position: input.position ?? 0,
    })
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No se pudo crear la tarea" };

  const task: RoutineTask = {
    id: data.id,
    routineId: data.routine_id,
    name: data.name,
    icon: data.icon,
    block: data.block,
    timeLabel: data.time_label,
    note: data.note,
    noCheck: data.no_check,
    schedule: data.schedule,
    assignedTo: data.assigned_to,
    position: data.position,
  };
  return { ok: true, data: task };
}

export async function updateTask(
  client: SupabaseClient,
  taskId: string,
  fields: Partial<TaskInput>,
): Promise<ToolResult<void>> {
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.icon !== undefined) update.icon = fields.icon;
  if (fields.block !== undefined) update.block = fields.block;
  if (fields.timeLabel !== undefined) update.time_label = fields.timeLabel;
  if (fields.note !== undefined) update.note = fields.note;
  if (fields.noCheck !== undefined) update.no_check = fields.noCheck;
  if (fields.schedule !== undefined) update.schedule = fields.schedule;
  if (fields.position !== undefined) update.position = fields.position;

  const { error } = await client.from("tasks").update(update).eq("id", taskId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteTask(
  client: SupabaseClient,
  taskId: string,
): Promise<ToolResult<void>> {
  const { error } = await client.from("tasks").delete().eq("id", taskId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function installTemplate(
  client: SupabaseClient,
  groupId: string,
  template: RoutineTemplate,
): Promise<ToolResult<Routine>> {
  // 1. Insert the routine
  const { data: routineRow, error: routineErr } = await client
    .from("routines")
    .insert({
      group_id: groupId,
      name: template.name,
      description: template.description,
      template_id: null,
    })
    .select("*")
    .single();

  if (routineErr || !routineRow) {
    return { ok: false, error: routineErr?.message ?? "Error creando rutina desde plantilla" };
  }

  const routine: Routine = {
    id: routineRow.id,
    groupId: routineRow.group_id,
    name: routineRow.name,
    description: routineRow.description,
    templateId: routineRow.template_id,
  };

  // 2. Bulk-insert tasks
  const taskInputs = templateToTaskInputs(template);
  const taskRows = taskInputs.map((t) => ({
    routine_id: routine.id,
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

  const { error: taskErr } = await client.from("tasks").insert(taskRows);
  if (taskErr) {
    return { ok: false, error: taskErr.message };
  }

  return { ok: true, data: routine };
}
