"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Routine, RoutineTask, TaskInput } from "@/data/types";
import type { RoutineTemplate } from "@/data/templates";
import type { ToolResult } from "@/lib/operations/routines";
import * as ops from "@/lib/operations/routines";

// ── Read actions ────────────────────────────────────────────

export async function listRoutinesAction(
  groupId: string,
): Promise<ToolResult<Routine[]>> {
  const client = await createClient();
  return ops.listRoutines(client, groupId);
}

export async function getRoutineTasksAction(
  routineId: string,
): Promise<ToolResult<RoutineTask[]>> {
  const client = await createClient();
  return ops.getRoutineTasks(client, routineId);
}

// ── Mutation actions ────────────────────────────────────────

export async function createRoutineAction(
  groupId: string,
  name: string,
  description?: string,
): Promise<ToolResult<Routine>> {
  const client = await createClient();
  const result = await ops.createRoutine(client, { groupId, name, description });
  if (result.ok) revalidatePath("/");
  return result;
}

export async function updateRoutineAction(
  id: string,
  fields: Partial<Pick<Routine, "name" | "description">>,
): Promise<ToolResult<void>> {
  const client = await createClient();
  const result = await ops.updateRoutine(client, id, fields);
  if (result.ok) revalidatePath("/");
  return result;
}

export async function deleteRoutineAction(
  id: string,
): Promise<ToolResult<void>> {
  const client = await createClient();
  const result = await ops.deleteRoutine(client, id);
  if (result.ok) revalidatePath("/");
  return result;
}

export async function addTaskAction(
  routineId: string,
  input: TaskInput,
): Promise<ToolResult<RoutineTask>> {
  const client = await createClient();
  const result = await ops.addTask(client, routineId, input);
  if (result.ok) revalidatePath("/");
  return result;
}

export async function updateTaskAction(
  taskId: string,
  fields: Partial<TaskInput>,
): Promise<ToolResult<void>> {
  const client = await createClient();
  const result = await ops.updateTask(client, taskId, fields);
  if (result.ok) revalidatePath("/");
  return result;
}

export async function deleteTaskAction(
  taskId: string,
): Promise<ToolResult<void>> {
  const client = await createClient();
  const result = await ops.deleteTask(client, taskId);
  if (result.ok) revalidatePath("/");
  return result;
}

export async function installTemplateAction(
  groupId: string,
  template: RoutineTemplate,
): Promise<ToolResult<Routine>> {
  const client = await createClient();
  const result = await ops.installTemplate(client, groupId, template);
  if (result.ok) revalidatePath("/");
  return result;
}
