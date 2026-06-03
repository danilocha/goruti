import ProgressCircle from "./ProgressCircle";
import styles from "./Header.module.css";

interface Props {
  dayName: string;
  progress: number;
  done: number;
  total: number;
}

const LEGENDS: [string, string, string, string][] = [
  ["D",    "#DBEAFE", "#1D4ED8", "Daniel"],
  ["A",    "#FCE7F3", "#BE185D", "Tu novia"],
  ["Rot",  "#EDE9FE", "#6D28D9", "Rotan"],
  ["D+A",  "#DCFCE7", "#15803D", "Los dos"],
];

/**
 * Gradient header bar showing the day name, legend badges, and progress circle.
 * Matches the original checklist.js exactly.
 */
export default function Header({ dayName, progress, done, total }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <div>
          <div className={styles.subtitle}>Rutina de Hogar</div>
          <h1 className={styles.dayName}>{dayName}</h1>
        </div>
        <div>
          <ProgressCircle progress={progress} done={done} total={total} />
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {LEGENDS.map(([label, bg, color, name]) => (
          <span key={label} className={styles.legendItem}>
            <span
              className={styles.legendBadge}
              style={{ background: bg, color }}
            >
              {label}
            </span>
            <span className={styles.legendName}>{name}</span>
          </span>
        ))}
      </div>
    </header>
  );
}
