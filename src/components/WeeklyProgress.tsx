"use client";

import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { currentWeekDates } from "@/data/weeklyProgress";
import styles from "./WeeklyProgress.module.css";

// Day abbreviations (Mon–Sun)
const DAY_ABBR: Record<string, string> = {
  Lunes: "LUN",
  Martes: "MAR",
  Miércoles: "MIÉ",
  Jueves: "JUE",
  Viernes: "VIE",
  Sábado: "SÁB",
  Domingo: "DOM",
};

// SVG ring constants (r=15, circumference = 2π×15 ≈ 94.25)
const CIRCUMFERENCE = 2 * Math.PI * 15;

interface Props {
  groupId: string;
  currentUserId: string;
}

/**
 * WeeklyProgress — displays a compact Mon–Sun grid with per-day completion
 * rings, overall week % and current streak. Mobile-first, theme-aware.
 */
export default function WeeklyProgress({ groupId, currentUserId }: Props) {
  const { loading, error, weekProgress, weekPct, streak } = useWeeklyProgress(
    groupId,
    currentUserId,
  );

  // Compute todayDate string for highlighting
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekDates = currentWeekDates(today);
  const lastWeekDate = weekDates[weekDates.length - 1].date;

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} aria-hidden="true" />
        <p>Cargando progreso…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>No se pudo cargar el progreso.</p>
      </div>
    );
  }

  const hasAnyTask = weekProgress.some((d) => d.total > 0);

  if (!hasAnyTask) {
    return (
      <div className={styles.empty}>
        <p>Aún no hay tareas esta semana.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Summary header */}
      <div className={styles.summary}>
        <div className={styles.summaryLeft}>
          <h2 className={styles.summaryTitle}>Esta semana</h2>
          <span className={styles.summaryPct}>{weekPct}%</span>
        </div>
        <div className={styles.streak}>
          <span className={styles.streakLabel}>Racha</span>
          <span className={styles.streakValue}>
            {streak > 0 ? `🔥 ${streak} día${streak === 1 ? "" : "s"}` : "—"}
          </span>
        </div>
      </div>

      {/* 7-day grid */}
      <div className={styles.weekTrack}>
        <div className={styles.weekGrid}>
          {weekProgress.map((day) => {
            const isToday = day.date === todayStr;
            const isFuture = day.date > todayStr;
            const offset =
              day.total === 0
                ? CIRCUMFERENCE
                : CIRCUMFERENCE - (day.pct / 100) * CIRCUMFERENCE;

            const cellClass = [
              styles.dayCell,
              isToday ? styles.today : "",
              isFuture ? styles.future : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div key={day.date} className={cellClass}>
                <span className={styles.dayAbbr}>{DAY_ABBR[day.dayName]}</span>

                {/* SVG ring */}
                <div className={styles.ring}>
                  <svg
                    viewBox="0 0 36 36"
                    width="36"
                    height="36"
                    aria-label={`${day.dayName}: ${day.pct}%`}
                  >
                    <circle
                      className={styles.ringBg}
                      cx="18"
                      cy="18"
                      r="15"
                    />
                    <circle
                      className={styles.ringFill}
                      cx="18"
                      cy="18"
                      r="15"
                      style={{ strokeDashoffset: offset }}
                    />
                  </svg>
                  <span className={styles.ringText}>{day.total > 0 ? `${day.pct}%` : "—"}</span>
                </div>

                <span className={styles.dayCounts}>
                  {day.total > 0 ? `${day.done}/${day.total}` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
