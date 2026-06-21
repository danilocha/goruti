/**
 * weeklyProgress — pure helpers for the weekly progress view.
 *
 * All functions are side-effect free and unit-testable with vitest.
 *
 * Streak rule: count consecutive calendar days ending at (and including)
 * todayDate (going backwards) where done > 0. Stops at the first day with
 * done === 0. Days after todayDate are ignored.
 */

import type { Completion, DayName, RoutineTask } from "./types";

// Monday-first mapping: JS getDay() → index in Mon–Sun week (0–6)
// JS: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
const JS_DAY_TO_MON_INDEX: Record<number, number> = {
  1: 0, // Mon
  2: 1, // Tue
  3: 2, // Wed
  4: 3, // Thu
  5: 4, // Fri
  6: 5, // Sat
  0: 6, // Sun
};

const INDEX_TO_DAY_NAME: DayName[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

/**
 * Format a Date as a local YYYY-MM-DD string (no UTC shift).
 */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface WeekDateEntry {
  date: string; // YYYY-MM-DD local
  dayName: DayName;
}

/**
 * currentWeekDates — returns the 7 days (Mon→Sun) of the calendar week
 * that contains `today` (local time). Each entry has the YYYY-MM-DD date
 * string and the corresponding Spanish DayName.
 */
export function currentWeekDates(today: Date): WeekDateEntry[] {
  // Find Monday of this week (local)
  const monOffset = JS_DAY_TO_MON_INDEX[today.getDay()];
  const monday = new Date(today);
  monday.setDate(today.getDate() - monOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: toLocalDateString(d),
      dayName: INDEX_TO_DAY_NAME[i],
    };
  });
}

export interface DayProgress {
  date: string;
  dayName: DayName;
  total: number;
  done: number;
  pct: number;
}

/**
 * computeWeeklyProgress — for each entry in weekDates, counts:
 *   total: checkable tasks (noCheck===false) whose schedule.days includes dayName
 *   done:  those tasks that have a completion for (taskId, date, currentUserId)
 *   pct:   Math.round(done/total*100) or 0 when total===0
 */
export function computeWeeklyProgress(
  tasks: RoutineTask[],
  completions: Completion[],
  weekDates: WeekDateEntry[],
  currentUserId: string,
): DayProgress[] {
  // Build a lookup set: "taskId|date" for the current user's completions
  const doneSet = new Set<string>();
  for (const c of completions) {
    if (c.userId === currentUserId) {
      doneSet.add(`${c.taskId}|${c.completedDate}`);
    }
  }

  // Only checkable tasks matter
  const checkableTasks = tasks.filter((t) => !t.noCheck);

  return weekDates.map(({ date, dayName }) => {
    const scheduled = checkableTasks.filter((t) =>
      t.schedule.days.includes(dayName),
    );
    const total = scheduled.length;
    const done = scheduled.filter((t) => doneSet.has(`${t.id}|${date}`)).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { date, dayName, total, done, pct };
  });
}

/**
 * computeStreak — counts consecutive days ending at (and including) todayDate
 * where done > 0. Days after todayDate are excluded. Returns 0 if today has
 * done === 0 or is not in the progress list.
 *
 * Streak rule documented: ≥1 completion (done > 0) per day, consecutive days
 * going backwards from today. Resets on any day with done === 0.
 */
export function computeStreak(
  weeklyProgress: DayProgress[],
  todayDate: string,
): number {
  // Filter to only past + today, then reverse to go backwards from today
  const eligible = weeklyProgress
    .filter((d) => d.date <= todayDate)
    .reverse();

  let streak = 0;
  for (const day of eligible) {
    if (day.done > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
