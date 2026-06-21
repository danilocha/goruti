import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Routine, RoutineTask, TaskSchedule } from "@/data/types";
import * as ops from "../routines";

// ── Mock Supabase chain builder ─────────────────────────────

type QueryResult = { data: unknown; error: null | { message: string } };

function chainMock(terminal: () => QueryResult | Promise<QueryResult>) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "order",
    "single",
    "maybeSingle",
    "returns",
    "abortSignal",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // Terminal `.then()` for promise-like chain
  (chain as unknown as { then: unknown }).then = (
    resolve: (v: QueryResult) => void,
  ) => {
    Promise.resolve(terminal()).then(resolve);
  };
  return chain as unknown as ReturnType<typeof vi.fn> & { then: unknown };
}

function makeSupabaseMock() {
  const results = new Map<string, QueryResult>();
  let lastTable = "";

  const from = vi.fn((table: string) => {
    lastTable = table;
    const ch = chainMock(() => results.get(lastTable) ?? { data: null, error: null });
    return ch;
  });

  const mock = {
    from,
    rpc: vi.fn(),
    // Set a canned result for the most recent `from()` call
    _setResult: (table: string, result: QueryResult) => {
      results.set(table, result);
    },
  };

  return mock;
}

// ── Fixtures ────────────────────────────────────────────────

// These are snake_case as Supabase returns them
const DB_ROUTINES = [
  { id: "r1", group_id: "g1", name: "Mañana", description: null, template_id: null },
  { id: "r2", group_id: "g1", name: "Noche", description: null, template_id: null },
];

const SCHEDULE: TaskSchedule = { type: "weekly", days: ["Lunes", "Miércoles"] };

const DB_TASKS = [
  {
    id: "t1",
    routine_id: "r1",
    name: "Meditar",
    icon: null,
    block: "mañana",
    time_label: "07:00",
    note: null,
    no_check: false,
    schedule: SCHEDULE,
    assigned_to: null,
    position: 0,
  },
  {
    id: "t2",
    routine_id: "r1",
    name: "Desayunar",
    icon: null,
    block: "mañana",
    time_label: "08:00",
    note: null,
    no_check: false,
    schedule: SCHEDULE,
    assigned_to: null,
    position: 1,
  },
];

// ── Tests ───────────────────────────────────────────────────

describe("operations/routines — listRoutines", () => {
  let mock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mock = makeSupabaseMock();
  });

  it("returns routines for a given group", async () => {
    mock._setResult("routines", { data: DB_ROUTINES, error: null });
    const result = await ops.listRoutines(mock as unknown as SupabaseClient, "g1");
    expect(result.ok).toBe(true);
    if (result.ok && "data" in result) {
      expect(result.data).toEqual([
        { id: "r1", groupId: "g1", name: "Mañana", description: null, templateId: null },
        { id: "r2", groupId: "g1", name: "Noche", description: null, templateId: null },
      ]);
    }
    expect(mock.from).toHaveBeenCalledWith("routines");
  });

  it("returns empty array when no routines exist", async () => {
    mock._setResult("routines", { data: [], error: null });
    const result = await ops.listRoutines(mock as unknown as SupabaseClient, "g1");
    expect(result.ok).toBe(true);
    if (result.ok && "data" in result) {
      expect(result.data).toEqual([]);
    }
  });

  it("returns ToolResult error on failure", async () => {
    mock._setResult("routines", { data: null, error: { message: "DB error" } });
    const result = await ops.listRoutines(mock as unknown as SupabaseClient, "g1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("DB error");
    }
  });
});

describe("operations/routines — getRoutineTasks", () => {
  let mock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mock = makeSupabaseMock();
  });

  it("returns tasks for a routine", async () => {
    mock._setResult("tasks", { data: DB_TASKS, error: null });
    const result = await ops.getRoutineTasks(mock as unknown as SupabaseClient, "r1");
    expect(result.ok).toBe(true);
    if (result.ok && "data" in result) {
      expect(result.data).toEqual([
        { id: "t1", routineId: "r1", name: "Meditar", icon: null, block: "mañana", timeLabel: "07:00", note: null, noCheck: false, schedule: SCHEDULE, assignedTo: null, position: 0 },
        { id: "t2", routineId: "r1", name: "Desayunar", icon: null, block: "mañana", timeLabel: "08:00", note: null, noCheck: false, schedule: SCHEDULE, assignedTo: null, position: 1 },
      ]);
    }
    expect(mock.from).toHaveBeenCalledWith("tasks");
  });

  it("returns empty array when routine has no tasks", async () => {
    mock._setResult("tasks", { data: [], error: null });
    const result = await ops.getRoutineTasks(mock as unknown as SupabaseClient, "r1");
    expect(result.ok).toBe(true);
    if (result.ok && "data" in result) {
      expect(result.data).toEqual([]);
    }
  });

  it("returns ToolResult error on failure", async () => {
    mock._setResult("tasks", { data: null, error: { message: "Not found" } });
    const result = await ops.getRoutineTasks(mock as unknown as SupabaseClient, "nonexistent");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Not found");
    }
  });
});

describe("operations/routines — createRoutine", () => {
  let mock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mock = makeSupabaseMock();
  });

  it("creates and returns the new routine", async () => {
    // Supabase returns snake_case
    const dbRow = { id: "r3", group_id: "g1", name: "Tarde", description: null, template_id: null };
    mock._setResult("routines", { data: dbRow, error: null });
    const result = await ops.createRoutine(mock as unknown as SupabaseClient, {
      groupId: "g1",
      name: "Tarde",
    });
    expect(result.ok).toBe(true);
    if (result.ok && "data" in result) {
      expect(result.data).toEqual({
        id: "r3",
        groupId: "g1",
        name: "Tarde",
        description: null,
        templateId: null,
      });
    }
    expect(mock.from).toHaveBeenCalledWith("routines");
  });

  it("returns ToolResult error on failure", async () => {
    mock._setResult("routines", { data: null, error: { message: "Insert failed" } });
    const result = await ops.createRoutine(mock as unknown as SupabaseClient, {
      groupId: "g1",
      name: "Tarde",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Insert failed");
    }
  });
});

describe("operations/routines — updateRoutine", () => {
  let mock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mock = makeSupabaseMock();
  });

  it("updates and returns ok", async () => {
    mock._setResult("routines", { data: null, error: null });
    const result = await ops.updateRoutine(mock as unknown as SupabaseClient, "r1", {
      name: "Mañana actualizado",
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ToolResult error on failure", async () => {
    mock._setResult("routines", { data: null, error: { message: "Update failed" } });
    const result = await ops.updateRoutine(mock as unknown as SupabaseClient, "r1", {
      name: "Mañana",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Update failed");
    }
  });
});

describe("operations/routines — deleteRoutine", () => {
  let mock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mock = makeSupabaseMock();
  });

  it("deletes and returns ok", async () => {
    mock._setResult("routines", { data: null, error: null });
    const result = await ops.deleteRoutine(mock as unknown as SupabaseClient, "r1");
    expect(result).toEqual({ ok: true });
  });

  it("returns ToolResult error on failure", async () => {
    mock._setResult("routines", { data: null, error: { message: "Delete failed" } });
    const result = await ops.deleteRoutine(mock as unknown as SupabaseClient, "r1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Delete failed");
    }
  });
});

describe("operations/routines — addTask", () => {
  let mock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mock = makeSupabaseMock();
  });

  it("adds a task and returns it", async () => {
    // Supabase returns snake_case
    const dbRow = {
      id: "t3",
      routine_id: "r1",
      name: "Nueva tarea",
      icon: null,
      block: "tarde",
      time_label: "15:00",
      note: null,
      no_check: false,
      schedule: { type: "weekly", days: ["Lunes"] },
      assigned_to: null,
      position: 2,
    };
    mock._setResult("tasks", { data: dbRow, error: null });
    const result = await ops.addTask(mock as unknown as SupabaseClient, "r1", {
      name: "Nueva tarea",
      schedule: { type: "weekly", days: ["Lunes"] },
    });
    expect(result.ok).toBe(true);
    if (result.ok && "data" in result) {
      expect(result.data).toEqual({
        id: "t3",
        routineId: "r1",
        name: "Nueva tarea",
        icon: null,
        block: "tarde",
        timeLabel: "15:00",
        note: null,
        noCheck: false,
        schedule: { type: "weekly", days: ["Lunes"] },
        assignedTo: null,
        position: 2,
      });
    }
    expect(mock.from).toHaveBeenCalledWith("tasks");
  });

  it("returns ToolResult error on failure", async () => {
    mock._setResult("tasks", { data: null, error: { message: "Insert failed" } });
    const result = await ops.addTask(mock as unknown as SupabaseClient, "r1", {
      name: "Nueva tarea",
      schedule: { type: "weekly", days: ["Lunes"] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Insert failed");
    }
  });
});

describe("operations/routines — updateTask", () => {
  let mock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mock = makeSupabaseMock();
  });

  it("updates and returns ok", async () => {
    mock._setResult("tasks", { data: null, error: null });
    const result = await ops.updateTask(mock as unknown as SupabaseClient, "t1", {
      name: "Tarea actualizada",
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ToolResult error on failure", async () => {
    mock._setResult("tasks", { data: null, error: { message: "Update failed" } });
    const result = await ops.updateTask(mock as unknown as SupabaseClient, "t1", {
      name: "Tarea",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Update failed");
    }
  });
});

describe("operations/routines — deleteTask", () => {
  let mock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mock = makeSupabaseMock();
  });

  it("deletes and returns ok", async () => {
    mock._setResult("tasks", { data: null, error: null });
    const result = await ops.deleteTask(mock as unknown as SupabaseClient, "t1");
    expect(result).toEqual({ ok: true });
  });

  it("returns ToolResult error on failure", async () => {
    mock._setResult("tasks", { data: null, error: { message: "Delete failed" } });
    const result = await ops.deleteTask(mock as unknown as SupabaseClient, "t1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Delete failed");
    }
  });
});

describe("operations/routines — installTemplate", () => {
  let mock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    mock = makeSupabaseMock();
  });

  it("creates routine and bulk-inserts tasks", async () => {
    const routinesResult = { data: { id: "r3", group_id: "g1", name: "Rutina", description: "Desc", template_id: null }, error: null };
    const tasksResult = { data: null, error: null };
    let callCount = 0;
    mock.from = vi.fn((table: string) => {
      callCount++;
      if (table === "routines") {
        return chainMock(() => routinesResult);
      }
      return chainMock(() => tasksResult);
    });

    const result = await ops.installTemplate(
      mock as unknown as SupabaseClient,
      "g1",
      {
        id: "test-template",
        name: "Rutina",
        description: "Desc",
        category: "Test",
        icon: "🧪",
        tasks: [
          { name: "Task 1", icon: "☀️", block: null, timeLabel: "07:00", days: ["Lunes"] },
        ],
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok && "data" in result && result.data) {
      expect((result.data as Routine).id).toBe("r3");
    }
    // Should have called from for both routines and tasks
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it("returns error when routine insert fails", async () => {
    mock._setResult("routines", { data: null, error: { message: "Insert failed" } });
    const result = await ops.installTemplate(
      mock as unknown as SupabaseClient,
      "g1",
      {
        id: "test-template",
        name: "Rutina",
        description: "Desc",
        category: "Test",
        icon: "🧪",
        tasks: [
          { name: "Task 1", icon: "☀️", block: null, timeLabel: "07:00", days: ["Lunes"] },
        ],
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Insert failed");
    }
  });
});
