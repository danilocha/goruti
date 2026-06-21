"use client";

import { buildDayRange } from "@/data/dates";
import styles from "./DayTabs.module.css";

interface Props {
  selectedDay: string;
  onSelect: (day: string) => void;
}

/**
 * Seven date-based day tabs following Stitch design.
 * Builds day range starting from yesterday via buildDayRange().
 * Each tab shows abbreviation + date number stacked vertically.
 * No per-day progress bars — pure visual day selector.
 */
export default function DayTabs({ selectedDay, onSelect }: Props) {
  const days = buildDayRange();

  return (
    <nav className={styles.nav} role="tablist" aria-label="Días de la semana">
      {days.map((item) => {
        const isSelected = item.dayName === selectedDay;
        return (
          <button
            key={item.dayName}
            role="tab"
            aria-selected={isSelected}
            className={`${styles.tab} ${isSelected ? styles.activeTab : ""}`}
            onClick={() => onSelect(item.dayName)}
          >
            <span
              className={`${styles.abbr} ${isSelected ? styles.activeAbbr : ""}`}
            >
              {item.abbreviation}
            </span>
            <span className={styles.dateNumber}>{item.date}</span>
          </button>
        );
      })}
    </nav>
  );
}
