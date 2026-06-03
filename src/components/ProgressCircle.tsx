import styles from "./ProgressCircle.module.css";

interface Props {
  progress: number;
  done: number;
  total: number;
}

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * SVG progress circle using stroke-dasharray.
 * Always shows green (#22C55E) to match the original checklist.js.
 */
export default function ProgressCircle({ progress, done, total }: Props) {
  const offset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        viewBox="0 0 52 52"
        aria-label={`${progress}% completo — ${done} de ${total}`}
      >
        {/* Background track */}
        <circle
          className={styles.track}
          cx="26"
          cy="26"
          r={RADIUS}
        />
        {/* Progress arc */}
        <circle
          className={styles.arc}
          cx="26"
          cy="26"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.label}>{progress}%</div>
    </div>
  );
}
