import { describe, it, expect } from "vitest";
import { resolvePersonStyle, resolveAssignee, getProgress, groupByBlock } from "../utils";
import type { Task } from "../types";

describe("resolvePersonStyle", () => {
  it("returns D style for D person", () => {
    const style = resolvePersonStyle("D");
    expect(style.bg).toBe("#E8E4DD");
    expect(style.color).toBe("#0F0D0C");
  });

  it("returns A style for A person", () => {
    const style = resolvePersonStyle("A");
    expect(style.bg).toBe("#F0EDE6");
    expect(style.color).toBe("#0F0D0C");
  });

  it("returns Rot style for Rot person", () => {
    const style = resolvePersonStyle("Rot");
    expect(style.bg).toBe("#DDD9D2");
    expect(style.color).toBe("#0F0D0C");
  });

  it("returns DA style for DA person", () => {
    const style = resolvePersonStyle("DA");
    expect(style.bg).toBe("var(--color-lime)");
    expect(style.color).toBe("#0F0D0C");
  });

  it("falls back to DA style for unknown person", () => {
    const style = resolvePersonStyle("X");
    expect(style.bg).toBe("var(--color-lime)");
    expect(style.color).toBe("#0F0D0C");
  });
});

describe("resolveAssignee (rotation parity)", () => {
  it("returns D for even index (0)", () => {
    expect(resolveAssignee(0)).toBe("D");
  });

  it("returns A for odd index (1)", () => {
    expect(resolveAssignee(1)).toBe("A");
  });

  it("returns D for even index (2)", () => {
    expect(resolveAssignee(2)).toBe("D");
  });

  it("returns A for odd index (3)", () => {
    expect(resolveAssignee(3)).toBe("A");
  });
});

describe("getProgress", () => {
  it("returns 50% when 1 of 2 tasks are done", () => {
    expect(getProgress(1, 2)).toBe(50);
  });

  it("returns 100% when all tasks are done", () => {
    expect(getProgress(5, 5)).toBe(100);
  });

  it("returns 0% when no tasks are done", () => {
    expect(getProgress(0, 5)).toBe(0);
  });

  it("returns 0% when there are zero tasks (no division by zero)", () => {
    expect(getProgress(0, 0)).toBe(0);
  });

  it("handles large numbers correctly", () => {
    expect(getProgress(7, 10)).toBe(70);
    expect(getProgress(1, 3)).toBe(33);
  });
});

describe("groupByBlock", () => {
  it("groups tasks by block preserving order", () => {
    const tasks: Task[] = [
      { id: "a", time: "6:00", block: "🌅 Mañana", task: "A", who: "DA", icon: "⏰" },
      { id: "b", time: "12:00", block: "☀️ Mediodía", task: "B", who: "D", icon: "🍱" },
      { id: "c", time: "7:00", block: "🌅 Mañana", task: "C", who: "A", icon: "🧹" },
      { id: "d", time: "18:00", block: "🌙 Noche", task: "D", who: "DA", icon: "🍲" },
    ];
    const blocks = groupByBlock(tasks);
    expect(blocks).toHaveLength(3);
    expect(blocks[0].label).toBe("🌅 Mañana");
    expect(blocks[0].items).toHaveLength(2);
    expect(blocks[0].items[0].id).toBe("a");
    expect(blocks[0].items[1].id).toBe("c");
    expect(blocks[1].label).toBe("☀️ Mediodía");
    expect(blocks[1].items).toHaveLength(1);
    expect(blocks[1].items[0].id).toBe("b");
    expect(blocks[2].label).toBe("🌙 Noche");
    expect(blocks[2].items).toHaveLength(1);
    expect(blocks[2].items[0].id).toBe("d");
  });

  it("returns an empty array for no tasks", () => {
    expect(groupByBlock([])).toEqual([]);
  });

  it("handles a single block", () => {
    const tasks: Task[] = [
      { id: "a", time: "6:00", block: "🌅 Mañana", task: "A", who: "D", icon: "⏰" },
      { id: "b", time: "7:00", block: "🌅 Mañana", task: "B", who: "A", icon: "🧹" },
    ];
    const blocks = groupByBlock(tasks);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].items).toHaveLength(2);
  });
});
