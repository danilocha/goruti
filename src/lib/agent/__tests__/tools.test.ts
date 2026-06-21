import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ───────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/operations/routines", () => {
  const ops: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "listRoutines", "getRoutineTasks", "createRoutine", "updateRoutine",
    "deleteRoutine", "addTask", "updateTask", "deleteTask", "installTemplate",
  ];
  for (const m of methods) {
    ops[m] = vi.fn();
  }
  return ops;
});

vi.mock("@/lib/actions/routines", () => {
  const acts: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "listRoutinesAction", "getRoutineTasksAction",
    "createRoutineAction", "updateRoutineAction", "deleteRoutineAction",
    "addTaskAction", "updateTaskAction", "deleteTaskAction", "installTemplateAction",
  ];
  for (const m of methods) {
    acts[m] = vi.fn();
  }
  return acts;
});

// Import AFTER mocks
import * as tools from "../tools";
import * as ops from "@/lib/operations/routines";
import * as actions from "@/lib/actions/routines";
import type { Routine, RoutineTask } from "@/data/types";

// ── Helpers ─────────────────────────────────────────────────

type ToolWithExecute = { execute: (args: Record<string, unknown>, opts: unknown) => Promise<unknown> };

function exec(t: unknown, args: Record<string, unknown>) {
  return (t as ToolWithExecute).execute(args, {});
}

function toolParams(t: unknown) {
  return (t as { inputSchema: { safeParse: (d: unknown) => { success: boolean } } }).inputSchema;
}

// ── Fixtures ────────────────────────────────────────────────

const ROUTINE: Routine = { id: "r1", groupId: "g1", name: "Mañana", description: null, templateId: null };
const TASK: RoutineTask = {
  id: "t1", routineId: "r1", name: "Meditar", icon: null, block: "mañana",
  timeLabel: "07:00", note: null, noCheck: false,
  schedule: { type: "weekly", days: ["Lunes"] }, assignedTo: null, position: 0,
};

// ── Tests ───────────────────────────────────────────────────

describe("tools — destructive tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("deleteRoutineTool has no execute (HITL pattern)", () => {
    expect(tools.deleteRoutineTool.description).toContain("Delete");
    expect((tools.deleteRoutineTool as unknown as ToolWithExecute).execute).toBeUndefined();
  });

  it("deleteTaskTool has no execute (HITL pattern)", () => {
    expect(tools.deleteTaskTool.description).toContain("Delete");
    expect((tools.deleteTaskTool as unknown as ToolWithExecute).execute).toBeUndefined();
  });

  it("deleteRoutineTool validates routineId is a string", () => {
    const p = toolParams(tools.deleteRoutineTool);
    expect(p.safeParse({ routineId: 123 }).success).toBe(false);
    expect(p.safeParse({ routineId: "r1" }).success).toBe(true);
  });
});

describe("tools — listRoutinesTool", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("is a read tool — has execute", () => {
    expect((tools.listRoutinesTool as unknown as ToolWithExecute).execute).toBeDefined();
  });

  it("returns routines from operation", async () => {
    vi.mocked(ops.listRoutines).mockResolvedValue({ ok: true, data: [ROUTINE] });
    const result = await exec(tools.listRoutinesTool, { groupId: "g1" });
    expect(result).toEqual({ ok: true, data: [ROUTINE] });
  });

  it("returns error envelope on failure", async () => {
    vi.mocked(ops.listRoutines).mockResolvedValue({ ok: false, error: "DB error" });
    const result = await exec(tools.listRoutinesTool, { groupId: "g1" });
    expect(result).toEqual({ ok: false, error: "DB error" });
  });

  it("validates groupId is a string", () => {
    const p = toolParams(tools.listRoutinesTool);
    expect(p.safeParse({ groupId: "" }).success).toBe(false);
    expect(p.safeParse({ groupId: "g1" }).success).toBe(true);
  });
});

describe("tools — getRoutineTasksTool", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns tasks from operation", async () => {
    vi.mocked(ops.getRoutineTasks).mockResolvedValue({ ok: true, data: [TASK] });
    const result = await exec(tools.getRoutineTasksTool, { routineId: "r1" });
    expect(result).toEqual({ ok: true, data: [TASK] });
  });

  it("returns error on not-found", async () => {
    vi.mocked(ops.getRoutineTasks).mockResolvedValue({ ok: false, error: "routine 'X' not found" });
    const result = await exec(tools.getRoutineTasksTool, { routineId: "nonexistent" });
    expect(result).toEqual({ ok: false, error: "routine 'X' not found" });
  });

  it("validates routineId is a string", () => {
    const p = toolParams(tools.getRoutineTasksTool);
    expect(p.safeParse({ routineId: 123 }).success).toBe(false);
  });
});

describe("tools — createRoutineTool", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls server action and returns result", async () => {
    vi.mocked(actions.createRoutineAction).mockResolvedValue({ ok: true, data: ROUTINE });
    const result = await exec(tools.createRoutineTool, { groupId: "g1", name: "Mañana" });
    expect(actions.createRoutineAction).toHaveBeenCalledWith("g1", "Mañana", undefined);
    expect(result).toEqual({ ok: true, data: ROUTINE });
  });
});

describe("tools — addTaskTool", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls server action with schedule", async () => {
    vi.mocked(actions.addTaskAction).mockResolvedValue({ ok: true, data: TASK });
    const result = await exec(tools.addTaskTool, {
      routineId: "r1", name: "Meditar",
      schedule: { type: "weekly", days: ["Lunes"] },
    });
    expect(actions.addTaskAction).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, data: TASK });
  });
});

describe("tools — updateRoutineTool", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls server action with optional fields", async () => {
    vi.mocked(actions.updateRoutineAction).mockResolvedValue({ ok: true });
    const result = await exec(tools.updateRoutineTool, { routineId: "r1", name: "Nuevo" });
    expect(actions.updateRoutineAction).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it("validates at least routineId is required", () => {
    const p = toolParams(tools.updateRoutineTool);
    expect(p.safeParse({ routineId: "r1" }).success).toBe(true);
  });
});

describe("tools — updateTaskTool", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls server action", async () => {
    vi.mocked(actions.updateTaskAction).mockResolvedValue({ ok: true });
    const result = await exec(tools.updateTaskTool, { taskId: "t1", name: "Nuevo" });
    expect(actions.updateTaskAction).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });
});

describe("tools — installTemplateTool", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls server action", async () => {
    vi.mocked(actions.installTemplateAction).mockResolvedValue({ ok: true, data: ROUTINE });
    const result = await exec(tools.installTemplateTool, {
      groupId: "g1", templateId: "pareja",
    });
    expect(actions.installTemplateAction).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, data: ROUTINE });
  });
});
