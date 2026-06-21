"use client";

import { DAYS } from "@/data/constants";
import type { DayName } from "@/data/types";
import styles from "./DayPicker.module.css";

// Short label per day
const DAY_SHORT: Record<DayName, string> = {
  Lunes: "L",
  Martes: "M",
  Miércoles: "X",
  Jueves: "J",
  Viernes: "V",
  Sábado: "S",
  Domingo: "D",
};

interface Props {
  selected: DayName[];
  onChange: (days: DayName[]) => void;
}

/**
 * DayPicker — 7 toggle buttons (L M X J V S D), controlled.
 * Emits the updated DayName[] on each toggle.
 */
export default function DayPicker({ selected, onChange }: Props) {
  const set = new Set(selected);

  function toggle(day: DayName) {
    const next = new Set(set);
    if (next.has(day)) {
      next.delete(day);
    } else {
      next.add(day);
    }
    onChange(DAYS.filter((d) => next.has(d)));
  }

  return (
    <div className={styles.container} role="group" aria-label="Días de la semana">
      {DAYS.map((day) => {
        const isActive = set.has(day);
        return (
          <button
            key={day}
            type="button"
            aria-pressed={isActive}
            aria-label={day}
            className={`${styles.day} ${isActive ? styles.active : ""}`}
            onClick={() => toggle(day)}
          >
            {DAY_SHORT[day]}
          </button>
        );
      })}
    </div>
  );
}
