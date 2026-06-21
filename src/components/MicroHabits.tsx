import styles from "./MicroHabits.module.css";
import { useMicroHabits } from "@/hooks/useMicroHabits";

/**
 * Interactive 2-column grid of 6 tappable micro-habit chips.
 *
 * - Toggle each chip via click or keyboard (Enter/Space)
 * - Completed chip shows filled lime background
 * - Unchecked chip shows subtle border + muted icon
 * - State persisted to localStorage via useMicroHabits hook
 */
export default function MicroHabits() {
  const { habits, toggle, completedCount } = useMicroHabits();

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        ✨ Micro-hábitos instantáneos
        <span className={styles.count}> {completedCount}/6</span>
      </h2>
      <div className={styles.grid}>
        {habits.map((habit, i) => (
          <div
            key={habit.id}
            className={`${styles.habit} ${habit.completed ? styles.checked : styles.unchecked}`}
            role="button"
            tabIndex={0}
            aria-label={`${habit.text}${habit.completed ? " — completado" : ""}`}
            onClick={() => toggle(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(i);
              }
            }}
          >
            <span className={styles.icon}>{habit.icon}</span>
            <span className={styles.text}>{habit.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
