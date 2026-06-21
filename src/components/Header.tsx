"use client";

import styles from "./Header.module.css";

interface Props {
  dayName: string;
  progress: number;
  done: number;
  total: number;
}

/**
 * Stitch-style fixed header with calendar icon, uppercase day name,
 * and a horizontal progress bar with inline percentage.
 *
 * - No subtitle "Rutina de Hogar"
 * - No legend badges
 * - No user email / sign-out button (moved to SettingsPanel)
 */
export default function Header({ dayName, progress }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
      <div className={styles.leftSection}>
        <span className="material-symbols-outlined">calendar_today</span>
        <h1 className={styles.dayName}>{dayName.toUpperCase()}</h1>
      </div>

      <div className={styles.rightSection}>
        <span className={styles.progressLabel}>{progress}%</span>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      </div>
    </header>
  );
}
