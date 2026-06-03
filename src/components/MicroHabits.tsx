import styles from "./MicroHabits.module.css";

const HABITS: [string, string][] = [
  ["🚿", "Secar el baño al usarlo"],
  ["🍽️", "Loza al lavaplatos ya"],
  ["👕", "Ropa sucia → cesta"],
  ["🍳", "Guardar ingredientes al cocinar"],
  ["🪑", "Limpiar mesa al terminar"],
  ["🗑️", "Recoger basura al verla"],
];

/**
 * Static 2-column grid of 6 micro-habits with green badges.
 * Follows the exact content and style from the original checklist.js.
 */
export default function MicroHabits() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>✨ Micro-hábitos instantáneos</h2>
      <div className={styles.grid}>
        {HABITS.map(([icon, text], i) => (
          <div key={i} className={styles.habit}>
            <span className={styles.icon}>{icon}</span>
            <span className={styles.text}>{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
