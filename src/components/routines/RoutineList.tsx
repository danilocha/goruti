"use client";

import type { RoutineWithTasks } from "@/hooks/useRoutines";
import styles from "./RoutineList.module.css";

interface Props {
  routines: RoutineWithTasks[];
  onEdit: (routine: RoutineWithTasks) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onGallery: () => void;
}

/**
 * RoutineList — renders one card per routine with Editar/Borrar actions.
 * Shows task count and description. Bottom "＋ Crear rutina" button.
 */
export default function RoutineList({
  routines,
  onEdit,
  onDelete,
  onCreate,
  onGallery,
}: Props) {
  function handleDelete(routine: RoutineWithTasks) {
    if (
      !confirm(
        `¿Eliminar la rutina "${routine.name}"? También se eliminarán todas sus tareas.`,
      )
    )
      return;
    onDelete(routine.id);
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Rutinas</h2>

      {routines.length === 0 && (
        <p className={styles.empty}>
          No hay rutinas aún. Crea la primera.
        </p>
      )}

      {routines.map((routine) => (
        <div key={routine.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardName}>{routine.name}</span>
          </div>

          {routine.description && (
            <span className={styles.cardDesc}>{routine.description}</span>
          )}

          <span className={styles.cardMeta}>
            {routine.tasks.length}{" "}
            {routine.tasks.length === 1 ? "tarea" : "tareas"}
          </span>

          <div className={styles.cardActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnEdit}`}
              onClick={() => onEdit(routine)}
            >
              Editar
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDelete}`}
              onClick={() => handleDelete(routine)}
            >
              Borrar
            </button>
          </div>
        </div>
      ))}

      <div className={styles.actions}>
        <button type="button" className={styles.createBtn} onClick={onCreate}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            add_circle
          </span>
          Crear rutina
        </button>
        <button type="button" className={styles.galleryBtn} onClick={onGallery}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            auto_awesome
          </span>
          Explorar plantillas
        </button>
      </div>
    </div>
  );
}
