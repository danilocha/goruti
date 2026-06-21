import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Routine, RoutineTask } from "@/data/types";
import type { TaskInput } from "@/data/types";
import type { RoutineTemplate } from "@/data/templates";

// ── Hoisted mocks (before imports) ──────────────────────────

const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

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

// Import AFTER mocks
import * as actions from "../routines";
import * as ops from "@/lib/operations/routines";

// ── Fixtures ────────────────────────────────────────────────

const ROUTINE: Routine = { id: "r1", groupId: "g1", name: "Mañana", description: null, templateId: null };
const TASK: RoutineTask = {
  id: "t1", routineId: "r1", name: "Meditar", icon: null, block: "mañana",
  timeLabel: "07:00", note: null, noCheck: false,
  schedule: { type: "weekly", days: ["Lunes"] }, assignedTo: null, position: 0,
};

const TEMPLATE: RoutineTemplate = {
  id: "test", name: "Rutina", description: "Desc",
  category: "Test", icon: "🧪", tasks: [],
};

// ── Tests ───────────────────────────────────────────────────

describe("actions/routines — createRoutine", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls operation and revalidates on success", async () => {
    vi.mocked(ops.createRoutine).mockResolvedValue({ ok: true, data: ROUTINE });
    const result = await actions.createRoutineAction("g1", "Mañana");
    expect(ops.createRoutine).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(result.ok).toBe(true);
  });

  it("does NOT revalidate on error", async () => {
    vi.mocked(ops.createRoutine).mockResolvedValue({ ok: false, error: "DB error" });
    const result = await actions.createRoutineAction("g1", "Otra");
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});

describe("actions/routines — updateRoutine", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls operation and revalidates on success", async () => {
    vi.mocked(ops.updateRoutine).mockResolvedValue({ ok: true });
    const result = await actions.updateRoutineAction("r1", { name: "Nuevo" });
    expect(ops.updateRoutine).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(result.ok).toBe(true);
  });

  it("does NOT revalidate on error", async () => {
    vi.mocked(ops.updateRoutine).mockResolvedValue({ ok: false, error: "Fail" });
    const result = await actions.updateRoutineAction("r1", { name: "Nuevo" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});

describe("actions/routines — deleteRoutine", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls operation and revalidates on success", async () => {
    vi.mocked(ops.deleteRoutine).mockResolvedValue({ ok: true });
    const result = await actions.deleteRoutineAction("r1");
    expect(ops.deleteRoutine).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(result.ok).toBe(true);
  });

  it("does NOT revalidate on error", async () => {
    vi.mocked(ops.deleteRoutine).mockResolvedValue({ ok: false, error: "Fail" });
    const result = await actions.deleteRoutineAction("r1");
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});

describe("actions/routines — addTask", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls operation and revalidates on success", async () => {
    vi.mocked(ops.addTask).mockResolvedValue({ ok: true, data: TASK });
    const result = await actions.addTaskAction("r1", {
      name: "Meditar", schedule: { type: "weekly", days: ["Lunes"] },
    });
    expect(ops.addTask).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(result.ok).toBe(true);
  });

  it("does NOT revalidate on error", async () => {
    vi.mocked(ops.addTask).mockResolvedValue({ ok: false, error: "Fail" });
    const result = await actions.addTaskAction("r1", {
      name: "Meditar", schedule: { type: "weekly", days: ["Lunes"] },
    });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});

describe("actions/routines — updateTask", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls operation and revalidates on success", async () => {
    vi.mocked(ops.updateTask).mockResolvedValue({ ok: true });
    const result = await actions.updateTaskAction("t1", { name: "Nuevo" });
    expect(ops.updateTask).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(result.ok).toBe(true);
  });

  it("does NOT revalidate on error", async () => {
    vi.mocked(ops.updateTask).mockResolvedValue({ ok: false, error: "Fail" });
    const result = await actions.updateTaskAction("t1", { name: "Nuevo" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});

describe("actions/routines — deleteTask", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls operation and revalidates on success", async () => {
    vi.mocked(ops.deleteTask).mockResolvedValue({ ok: true });
    const result = await actions.deleteTaskAction("t1");
    expect(ops.deleteTask).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(result.ok).toBe(true);
  });

  it("does NOT revalidate on error", async () => {
    vi.mocked(ops.deleteTask).mockResolvedValue({ ok: false, error: "Fail" });
    const result = await actions.deleteTaskAction("t1");
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});

describe("actions/routines — installTemplate", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls operation and revalidates on success", async () => {
    vi.mocked(ops.installTemplate).mockResolvedValue({ ok: true, data: ROUTINE });
    const result = await actions.installTemplateAction("g1", TEMPLATE);
    expect(ops.installTemplate).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(result.ok).toBe(true);
  });

  it("does NOT revalidate on error", async () => {
    vi.mocked(ops.installTemplate).mockResolvedValue({ ok: false, error: "Fail" });
    const result = await actions.installTemplateAction("g1", TEMPLATE);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});

describe("actions/routines — listRoutines (read)", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls operation and does NOT revalidate", async () => {
    vi.mocked(ops.listRoutines).mockResolvedValue({ ok: true, data: [ROUTINE] });
    const result = await actions.listRoutinesAction("g1");
    expect(ops.listRoutines).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });
});

describe("actions/routines — getRoutineTasks (read)", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls operation and does NOT revalidate", async () => {
    vi.mocked(ops.getRoutineTasks).mockResolvedValue({ ok: true, data: [TASK] });
    const result = await actions.getRoutineTasksAction("r1");
    expect(ops.getRoutineTasks).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });
});
