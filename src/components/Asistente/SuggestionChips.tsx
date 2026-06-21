import styles from "./Asistente.module.css";

interface Props {
  suggestions: string[];
  onClick: (text: string) => void;
}

/**
 * SuggestionChips — clickable chips that send a pre-defined message.
 * Rendered inside the Welcome component or as standalone quick actions.
 */
export default function SuggestionChips({ suggestions, onClick }: Props) {
  return (
    <div className={styles.chips}>
      {suggestions.map((text) => (
        <button
          key={text}
          type="button"
          className={styles.chip}
          onClick={() => onClick(text)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
