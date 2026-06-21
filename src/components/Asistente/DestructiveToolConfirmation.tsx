"use client";

import styles from "./Asistente.module.css";

interface Props {
  toolName: string;
  args: Record<string, unknown>;
  onConfirm: () => void;
  onCancel: () => void;
}

const TOOL_DESTRUCTIVE_LABELS: Record<string, string> = {
  deleteRoutine: "eliminar esta rutina",
  deleteTask: "eliminar esta tarea",
};

/**
 * DestructiveToolConfirmation — confirmation dialog for destructive actions.
 * Shows the entity name and details, then calls onConfirm or onCancel.
 */
export default function DestructiveToolConfirmation({
  toolName,
  args,
  onConfirm,
  onCancel,
}: Props) {
  const actionLabel = TOOL_DESTRUCTIVE_LABELS[toolName] ?? "realizar esta acción";
  const entityName =
    (args.name as string) ?? (args.routineId as string) ?? (args.taskId as string) ?? "";

  return (
    <div className={styles.confirmOverlay}>
      <div className={styles.confirmCard} role="alertdialog" aria-label="Confirmar acción destructiva">
        <div className={styles.confirmIcon}>
          <span className="material-symbols-outlined">warning</span>
        </div>
        <p className={styles.confirmText}>
          ¿Estás seguro de que querés <strong>{actionLabel}</strong>
          {entityName ? ` "${entityName}"` : ""}?
        </p>
        <p className={styles.confirmSubtext}>Esta acción no se puede deshacer.</p>
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.confirmCancel}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmDelete}
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
