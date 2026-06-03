"use client";

import type { Task } from "@/data/types";
import { resolvePersonStyle } from "@/data/utils";
import styles from "./TaskItem.module.css";

interface Props {
  task: Task;
  checked: boolean;
  onToggle: (taskId: string) => void;
}

/**
 * A single task row — checkbox, time, icon + name, note, assignee badge.
 *
 * - Checked tasks get line-through style and reduced opacity
 * - `noCheck` tasks display as informational (no checkbox interaction)
 * - Assignee badge uses WHO_STYLE colors from constants
 * - Uses CSS Custom Properties for day-colored elements
 */
export default function TaskItem({ task, checked, onToggle }: Props) {
  const whoStyle = resolvePersonStyle(task.who);
  const isWork = task.noCheck === true;
  const showBadge = task.who === "DA" ? "D+A" : task.who;

  return (
    <div
      className={`${styles.item} ${checked ? styles.checked : ""} ${isWork ? styles.work : ""}`}
      onClick={() => {
        if (!isWork) onToggle(task.id);
      }}
      role={isWork ? undefined : "button"}
      tabIndex={isWork ? undefined : 0}
      onKeyDown={(e) => {
        if (!isWork && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle(task.id);
        }
      }}
      aria-label={isWork ? task.task : `${task.task} — ${checked ? "completado" : "pendiente"}`}
    >
      {/* Checkbox or icon placeholder */}
      <div className={styles.checkboxCol}>
        {!isWork ? (
          <div className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}>
            {checked && <span className={styles.checkmark}>✓</span>}
          </div>
        ) : (
          <span className={styles.iconOnly}>{task.icon}</span>
        )}
      </div>

      {/* Time */}
      <div className={`${styles.time} ${checked ? styles.timeChecked : ""}`}>
        {task.time}
      </div>

      {/* Task content */}
      <div className={styles.content}>
        <div className={`${styles.taskName} ${checked ? styles.taskNameChecked : ""}`}>
          {!isWork && <span className={styles.taskIcon}>{task.icon}</span>}
          {task.task}
        </div>
        {task.note && <div className={styles.note}>{task.note}</div>}
      </div>

      {/* Assignee badge */}
      <span
        className={`${styles.badge} ${checked ? styles.badgeChecked : ""}`}
        style={{ background: whoStyle.bg, color: whoStyle.color }}
      >
        {showBadge}
      </span>
    </div>
  );
}
