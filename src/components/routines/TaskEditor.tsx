"use client";

import { useState } from "react";
import type { DayName, RoutineTask } from "@/data/types";
import type { TaskInput } from "@/data/types";
import { validateTaskInput, buildSchedule } from "@/lib/routines/routineHelpers";
import DayPicker from "./DayPicker";
import styles from "./TaskEditor.module.css";

interface Props {
  /** If provided, the editor is in edit mode with pre-filled values. */
  initial?: RoutineTask;
  onSave: (input: TaskInput) => void;
  onCancel: () => void;
}

/**
 * TaskEditor — form to create or edit a single task.
 * Fields: name, icon, days (DayPicker), time_label, block, no_check.
 */
export default function TaskEditor({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [days, setDays] = useState<DayName[]>(initial?.schedule.days ?? []);
  const [timeLabel, setTimeLabel] = useState(initial?.timeLabel ?? "");
  const [block, setBlock] = useState(initial?.block ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [noCheck, setNoCheck] = useState(initial?.noCheck ?? false);
  const [errors, setErrors] = useState<{ name?: string; days?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateTaskInput({ name, days });
    if (errs.name || errs.days) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSave({
      name: name.trim(),
      icon: icon.trim() || null,
      block: block.trim() || null,
      timeLabel: timeLabel.trim() || null,
      note: note.trim() || null,
      noCheck,
      schedule: buildSchedule(days),
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field} style={{ flex: 3 }}>
          <label className={styles.label} htmlFor="task-name">
            Nombre *
          </label>
          <input
            id="task-name"
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Yoga matutino"
            autoComplete="off"
          />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>

        <div className={styles.field} style={{ flex: 1 }}>
          <label className={styles.label} htmlFor="task-icon">
            Icono
          </label>
          <input
            id="task-icon"
            className={styles.input}
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🧘"
            maxLength={4}
          />
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Días *</span>
        <DayPicker selected={days} onChange={setDays} />
        {errors.days && <span className={styles.error}>{errors.days}</span>}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="task-time">
            Hora
          </label>
          <input
            id="task-time"
            className={styles.input}
            type="text"
            value={timeLabel}
            onChange={(e) => setTimeLabel(e.target.value)}
            placeholder="7:00"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="task-block">
            Bloque
          </label>
          <input
            id="task-block"
            className={styles.input}
            type="text"
            value={block}
            onChange={(e) => setBlock(e.target.value)}
            placeholder="🌅 Mañana"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-note">
          Nota
        </label>
        <input
          id="task-note"
          className={styles.input}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Opcional"
        />
      </div>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={noCheck}
          onChange={(e) => setNoCheck(e.target.checked)}
        />
        Tarea sin verificación (no_check)
      </label>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary}>
          {initial ? "Guardar cambios" : "Agregar tarea"}
        </button>
      </div>
    </form>
  );
}
