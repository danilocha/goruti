import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Completion } from "@/data/types";

// ── Mock Supabase browser client ──────────────────────────────────────────────
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockEq = vi.fn();

// Chainable mock builder
function makeQueryMock(terminalFn: () => Promise<{ error: null | { message: string } }>) {
  const chain: Record<string, unknown> = {};
  const methods = ["eq", "in", "select", "single", "maybeSingle"];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // terminal
  (chain as Record<string, unknown>).then = (
    resolve: (v: { error: null | { message: string } }) => void,
  ) => {
    terminalFn().then(resolve);
  };
  return chain;
}

const mockFrom = vi.fn();

// Minimal channel stub so useEffect realtime subscription does not crash.
const mockChannelSubscribe = vi.fn().mockReturnValue({});
const mockChannelOn = vi.fn();
const mockChannel = vi.fn(() => ({
  on: (..._args: unknown[]) => ({ subscribe: mockChannelSubscribe }),
}));
const mockRemoveChannel = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
      }),
    },
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  })),
}));

// Import AFTER vi.mock
import { useCompletions } from "../useCompletions";

// ── Test helpers ──────────────────────────────────────────────────────────────

const TODAY = "2026-06-20";

// tasks now carry routineId (needed for task_completions.routine_id + RLS)
const t = (id: string) => ({ id, routineId: "routine-1" });

const makeCompletion = (taskId: string): Completion => ({
  id: `comp-${taskId}`,
  routineId: "routine-1",
  taskId,
  userId: "user-123",
  completedDate: TODAY,
  completedAt: new Date().toISOString(),
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useCompletions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: upsert succeeds, delete succeeds
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }),
    });
  });

  it("initialises checked set from initial completions prop", () => {
    const initial: Completion[] = [makeCompletion("task-1"), makeCompletion("task-2")];

    const { result } = renderHook(() =>
      useCompletions([t("task-1"), t("task-2"), t("task-3")], TODAY, initial),
    );

    expect(result.current.isChecked("task-1")).toBe(true);
    expect(result.current.isChecked("task-2")).toBe(true);
    expect(result.current.isChecked("task-3")).toBe(false);
  });

  it("isChecked returns false for a task not in initial completions", () => {
    const { result } = renderHook(() =>
      useCompletions([t("task-x")], TODAY, []),
    );

    expect(result.current.isChecked("task-x")).toBe(false);
  });

  it("toggle: sets checked state to true immediately when task is unchecked", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    const { result } = renderHook(() =>
      useCompletions([t("task-1")], TODAY,[]),
    );

    expect(result.current.isChecked("task-1")).toBe(false);

    await act(async () => {
      await result.current.toggle("task-1");
    });

    expect(result.current.isChecked("task-1")).toBe(true);
  });

  it("toggle: calls supabase upsert with correct task_id and completed_date when task is unchecked", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    const { result } = renderHook(() =>
      useCompletions([t("task-1")], TODAY,[]),
    );

    await act(async () => {
      result.current.toggle("task-1");
    });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        task_id: "task-1",
        routine_id: "routine-1",
        completed_date: TODAY,
      }),
      expect.anything(),
    );
  });

  it("toggle: calls supabase delete when task was already checked", async () => {
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ delete: deleteMock });

    const initial: Completion[] = [makeCompletion("task-1")];

    const { result } = renderHook(() =>
      useCompletions([t("task-1")], TODAY,initial),
    );

    expect(result.current.isChecked("task-1")).toBe(true);

    await act(async () => {
      result.current.toggle("task-1");
    });

    expect(deleteMock).toHaveBeenCalled();
  });

  it("rollback: reverts optimistic state when upsert throws", async () => {
    const upsertMock = vi
      .fn()
      .mockResolvedValue({ error: { message: "DB error" } });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    const { result } = renderHook(() =>
      useCompletions([t("task-1")], TODAY,[]),
    );

    await act(async () => {
      result.current.toggle("task-1");
    });

    // Should have rolled back to unchecked
    expect(result.current.isChecked("task-1")).toBe(false);
  });

  it("rollback: reverts optimistic state when delete throws", async () => {
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ delete: deleteMock });

    const initial: Completion[] = [makeCompletion("task-1")];

    const { result } = renderHook(() =>
      useCompletions([t("task-1")], TODAY,initial),
    );

    expect(result.current.isChecked("task-1")).toBe(true);

    await act(async () => {
      result.current.toggle("task-1");
    });

    // Should have rolled back to checked
    expect(result.current.isChecked("task-1")).toBe(true);
  });

  it("error signal: exposes failedTaskId when upsert fails", async () => {
    const upsertMock = vi
      .fn()
      .mockResolvedValue({ error: { message: "DB error" } });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    const { result } = renderHook(() =>
      useCompletions([t("task-1")], TODAY,[]),
    );

    expect(result.current.failedTaskId).toBeNull();

    await act(async () => {
      await result.current.toggle("task-1");
    });

    expect(result.current.failedTaskId).toBe("task-1");
  });

  it("error signal: exposes failedTaskId when delete fails", async () => {
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ delete: deleteMock });

    const initial: Completion[] = [makeCompletion("task-1")];

    const { result } = renderHook(() =>
      useCompletions([t("task-1")], TODAY,initial),
    );

    expect(result.current.failedTaskId).toBeNull();

    await act(async () => {
      await result.current.toggle("task-1");
    });

    expect(result.current.failedTaskId).toBe("task-1");
  });

  it("error signal: clears failedTaskId on a subsequent successful toggle", async () => {
    // First toggle: fail
    const upsertMock = vi
      .fn()
      .mockResolvedValueOnce({ error: { message: "DB error" } })
      .mockResolvedValueOnce({ error: null });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    const { result } = renderHook(() =>
      useCompletions([t("task-1")], TODAY,[]),
    );

    await act(async () => {
      await result.current.toggle("task-1");
    });

    expect(result.current.failedTaskId).toBe("task-1");

    // Second toggle: succeed — error should clear
    await act(async () => {
      await result.current.toggle("task-1");
    });

    expect(result.current.failedTaskId).toBeNull();
  });
});
