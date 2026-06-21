import { describe, it, expect } from "vitest";
import { toggleDay, validateTaskInput, buildSchedule } from "../routineHelpers";
import type { DayName } from "@/data/types";

describe("toggleDay", () => {
  it("adds a day that is not present", () => {
    const result = toggleDay(["Lunes", "Miércoles"], "Viernes");
    expect(result).toEqual(["Lunes", "Miércoles", "Viernes"]);
  });

  it("removes a day that is already present", () => {
    const result = toggleDay(["Lunes", "Miércoles", "Viernes"], "Miércoles");
    expect(result).toEqual(["Lunes", "Viernes"]);
  });

  it("preserves DAYS order when adding", () => {
    const result = toggleDay(["Miércoles", "Viernes"], "Lunes");
    expect(result).toEqual(["Lunes", "Miércoles", "Viernes"]);
  });

  it("returns empty array when removing the only day", () => {
    const result = toggleDay(["Lunes"], "Lunes");
    expect(result).toEqual([]);
  });

  it("handles adding to an empty array", () => {
    const result = toggleDay([], "Domingo");
    expect(result).toEqual(["Domingo"]);
  });

  it("preserves order for all 7 days added in reverse", () => {
    let days: DayName[] = [];
    const allDays: DayName[] = [
      "Domingo",
      "Sábado",
      "Viernes",
      "Jueves",
      "Miércoles",
      "Martes",
      "Lunes",
    ];
    for (const d of allDays) {
      days = toggleDay(days, d);
    }
    expect(days).toEqual([
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ]);
  });
});

describe("validateTaskInput", () => {
  it("returns no errors for a valid input", () => {
    const errors = validateTaskInput({ name: "Yoga", days: ["Lunes"] });
    expect(errors).toEqual({});
  });

  it("returns error when name is empty string", () => {
    const errors = validateTaskInput({ name: "", days: ["Lunes"] });
    expect(errors.name).toBeDefined();
  });

  it("returns error when name is whitespace only", () => {
    const errors = validateTaskInput({ name: "   ", days: ["Lunes"] });
    expect(errors.name).toBeDefined();
  });

  it("returns error when no days are selected", () => {
    const errors = validateTaskInput({ name: "Yoga", days: [] });
    expect(errors.days).toBeDefined();
  });

  it("returns both errors when name is empty and days are empty", () => {
    const errors = validateTaskInput({ name: "", days: [] });
    expect(errors.name).toBeDefined();
    expect(errors.days).toBeDefined();
  });
});

describe("buildSchedule", () => {
  it("builds a weekly schedule with the given days", () => {
    const schedule = buildSchedule(["Lunes", "Miércoles"]);
    expect(schedule).toEqual({ type: "weekly", days: ["Lunes", "Miércoles"] });
  });

  it("builds a schedule with all days", () => {
    const days: DayName[] = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    const schedule = buildSchedule(days);
    expect(schedule.type).toBe("weekly");
    expect(schedule.days).toEqual(days);
  });

  it("builds a schedule with an empty days array", () => {
    const schedule = buildSchedule([]);
    expect(schedule).toEqual({ type: "weekly", days: [] });
  });
});
