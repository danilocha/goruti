import { describe, it, expect } from "vitest";
import {
  buildCompletionMap,
  memberStatusForTask,
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
