import { describe, it, expect } from "vitest";
import { templateToTaskInputs } from "../templates";
import type { RoutineTemplate } from "../templates";

// ── Fixtures ─────────────────────────────────────────────────────────

const MINIMAL_TEMPLATE: RoutineTemplate = {
  id: "test-minimal",
  name: "Prueba mínima",
  description: "Solo para tests",
  category: "Test",
  icon: "🧪",
  tasks: [
    {
      name: "Tarea A",
      icon: "☀️",
      block: "mañana",
      timeLabel: "07:00",
      days: ["Lunes", "Martes"],
    },
    {
      name: "Tarea B",
      icon: "🌙",
      block: "noche",
      timeLabel: "22:00",
      days: ["Domingo"],
    },
  ],
};

const TEMPLATE_WITH_NOTE: RoutineTemplate = {
  id: "test-note",
  name: "Con nota",
  description: "Tiene nota",
  category: "Test",
  icon: "📝",
  tasks: [
    {
      name: "Tarea con nota",
      icon: "📖",
      block: "tarde",
      timeLabel: "16:00",
      note: "Recordar traer agua",
      days: ["Viernes"],
    },
    {
      name: "Tarea sin nota",
      icon: "🏃",
      block: "mañana",
      timeLabel: "08:00",
      days: ["Lunes"],
    },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────

describe("templateToTaskInputs", () => {
  it("returns one TaskInput per template task", () => {
    const result = templateToTaskInputs(MINIMAL_TEMPLATE);
    expect(result).toHaveLength(2);
  });

  it("sets schedule type to 'weekly' for every task", () => {
    const result = templateToTaskInputs(MINIMAL_TEMPLATE);
    expect(result[0].schedule.type).toBe("weekly");
    expect(result[1].schedule.type).toBe("weekly");
  });

  it("passes through days from TemplateTask to schedule.days", () => {
    const result = templateToTaskInputs(MINIMAL_TEMPLATE);
    expect(result[0].schedule.days).toEqual(["Lunes", "Martes"]);
    expect(result[1].schedule.days).toEqual(["Domingo"]);
  });

  it("assigns position equal to array index", () => {
    const result = templateToTaskInputs(MINIMAL_TEMPLATE);
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(1);
  });

  it("sets noCheck to false for every task", () => {
    const result = templateToTaskInputs(MINIMAL_TEMPLATE);
    expect(result[0].noCheck).toBe(false);
    expect(result[1].noCheck).toBe(false);
  });

  it("passes through note when present", () => {
    const result = templateToTaskInputs(TEMPLATE_WITH_NOTE);
    expect(result[0].note).toBe("Recordar traer agua");
  });

  it("defaults note to null when absent", () => {
    const result = templateToTaskInputs(MINIMAL_TEMPLATE);
    expect(result[0].note).toBeNull();
    expect(result[1].note).toBeNull();
  });

  it("passes name, icon, block, timeLabel through unchanged", () => {
    const result = templateToTaskInputs(MINIMAL_TEMPLATE);
    expect(result[0].name).toBe("Tarea A");
    expect(result[0].icon).toBe("☀️");
    expect(result[0].block).toBe("mañana");
    expect(result[0].timeLabel).toBe("07:00");
  });

  it("preserves ordering — result[1] is original index 1", () => {
    const result = templateToTaskInputs(MINIMAL_TEMPLATE);
    expect(result[1].name).toBe("Tarea B");
  });
});
