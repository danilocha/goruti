import { describe, it, expect } from "vitest";
import { almuerzoPerson, buildTasks } from "../tasks";

describe("almuerzoPerson", () => {
  it("returns D for even day index (0)", () => {
    expect(almuerzoPerson(0)).toBe("D");
  });

  it("returns A for odd day index (1)", () => {
    expect(almuerzoPerson(1)).toBe("A");
  });

  it("returns D for even day index (2)", () => {
    expect(almuerzoPerson(2)).toBe("D");
  });

  it("returns A for odd day index (3)", () => {
    expect(almuerzoPerson(3)).toBe("A");

  });

  it("alternates consistently across all 7 days", () => {
    const expected = ["D", "A", "D", "A", "D", "A", "D"];
    for (let i = 0; i < 7; i++) {
      expect(almuerzoPerson(i)).toBe(expected[i]);
    }
  });
});

describe("buildTasks", () => {
  // ── DAY-SPECIFIC EXTRAS ──────────────────────────────────────

  it("includes Lunes extras", () => {
    const tasks = buildTasks("Lunes", 0);
    const ids = tasks.map((t) => t.id);
    expect(ids).toContain("x1");
    expect(ids).toContain("x2");
    expect(tasks.filter((t) => t.block === "📌 Extra del día")).toHaveLength(2);
  });

  it("includes Martes extras", () => {
    const tasks = buildTasks("Martes", 1);
    const extras = tasks.filter((t) => t.block === "📌 Extra del día");
    expect(extras).toHaveLength(3);
    expect(extras.find((t) => t.id === "x2")?.task).toBe("Sacar basura");
    expect(extras.find((t) => t.id === "x3")?.task).toBe("Trapear");
  });

  it("includes Miércoles extras (has all 4)", () => {
    const tasks = buildTasks("Miércoles", 2);
    const extras = tasks.filter((t) => t.block === "📌 Extra del día");
    expect(extras).toHaveLength(4);
    expect(extras.find((t) => t.id === "x4")?.task).toBe("Lavar filtro");
  });

  it("includes Jueves extras", () => {
    const tasks = buildTasks("Jueves", 3);
    const extras = tasks.filter((t) => t.block === "📌 Extra del día");
    expect(extras).toHaveLength(1);
    expect(extras[0].id).toBe("x1");
  });

  it("includes Viernes extras", () => {
    const tasks = buildTasks("Viernes", 4);
    const extras = tasks.filter((t) => t.block === "📌 Extra del día");
    expect(extras).toHaveLength(3);
  });

  // ── ROTATION ─────────────────────────────────────────────────

  it("assigns almuerzo based on dayIdx parity", () => {
    const lunes = buildTasks("Lunes", 0);
    const martes = buildTasks("Martes", 1);
    expect(lunes.find((t) => t.id === "alm")?.who).toBe("D");
    expect(martes.find((t) => t.id === "alm")?.who).toBe("A");
  });

  it("assigns loza_a to the opposite of almuerzo", () => {
    // Lunes (idx 0): alm = D, loza_a should be A
    const lunes = buildTasks("Lunes", 0);
    expect(lunes.find((t) => t.id === "loza_a")?.who).toBe("A");

    // Martes (idx 1): alm = A, loza_a should be D
    const martes = buildTasks("Martes", 1);
    expect(martes.find((t) => t.id === "loza_a")?.who).toBe("D");
  });

  // ── WEEKDAY STRUCTURE ────────────────────────────────────────

  it("returns 18 tasks for a weekday with no extras (Jueves", () => {
    const tasks = buildTasks("Jueves", 3);
    // 18 base + 1 extra
    expect(tasks).toHaveLength(19);
  });

  it("marks work and dorm as noCheck", () => {
    const tasks = buildTasks("Lunes", 0);
    const work = tasks.find((t) => t.id === "work");
    expect(work?.noCheck).toBe(true);
    const dorm = tasks.find((t) => t.id === "dorm");
    expect(dorm?.noCheck).toBe(true);
  });

  // ── WEEKEND STRUCTURE ────────────────────────────────────────

  it("returns Sábado-specific tasks with no 'work' or 'Trabajo' block", () => {
    const tasks = buildTasks("Sábado", 5);
    expect(tasks.some((t) => t.id === "work")).toBe(false);
    expect(tasks.some((t) => t.id === "reu")).toBe(true);
    expect(tasks.some((t) => t.id === "rop")).toBe(true);
  });

  it("returns Domingo-specific tasks with mercado and aseo", () => {
    const tasks = buildTasks("Domingo", 6);
    expect(tasks.some((t) => t.id === "mer")).toBe(true);
    expect(tasks.some((t) => t.id === "aseo")).toBe(true);
    expect(tasks.some((t) => t.id === "mise")).toBe(true);
    expect(tasks.some((t) => t.id === "nev")).toBe(true);
  });

  it("Sábado has 19 tasks", () => {
    const tasks = buildTasks("Sábado", 5);
    expect(tasks).toHaveLength(19);
  });

  it("Domingo has 23 tasks", () => {
    const tasks = buildTasks("Domingo", 6);
    expect(tasks).toHaveLength(23);
  });
});
