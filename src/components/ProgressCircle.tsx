import styles from "./ProgressCircle.module.css";

interface Props {
  progress: number;
  done: number;
  total: number;
  variant?: "progress" | "streak";
}

/**
 * Horizontal progress bar replacing the former SVG circle.
 *
 * - Simple track + fill divs with percentage text.
 * - `variant` prop is accepted for interface compatibility but
 *   currently has no visual effect (always lime).
 * - Used only in tests as of Phase 5 — Header renders its own
 *   inline progress bar directly.
 */
export default function ProgressCircle({
  progress,
  done,
  total,
  variant: _variant,
}: Props) {
  return (
    <div
      className={styles.wrapper}
      role="progressbar"
      aria-label={`${progress}% completo — ${done} de ${total}`}
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className={styles.label}>{progress}%</span>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
