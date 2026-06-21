import { describe, it, expect } from "vitest";
import { buildDayRange } from "../dates";

describe("buildDayRange", () => {
  it("returns 7 entries by default", () => {
    const days = buildDayRange();
    expect(days).toHaveLength(7);
  });

  it("returns entries starting from yesterday by default", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const days = buildDayRange();
    expect(days[0].fullDate.getFullYear()).toBe(yesterday.getFullYear());
    expect(days[0].fullDate.getMonth()).toBe(yesterday.getMonth());
    expect(days[0].fullDate.getDate()).toBe(yesterday.getDate());
  });

  it("respects custom start date and count", () => {
    const start = new Date(2026, 5, 15); // June 15, 2026
    const days = buildDayRange(start, 3);
    expect(days).toHaveLength(3);
    expect(days[0].fullDate.getDate()).toBe(15);
    expect(days[1].fullDate.getDate()).toBe(16);
    expect(days[2].fullDate.getDate()).toBe(17);
  });

  it("produces sequential dates", () => {
    const days = buildDayRange(new Date(2026, 0, 1), 5);
    for (let i = 0; i < days.length - 1; i++) {
      const curr = days[i].fullDate;
      const next = days[i + 1].fullDate;
      // next = curr + 1 day
      const expected = new Date(curr);
      expected.setDate(curr.getDate() + 1);
      expect(next.getFullYear()).toBe(expected.getFullYear());
      expect(next.getMonth()).toBe(expected.getMonth());
      expect(next.getDate()).toBe(expected.getDate());
    }
  });

  it("uses Spanish day names", () => {
    // Monday = 2026-01-05
    const start = new Date(2026, 0, 5); // Monday
    const days = buildDayRange(start, 7);

    const expected = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];

    for (let i = 0; i < 7; i++) {
      expect(days[i].dayName).toBe(expected[i]);
    }
  });

  it("returns 3-letter uppercase abbreviations", () => {
    // Monday = 2026-01-05
    const start = new Date(2026, 0, 5);
    const days = buildDayRange(start, 7);

    const expected = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
    for (let i = 0; i < 7; i++) {
      expect(days[i].abbreviation).toBe(expected[i]);
    }
  });

  it("sets isToday correctly", () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 3);

    const days = buildDayRange(start, 7);

    // Day 3 should be today (start + 3 days from start = today)
    expect(days[3].isToday).toBe(true);

    // Other days should not be today
    for (let i = 0; i < 7; i++) {
      if (i !== 3) {
        expect(days[i].isToday).toBe(false);
      }
    }
  });

  it("handles month boundary (Dec → Jan)", () => {
    // Starting Dec 30, 2026 → overflows into Jan 2027
    const start = new Date(2026, 11, 30);
    const days = buildDayRange(start, 5);

    expect(days).toHaveLength(5);
    // Dec 30, 31, Jan 1, 2, 3
    expect(days[0].fullDate.getMonth()).toBe(11);
    expect(days[0].fullDate.getDate()).toBe(30);
    expect(days[1].fullDate.getMonth()).toBe(11);
    expect(days[1].fullDate.getDate()).toBe(31);
    expect(days[2].fullDate.getFullYear()).toBe(2027);
    expect(days[2].fullDate.getMonth()).toBe(0);
    expect(days[2].fullDate.getDate()).toBe(1);
    expect(days[3].fullDate.getMonth()).toBe(0);
    expect(days[3].fullDate.getDate()).toBe(2);
    expect(days[4].fullDate.getMonth()).toBe(0);
    expect(days[4].fullDate.getDate()).toBe(3);
  });

  it("handles year boundary (Dec → Jan across year)", () => {
    // Starting Dec 30, 2026 → 7 days into Jan 2027
    const start = new Date(2026, 11, 30);
    const days = buildDayRange(start, 7);

    expect(days).toHaveLength(7);
    // Day names for Dec 30 (Wed) → Jan 5 (Tue)
    expect(days[0].dayName).toBe("Miércoles");
    expect(days[2].fullDate.getFullYear()).toBe(2027);
    expect(days[2].fullDate.getMonth()).toBe(0); // January
    expect(days[2].fullDate.getDate()).toBe(1);
    expect(days[2].dayName).toBe("Viernes");
  });

  it("handles Feb → Mar (non-leap year)", () => {
    // Feb 27, 2025 → Mar 1 (2025 is NOT a leap year)
    const start = new Date(2025, 1, 27);
    const days = buildDayRange(start, 4);

    expect(days[0].fullDate.getDate()).toBe(27);
    expect(days[0].fullDate.getMonth()).toBe(1); // Feb
    expect(days[1].fullDate.getDate()).toBe(28);
    expect(days[1].fullDate.getMonth()).toBe(1);
    expect(days[2].fullDate.getDate()).toBe(1);
    expect(days[2].fullDate.getMonth()).toBe(2); // Mar
    expect(days[3].fullDate.getDate()).toBe(2);
    expect(days[3].fullDate.getMonth()).toBe(2);
  });

  it("handles Feb 28 → Mar 1 (leap year 2028)", () => {
    // Feb 27, 2028 → Mar 1 (2028 IS a leap year)
    const start = new Date(2028, 1, 27);
    const days = buildDayRange(start, 4);

    expect(days[0].fullDate.getDate()).toBe(27);
    expect(days[1].fullDate.getDate()).toBe(28);
    expect(days[2].fullDate.getDate()).toBe(29); // Leap day!
    expect(days[2].fullDate.getMonth()).toBe(1); // Still Feb
    expect(days[3].fullDate.getDate()).toBe(1);
    expect(days[3].fullDate.getMonth()).toBe(2); // Mar
  });

  it("provides a valid Date object in fullDate for each entry", () => {
    const days = buildDayRange(new Date(2026, 0, 1), 5);
    for (const day of days) {
      expect(day.fullDate).toBeInstanceOf(Date);
      expect(isNaN(day.fullDate.getTime())).toBe(false);
    }
  });

  it("includes date numbers 1–31 range", () => {
    // Use a full month starting at day 1
    const start = new Date(2026, 0, 1);
    const days = buildDayRange(start, 31);
    for (const day of days) {
      expect(day.date).toBeGreaterThanOrEqual(1);
      expect(day.date).toBeLessThanOrEqual(31);
    }
  });
});
