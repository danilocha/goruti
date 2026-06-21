import { describe, it, expect } from "vitest";
import {
  currentWeekDates,
  computeWeeklyProgress,
  computeStreak,
} from "../weeklyProgress";
import type { RoutineTask, Completion } from "../types";

// ── Helpers ──────────────────────────────────────────────────────

function makeTask(
  id: string,
  days: string[],
  noCheck = false,
): RoutineTask {
  return {
    id,
    routineId: "r1",
    name: id,
    icon: null,
    block: null,
    timeLabel: null,
    note: null,
    noCheck,
    schedule: { type: "weekly", days: days as never },
    assignedTo: null,
    position: 0,
  };
}

function makeCompletion(
  taskId: string,
  userId: string,
  date: string,
): Completion {
  return {
    id: `${taskId}-${userId}-${date}`,
    routineId: "r1",
    taskId,
    userId,
    completedDate: date,
    completedAt: `${date}T10:00:00Z`,
  };
}

// ── currentWeekDates ─────────────────────────────────────────────

describe("currentWeekDates", () => {
  it("returns exactly 7 entries", () => {
    const result = currentWeekDates(new Date(2025, 5, 18)); // Wed June 18
    expect(result).toHaveLength(7);
  });

  it("starts on Monday and ends on Sunday", () => {
    // 2025-06-18 is a Wednesday → week: Mon 16 … Sun 22
    const result = currentWeekDates(new Date(2025, 5, 18));
    expect(result[0].date).toBe("2025-06-16");
    expect(result[0].dayName).toBe("Lunes");
    expect(result[6].date).toBe("2025-06-22");
    expect(result[6].dayName).toBe("Domingo");
  });

  it("maps Sunday (JS getDay=0) correctly to Domingo at index 6", () => {
    // 2025-06-22 is a Sunday → week: Mon 16 … Sun 22
    const result = currentWeekDates(new Date(2025, 5, 22));
    expect(result[6].dayName).toBe("Domingo");
    expect(result[6].date).toBe("2025-06-22");
  });

  it("handles Monday as start of week correctly", () => {
    // 2025-06-16 is a Monday → week: Mon 16 … Sun 22
    // Use local constructor (not ISO string) to avoid UTC-midnight timezone shift
    const result = currentWeekDates(new Date(2025, 5, 16)); // month is 0-indexed
    expect(result[0].date).toBe("2025-06-16");
    expect(result[0].dayName).toBe("Lunes");
  });

  it("handles Saturday correctly", () => {
    // 2025-06-21 is a Saturday → week: Mon 16 … Sun 22
    const result = currentWeekDates(new Date(2025, 5, 21));
    expect(result[5].dayName).toBe("Sábado");
    expect(result[5].date).toBe("2025-06-21");
  });

  it("returns YYYY-MM-DD format strings", () => {
    // Jan 1 2025 is a Wednesday → Mon is Dec 30 2024
    const result = currentWeekDates(new Date(2025, 0, 1));
    expect(result[0].date).toBe("2024-12-30");
  });
});

// ── computeWeeklyProgress ────────────────────────────────────────

describe("computeWeeklyProgress", () => {
  const USER = "user-1";
  const OTHER = "user-2";

  // A week where Mon=2025-06-16 … Sun=2025-06-22
  const weekDates = [
    { date: "2025-06-16", dayName: "Lunes" as const },
    { date: "2025-06-17", dayName: "Martes" as const },
    { date: "2025-06-18", dayName: "Miércoles" as const },
    { date: "2025-06-19", dayName: "Jueves" as const },
    { date: "2025-06-20", dayName: "Viernes" as const },
    { date: "2025-06-21", dayName: "Sábado" as const },
    { date: "2025-06-22", dayName: "Domingo" as const },
  ];

  it("returns 7 rows matching weekDates", () => {
    const result = computeWeeklyProgress([], [], weekDates, USER);
    expect(result).toHaveLength(7);
    expect(result[0].date).toBe("2025-06-16");
    expect(result[6].date).toBe("2025-06-22");
  });

  it("counts only checkable tasks (noCheck=false) scheduled for that day", () => {
    const tasks = [
      makeTask("t1", ["Lunes"]),          // checkable, Mon
      makeTask("t2", ["Lunes"], true),    // noCheck, Mon — should NOT count
      makeTask("t3", ["Martes"]),         // checkable, Tue
    ];
    const result = computeWeeklyProgress(tasks, [], weekDates, USER);
    expect(result[0].total).toBe(1); // only t1
    expect(result[1].total).toBe(1); // only t3
    expect(result[2].total).toBe(0); // Wed: no tasks
  });

  it("counts user completions per day", () => {
    const tasks = [makeTask("t1", ["Lunes"]), makeTask("t2", ["Lunes"])];
    const completions = [
      makeCompletion("t1", USER, "2025-06-16"),
      makeCompletion("t2", OTHER, "2025-06-16"), // other user, should NOT count
    ];
    const result = computeWeeklyProgress(tasks, completions, weekDates, USER);
    expect(result[0].done).toBe(1);
    expect(result[0].total).toBe(2);
  });

  it("matches completion by taskId AND date AND currentUserId", () => {
    const tasks = [makeTask("t1", ["Lunes"])];
    // Completion for correct task + user but WRONG date
    const completions = [makeCompletion("t1", USER, "2025-06-17")];
    const result = computeWeeklyProgress(tasks, completions, weekDates, USER);
    expect(result[0].done).toBe(0); // Mon: wrong date
    expect(result[1].done).toBe(0); // Tue: t1 not scheduled on Tue
  });

  it("computes pct rounded", () => {
    const tasks = [
      makeTask("t1", ["Lunes"]),
      makeTask("t2", ["Lunes"]),
      makeTask("t3", ["Lunes"]),
    ];
    const completions = [makeCompletion("t1", USER, "2025-06-16")];
    const result = computeWeeklyProgress(tasks, completions, weekDates, USER);
    // 1/3 = 33.33... → round to 33
    expect(result[0].pct).toBe(33);
  });

  it("returns pct=0 when total=0 (no division by zero)", () => {
    const result = computeWeeklyProgress([], [], weekDates, USER);
    for (const row of result) {
      expect(row.pct).toBe(0);
    }
  });

  it("returns pct=100 when all tasks complete", () => {
    const tasks = [makeTask("t1", ["Lunes"]), makeTask("t2", ["Lunes"])];
    const completions = [
      makeCompletion("t1", USER, "2025-06-16"),
      makeCompletion("t2", USER, "2025-06-16"),
    ];
    const result = computeWeeklyProgress(tasks, completions, weekDates, USER);
    expect(result[0].pct).toBe(100);
  });

  it("tasks scheduled on multiple days appear on each scheduled day", () => {
    const tasks = [makeTask("t1", ["Lunes", "Miércoles", "Viernes"])];
    const result = computeWeeklyProgress(tasks, [], weekDates, USER);
    expect(result[0].total).toBe(1); // Lunes
    expect(result[1].total).toBe(0); // Martes
    expect(result[2].total).toBe(1); // Miércoles
    expect(result[4].total).toBe(1); // Viernes
  });
});

// ── computeStreak ────────────────────────────────────────────────

/**
 * Streak rule: consecutive days ending at (and including) todayDate
 * where done > 0, counting backwards. Stops at the first day with done===0
 * or at a day after todayDate.
 */
describe("computeStreak", () => {
  const weekDates = [
    { date: "2025-06-16", dayName: "Lunes" as const },
    { date: "2025-06-17", dayName: "Martes" as const },
    { date: "2025-06-18", dayName: "Miércoles" as const },
    { date: "2025-06-19", dayName: "Jueves" as const },
    { date: "2025-06-20", dayName: "Viernes" as const },
    { date: "2025-06-21", dayName: "Sábado" as const },
    { date: "2025-06-22", dayName: "Domingo" as const },
  ];

  function makeProgress(dones: number[]) {
    return weekDates.map((wd, i) => ({
      ...wd,
      total: dones[i] > 0 ? dones[i] : 1,
      done: dones[i],
      pct: dones[i] > 0 ? 100 : 0,
    }));
  }

  it("returns 0 when today has done=0", () => {
    const progress = makeProgress([1, 1, 1, 0, 0, 0, 0]);
    expect(computeStreak(progress, "2025-06-20")).toBe(0); // Viernes done=0
  });

  it("counts 1 when only today has done>0", () => {
    const progress = makeProgress([0, 0, 0, 0, 1, 0, 0]);
    expect(computeStreak(progress, "2025-06-20")).toBe(1);
  });

  it("counts consecutive days backwards from today", () => {
    const progress = makeProgress([0, 1, 1, 1, 1, 0, 0]);
    // Today = Viernes(20), Jueves(19), Miércoles(18), Martes(17) all done; Lunes(16) done=0 → 4
    expect(computeStreak(progress, "2025-06-20")).toBe(4);
  });

  it("ignores future days (after todayDate)", () => {
    const progress = makeProgress([0, 0, 0, 0, 1, 1, 1]);
    // Today = Viernes(20); Sábado(21) and Domingo(22) are future → ignore
    expect(computeStreak(progress, "2025-06-20")).toBe(1);
  });

  it("returns full week streak when all 7 days have done>0", () => {
    const progress = makeProgress([1, 1, 1, 1, 1, 1, 1]);
    expect(computeStreak(progress, "2025-06-22")).toBe(7);
  });

  it("returns 0 for empty progress", () => {
    expect(computeStreak([], "2025-06-20")).toBe(0);
  });
});
