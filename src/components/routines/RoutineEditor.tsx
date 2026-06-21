"use client";

import { useState } from "react";
import type { RoutineTask } from "@/data/types";
import type { RoutineWithTasks, TaskInput } from "@/hooks/useRoutines";
import TaskEditor from "./TaskEditor";
import styles from "./RoutineEditor.module.css";

interface Props {
  routine: RoutineWithTasks | null; // null = create mode
  onSaveRoutine: (name: string, description: string) => void;
  onAddTask: (routineId: string, input: TaskInput) => void;
  onUpdateTask: (taskId: string, input: TaskInput) => void;
  onDeleteTask: (taskId: string) => void;
  onBack: () => void;
}

/**
 * RoutineEditor — form to create/edit a routine and manage its tasks.
 * In create mode (routine === null): shows only name/description form.
 * In edit mode: shows name/description + full task list management.
 */
export default function RoutineEditor({
  routine,
  onSaveRoutine,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onBack,
}: Props) {
  const [name, setName] = useState(routine?.name ?? "");
  const [description, setDescription] = useState(routine?.description ?? "");
  const [nameError, setNameError] = useState("");

  // Task editing state
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  function handleSaveRoutine(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("El nombre de la rutina es obligatorio.");
      return;
    }
    setNameError("");
    onSaveRoutine(name.trim(), description.trim());
  }

  function handleAddTask(input: TaskInput) {
    if (!routine) return;
    onAddTask(routine.id, input);
    setAddingTask(false);
  }

  function handleUpdateTask(task: RoutineTask, input: TaskInput) {
    onUpdateTask(task.id, input);
    setEditingTaskId(null);
  }

  function handleDeleteTask(taskId: string) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    onDeleteTask(taskId);
  }

  const tasks: RoutineTask[] = routine?.tasks ?? [];

  return (
    <div className={styles.container}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          arrow_back
        </span>
        Volver
      </button>

      <h2 className={styles.heading}>
        {routine ? "Editar rutina" : "Nueva rutina"}
      </h2>

      <form className={styles.form} onSubmit={handleSaveRoutine} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="routine-name">
            Nombre *
          </label>
          <input
            id="routine-name"
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Rutina matutina"
            autoComplete="off"
          />
          {nameError && <span className={styles.error}>{nameError}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="routine-desc">
            Descripción
          </label>
          <input
            id="routine-desc"
            className={styles.input}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <button type="submit" className={styles.saveBtn}>
          {routine ? "Guardar cambios" : "Crear rutina"}
        </button>
      </form>

      {routine && (
        <>
          <div className={styles.divider} />
          <p className={styles.sectionTitle}>Tareas ({tasks.length})</p>

          <div className={styles.taskList}>
            {tasks.length === 0 && !addingTask && (
              <p className={styles.emptyTasks}>Sin tareas aún.</p>
            )}

            {tasks.map((task) =>
              editingTaskId === task.id ? (
                <TaskEditor
                  key={task.id}
                  initial={task}
                  onSave={(input) => handleUpdateTask(task, input)}
                  onCancel={() => setEditingTaskId(null)}
                />
              ) : (
                <div key={task.id} className={styles.taskRow}>
                  {task.icon && (
                    <span className={styles.taskIcon}>{task.icon}</span>
                  )}
                  <span className={styles.taskName}>{task.name}</span>
                  <span className={styles.taskDays}>
                    {task.schedule.days
                      .map((d) => d.slice(0, 2))
                      .join(", ")}
                  </span>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="Editar tarea"
                    onClick={() => {
                      setAddingTask(false);
                      setEditingTaskId(task.id);
                    }}
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.danger}`}
                    aria-label="Eliminar tarea"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ),
            )}

            {addingTask && (
              <TaskEditor
                onSave={handleAddTask}
                onCancel={() => setAddingTask(false)}
              />
            )}
          </div>

          {!addingTask && editingTaskId === null && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setAddingTask(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                add
              </span>
              Agregar tarea
            </button>
          )}
        </>
      )}
    </div>
  );
}
