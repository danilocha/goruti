import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import * as ops from "@/lib/operations/routines";
import * as actions from "@/lib/actions/routines";
import type { TaskInput } from "@/data/types";

// ── Helper: create server client for read tools ─────────────

async function getClient() {
  return await createClient();
}

// ── Parameter schemas ───────────────────────────────────────

const listRoutinesSchema = z.object({
  groupId: z.string().min(1, "groupId is required"),
});

const getRoutineTasksSchema = z.object({
  routineId: z.string().min(1, "routineId is required"),
});

const createRoutineSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
});

const updateRoutineSchema = z.object({
  routineId: z.string().min(1, "routineId is required"),
  name: z.string().optional(),
  description: z.string().optional().nullable(),
});

const addTaskSchema = z.object({
  routineId: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().optional().nullable(),
  block: z.string().optional().nullable(),
  timeLabel: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  noCheck: z.boolean().optional(),
  schedule: z.object({
    type: z.literal("weekly"),
    days: z.array(z.string().min(1)).min(1, "At least one day is required"),
  }),
  position: z.number().int().optional(),
});

const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  name: z.string().optional(),
  icon: z.string().optional().nullable(),
  block: z.string().optional().nullable(),
  timeLabel: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  noCheck: z.boolean().optional(),
  schedule: z.object({
    type: z.literal("weekly"),
    days: z.array(z.string().min(1)),
  }).optional(),
  position: z.number().int().optional(),
});

const installTemplateSchema = z.object({
  groupId: z.string().min(1),
  templateId: z.string().min(1, "templateId is required"),
  groupName: z.string().optional().describe("Human-readable group name for disambiguation"),
});

const deleteRoutineSchema = z.object({
  routineId: z.string().min(1, "routineId is required"),
});

const deleteTaskSchema = z.object({
  taskId: z.string().min(1, "taskId is required"),
});

// ── Helper: wrap tool creation with cast for type compat ────

function createTool<T extends Record<string, unknown>>(
  description: string,
  parameters: z.ZodObject<z.ZodRawShape>,
  execute?: (args: T) => unknown,
) {
  const def: {
    description: string;
    parameters: z.ZodObject<z.ZodRawShape>;
    execute?: (args: T) => unknown;
  } = {
    description,
    parameters,
  };
  if (execute) def.execute = execute;
  return def as unknown as ReturnType<typeof tool>;
}

// ── Read tools ──────────────────────────────────────────────

export const listRoutinesTool = createTool<{ groupId: string }>(
  "List all routines for the active group",
  listRoutinesSchema,
  async ({ groupId }) => {
    const client = await getClient();
    return ops.listRoutines(client, groupId);
  },
);

export const getRoutineTasksTool = createTool<{ routineId: string }>(
  "Get all tasks for a specific routine",
  getRoutineTasksSchema,
  async ({ routineId }) => {
    const client = await getClient();
    return ops.getRoutineTasks(client, routineId);
  },
);

// ── Mutation tools (call server actions) ────────────────────

export const createRoutineTool = createTool<{ groupId: string; name: string; description?: string }>(
  "Create a new routine with a name and optional description",
  createRoutineSchema,
  async ({ groupId, name, description }) => {
    return actions.createRoutineAction(groupId, name, description);
  },
);

export const updateRoutineTool = createTool<{ routineId: string; name?: string; description?: string | null }>(
  "Update a routine's name or description",
  updateRoutineSchema,
  async ({ routineId, name, description }) => {
    const fields: Record<string, unknown> = {};
    if (name !== undefined) fields.name = name;
    if (description !== undefined) fields.description = description;
    return actions.updateRoutineAction(routineId, fields);
  },
);

export const addTaskTool = createTool(
  "Add a task to a routine with a name and weekly schedule",
  addTaskSchema,
  async (params) => {
    const { routineId, ...input } = params as { routineId: string } & Record<string, unknown>;
    return actions.addTaskAction(routineId, input as unknown as TaskInput);
  },
);

export const updateTaskTool = createTool(
  "Update a task's fields",
  updateTaskSchema,
  async (params) => {
    const { taskId, ...fields } = params as { taskId: string } & Record<string, unknown>;
    return actions.updateTaskAction(taskId, fields as Partial<TaskInput>);
  },
);

export const installTemplateTool = createTool<{ groupId: string; templateId: string }>(
  "Install a pre-defined template routine. The groupName param lets the user choose which group to install into when they have multiple groups.",
  installTemplateSchema,
  async ({ groupId, templateId }) => {
    const { CURATED_TEMPLATES } = await import("@/data/templates");
    const template = CURATED_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return { ok: false as const, error: `template '${templateId}' not found` };
    }
    return actions.installTemplateAction(groupId, template);
  },
);

// ── Destructive tools (no execute — HITL pattern) ───────────

export const deleteRoutineTool = createTool(
  "Delete a routine permanently. Requires user confirmation.",
  deleteRoutineSchema,
);

export const deleteTaskTool = createTool(
  "Delete a task permanently. Requires user confirmation.",
  deleteTaskSchema,
);
