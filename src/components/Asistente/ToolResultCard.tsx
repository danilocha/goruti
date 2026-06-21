"use client";

import { useState } from "react";
import styles from "./Asistente.module.css";

interface Props {
  toolName: string;
  args: Record<string, unknown>;
  result: { ok: boolean; data?: unknown; error?: string };
  isStreaming?: boolean;
}

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  listRoutines: { label: "Listar rutinas", icon: "list_alt" },
  getRoutineTasks: { label: "Obtener tareas", icon: "checklist" },
  createRoutine: { label: "Crear rutina", icon: "add_circle" },
  updateRoutine: { label: "Actualizar rutina", icon: "edit" },
  deleteRoutine: { label: "Eliminar rutina", icon: "delete" },
  addTask: { label: "Agregar tarea", icon: "playlist_add" },
  updateTask: { label: "Actualizar tarea", icon: "edit_note" },
  deleteTask: { label: "Eliminar tarea", icon: "remove_circle" },
  installTemplate: { label: "Instalar plantilla", icon: "download" },
};

/**
 * ToolResultCard — collapsible card displaying a tool invocation result.
 * Shows an icon, label, success/failure status, and expandable params/output.
 */
export default function ToolResultCard({
  toolName,
  args,
  result,
  isStreaming = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const meta = TOOL_LABELS[toolName] ?? { label: toolName, icon: "code" };

  if (isStreaming) {
    return (
      <div className={styles.toolCard}>
        <div className={styles.toolCardHeader}>
          <span className="material-symbols-outlined">{meta.icon}</span>
          <span className={styles.toolCardLabel}>{meta.label}</span>
          <span className={styles.spinner} />
        </div>
      </div>
    );
  }

  const isOk = result.ok;

  return (
    <div className={`${styles.toolCard} ${isOk ? styles.toolOk : styles.toolError}`}>
      <button
        type="button"
        className={styles.toolCardHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="material-symbols-outlined">{meta.icon}</span>
        <span className={styles.toolCardLabel}>{meta.label}</span>
        <span
          className={`material-symbols-outlined ${styles.statusIcon}`}
        >
          {isOk ? "check_circle" : "error"}
        </span>
        <span className={`material-symbols-outlined ${styles.expandIcon}`}>
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>
      {expanded && (
        <div className={styles.toolCardBody}>
          <div className={styles.toolSection}>
            <strong>Parámetros:</strong>
            <pre>{JSON.stringify(args, null, 2)}</pre>
          </div>
          <div className={styles.toolSection}>
            <strong>Resultado:</strong>
            <pre>{JSON.stringify(isOk ? result.data : result.error, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
