import { DAYS } from "@/data/constants";
import type { DayName, TaskSchedule } from "@/data/types";

/**
 * Toggles a day in the selection array.
 * If the day is present, removes it. If absent, adds it.
 * Always returns days in DAYS canonical order (Lunes → Domingo).
 */
export function toggleDay(days: DayName[], day: DayName): DayName[] {
  const set = new Set(days);
  if (set.has(day)) {
    set.delete(day);
  } else {
    set.add(day);
  }
  return DAYS.filter((d) => set.has(d));
}

export interface TaskInputErrors {
  name?: string;
  days?: string;
}

export interface TaskInputData {
  name: string;
  days: DayName[];
}

/**
 * Validates task form input.
 * Returns an object with error messages keyed by field name.
 * Empty object means valid.
 */
export function validateTaskInput(input: TaskInputData): TaskInputErrors {
  const errors: TaskInputErrors = {};
  if (!input.name.trim()) {
    errors.name = "El nombre de la tarea es obligatorio.";
  }
  if (input.days.length === 0) {
    errors.days = "Selecciona al menos un día.";
  }
  return errors;
}

/**
 * Builds a TaskSchedule object from a days array.
 */
export function buildSchedule(days: DayName[]): TaskSchedule {
  return { type: "weekly", days };
}
