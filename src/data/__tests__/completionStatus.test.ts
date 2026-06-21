import { describe, it, expect } from "vitest";
import {
  buildCompletionMap,
  memberStatusForTask,
  applyCompletionEvent,
} from "../completionStatus";
import type { Completion } from "../types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mkCompletion = (taskId: string, userId: string): Completion => ({
  id: `${taskId}-${userId}`,
  routineId: "routine-1",
  taskId,
  userId,
  completedDate: "2026-06-20",
  completedAt: "2026-06-20T08:00:00Z",
});

const members = [
  { userId: "user-a", displayName: "Ana", role: "owner" as const },
  { userId: "user-b", displayName: "Daniel", role: "member" as const },
];

// ── buildCompletionMap ────────────────────────────────────────────────────────

describe("buildCompletionMap", () => {
  it("returns an empty map when completions is empty", () => {
    const result = buildCompletionMap([]);
    expect(result.size).toBe(0);
  });

  it("maps a single completion to its taskId → set of userIds", () => {
    const completions = [mkCompletion("task-1", "user-a")];
    const result = buildCompletionMap(completions);
    expect(result.get("task-1")).toEqual(new Set(["user-a"]));
  });

  it("groups multiple completions for the same task", () => {
    const completions = [
      mkCompletion("task-1", "user-a"),
      mkCompletion("task-1", "user-b"),
    ];
    const result = buildCompletionMap(completions);
    expect(result.get("task-1")).toEqual(new Set(["user-a", "user-b"]));
  });

  it("handles completions for different tasks independently", () => {
    const completions = [
      mkCompletion("task-1", "user-a"),
      mkCompletion("task-2", "user-b"),
    ];
    const result = buildCompletionMap(completions);
    expect(result.get("task-1")).toEqual(new Set(["user-a"]));
    expect(result.get("task-2")).toEqual(new Set(["user-b"]));
  });

  it("deduplicates duplicate entries for same task + user", () => {
    const completions = [
      mkCompletion("task-1", "user-a"),
      mkCompletion("task-1", "user-a"),
    ];
    const result = buildCompletionMap(completions);
    expect(result.get("task-1")?.size).toBe(1);
  });
});

// ── memberStatusForTask ───────────────────────────────────────────────────────

describe("memberStatusForTask", () => {
  it("returns one entry per member", () => {
    const result = memberStatusForTask("task-1", members, new Set());
    expect(result).toHaveLength(2);
  });

  it("marks member as done when their userId is in completedUserIds", () => {
    const completedUserIds = new Set(["user-a"]);
    const result = memberStatusForTask("task-1", members, completedUserIds);

    const ana = result.find((r) => r.userId === "user-a");
    const daniel = result.find((r) => r.userId === "user-b");

    expect(ana?.done).toBe(true);
    expect(daniel?.done).toBe(false);
  });

  it("passes through displayName from the member", () => {
    const result = memberStatusForTask("task-1", members, new Set(["user-a"]));
    expect(result.find((r) => r.userId === "user-a")?.displayName).toBe("Ana");
    expect(result.find((r) => r.userId === "user-b")?.displayName).toBe("Daniel");
  });

  it("handles null displayName gracefully", () => {
    const membersWithNull = [{ userId: "user-x", displayName: null, role: "member" as const }];
    const result = memberStatusForTask("task-1", membersWithNull, new Set());
    expect(result[0].displayName).toBeNull();
  });

  it("returns empty array when members is empty", () => {
    const result = memberStatusForTask("task-1", [], new Set(["user-a"]));
    expect(result).toHaveLength(0);
  });

  it("marks all members done when all are in completedUserIds", () => {
    const completedUserIds = new Set(["user-a", "user-b"]);
    const result = memberStatusForTask("task-1", members, completedUserIds);
    expect(result.every((r) => r.done)).toBe(true);
  });
});

// ── applyCompletionEvent ──────────────────────────────────────────────────────

describe("applyCompletionEvent", () => {
  const base: Completion = {
    id: "comp-1",
    routineId: "routine-1",
    taskId: "task-1",
    userId: "user-b",
    completedDate: "2026-06-20",
    completedAt: "2026-06-20T08:00:00Z",
  };

  it("INSERT: adds a new completion to the array", () => {
    const result = applyCompletionEvent([], { kind: "INSERT", row: base });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(base);
  });

  it("INSERT: is a no-op when a completion with the same id already exists (dedupe)", () => {
    const existing = [base];
    const result = applyCompletionEvent(existing, { kind: "INSERT", row: base });
    expect(result).toHaveLength(1);
  });

  it("DELETE: removes the completion whose id matches event.row.id", () => {
    const existing = [base, { ...base, id: "comp-2", taskId: "task-2" }];
    const result = applyCompletionEvent(existing, { kind: "DELETE", row: base });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("comp-2");
  });

  it("DELETE: is a no-op when no completion matches event.row.id", () => {
    const existing = [base];
    const ghost: Completion = { ...base, id: "ghost-id" };
    const result = applyCompletionEvent(existing, { kind: "DELETE", row: ghost });
    expect(result).toHaveLength(1);
  });

  it("INSERT: returns a new array reference (pure function)", () => {
    const existing: Completion[] = [];
    const result = applyCompletionEvent(existing, { kind: "INSERT", row: base });
    expect(result).not.toBe(existing);
  });

  it("DELETE: returns a new array reference (pure function)", () => {
    const existing = [base];
    const result = applyCompletionEvent(existing, { kind: "DELETE", row: base });
    expect(result).not.toBe(existing);
  });
});
