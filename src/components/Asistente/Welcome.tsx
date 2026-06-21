import styles from "./Asistente.module.css";
import SuggestionChips from "./SuggestionChips";

interface Props {
  onSuggestionClick: (text: string) => void;
}

const SUGGESTIONS = [
  "Mostrame mis rutinas",
  "Creá una rutina nueva",
  "Agregá una tarea a mi rutina",
  "¿Qué puedo hacer hoy?",
];

/**
 * Welcome — branded greeting shown when no chat session is active.
 * Displays the Goruti mascot/avatar, a friendly greeting, and 4 suggestion chips.
 */
export default function Welcome({ onSuggestionClick }: Props) {
  return (
    <div className={styles.welcome}>
      <div className={styles.welcomeAvatar}>
        <span className="material-symbols-outlined" style={{ fontSize: 64 }}>
          raven
        </span>
      </div>
      <h2 className={styles.welcomeTitle}>¡Hola! Soy Goruti</h2>
      <p className={styles.welcomeSub}>
        Tu asistente de rutinas. Puedo ayudarte a organizar tu día,
        crear rutinas y gestionar tareas. ¿Por dónde empezamos?
      </p>
      <SuggestionChips suggestions={SUGGESTIONS} onClick={onSuggestionClick} />
    </div>
  );
}
