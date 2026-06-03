"use client";

import { DAYS, PAL } from "@/data/constants";
import styles from "./DayTabs.module.css";

interface Props {
  selectedDay: string;
  todayName: string;
  dayProgressMap: Record<string, number>;
  onSelect: (day: string) => void;
}

/**
 * Seven scrollable day tabs with per-day mini progress bars.
 * The active tab uses the day's color palette for the bottom border and text.
 * Today's tab shows a 🟢 indicator.
 */
export default function DayTabs({
  selectedDay,
  todayName,
  dayProgressMap,
  onSelect,
}: Props) {
  return (
    <nav className={styles.tabs} role="tablist" aria-label="Días de la semana">
      {DAYS.map((day) => {
        const isToday = day === todayName;
        const isSelected = day === selectedDay;
        const palette = PAL[day];
        const progress = dayProgressMap[day] ?? 0;

        return (
          <button
            key={day}
            role="tab"
            aria-selected={isSelected}
            className={`${styles.tab} ${isSelected ? styles.active : ""}`}
            style={{
              borderBottomColor: isSelected ? palette.border : "transparent",
            }}
            onClick={() => onSelect(day)}
          >
            <span
              className={`${styles.tabLabel} ${isSelected ? styles.activeLabel : ""}`}
              style={isSelected ? { color: palette.header } : undefined}
            >
              {day.slice(0, 3)}
              {isToday ? "🟢" : ""}
            </span>
            {progress > 0 && (
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progress}%`, background: palette.border }}
                />
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
}
