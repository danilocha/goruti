import { describe, it, expect } from "vitest";
import { buildSeedTaskRows } from "../seedRows";
import { buildTasks } from "../tasks";
import { DAYS } from "../constants";

describe("buildSeedTaskRows", () => {
  it("returns at least one row", () => {
    const rows = buildSeedTaskRows();
    expect(rows.length).toBeGreaterThan(0);
  });

  it("sets assignedTo = null for all rows", () => {
    const rows = buildSeedTaskRows();
    for (const row of rows) {
      expect(row.assignedTo).toBeNull();
    }
  });

  it("total row count is less than or equal to sum of tasks across all 7 days", () => {
    // buildSeedTaskRows deduplicates, so the count must be <= 7 * max-tasks-per-day
    const rows = buildSeedTaskRows();
    // The key invariant: deduped rows < naive concat of all 7 days
    const naiveTotal = DAYS.reduce(
      (acc: number, day: string, idx: number) => acc + buildTasks(day, idx).length,
      0,
    );
    expect(rows.length).toBeLessThanOrEqual(naiveTotal);
  });

  it("accumulates schedule.days — a task on Mon+Fri has both days in schedule.days", () => {
    const rows = buildSeedTaskRows();
    // "Lavar ropa" is in Lunes (x1) and Miércoles (x1) but with different ids
    // "x2" in Lunes is "Colgar ropa", also in Miércoles with same id+block+name
    // Let's find a task that appears on multiple weekdays with same dedup key:
    // "lev" (Levantarse) appears on all 5 weekdays with time "6:00" block "🌅 Mañana"
    const lev = rows.filter(
      (r) =>
        r.name === "Levantarse" &&
        r.timeLabel === "6:00" &&
        r.block === "🌅 Mañana",
    );
    // Should be exactly one row (deduped)
    expect(lev).toHaveLength(1);
    // Should have Mon–Fri in schedule.days
    const days = lev[0].schedule.days;
    expect(days).toContain("Lunes");
    expect(days).toContain("Martes");
    expect(days).toContain("Miércoles");
    expect(days).toContain("Jueves");
    expect(days).toContain("Viernes");
    expect(days).not.toContain("Sábado");
    expect(days).not.toContain("Domingo");
  });

  it("weekend variant of a task is a separate row when time_label differs", () => {
    const rows = buildSeedTaskRows();
    // "Levantarse" on weekdays has time "6:00"; on weekends it has time "7:30"
    const levRows = rows.filter((r) => r.name === "Levantarse");
    expect(levRows.length).toBeGreaterThanOrEqual(2);
    const times = levRows.map((r) => r.timeLabel);
    expect(times).toContain("6:00");
    expect(times).toContain("7:30");
  });

  it("noCheck is correctly mapped from source data", () => {
    const rows = buildSeedTaskRows();
    // "Acostarse" has noCheck: true in all days
    const dorm = rows.filter((r) => r.name === "Acostarse");
    expect(dorm.length).toBeGreaterThan(0);
    for (const row of dorm) {
      expect(row.noCheck).toBe(true);
    }
    // "Levantarse" does NOT have noCheck
    const lev = rows.filter((r) => r.name === "Levantarse");
    expect(lev.length).toBeGreaterThan(0);
    for (const row of lev) {
      expect(row.noCheck).toBe(false);
    }
  });

  it("all rows have schedule.type === 'weekly'", () => {
    const rows = buildSeedTaskRows();
    for (const row of rows) {
      expect(row.schedule.type).toBe("weekly");
    }
  });

  it("dedup key includes timeLabel so weekday vs weekend time variants stay separate", () => {
    const rows = buildSeedTaskRows();
    // "Desayuno" id=desa: weekday at "6:10", weekend at "8:00"
    const desaRows = rows.filter((r) => r.name === "Desayuno");
    expect(desaRows.length).toBeGreaterThanOrEqual(2);
    const desaTimes = desaRows.map((r) => r.timeLabel);
    expect(desaTimes).toContain("6:10");
    expect(desaTimes).toContain("8:00");
  });

  it("routineId is empty string before being set by seedDefaultRoutine", () => {
    const rows = buildSeedTaskRows();
    // buildSeedTaskRows() without a routineId argument sets routineId = ""
    for (const row of rows) {
      expect(row.routineId).toBe("");
    }
  });
});
