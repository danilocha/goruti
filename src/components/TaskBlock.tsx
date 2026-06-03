"use client";

import { useState, type ReactNode } from "react";
import type { Task } from "@/data/types";
import TaskItem from "./TaskItem";
import styles from "./TaskBlock.module.css";

interface Props {
  label: string;
  tasks: Task[];
  dayChecks: Record<string, boolean>;
  onToggle: (taskId: string) => void;
}

/**
 * A time block wrapper — label, left border accent, collapsible content.
 *
 * - Left border accent in the day color (via CSS Custom Property `--day-border`)
 * - Collapsible via local `useState` — defaults to expanded
 * - Renders a `TaskItem` for each task in the block
 */
export default function TaskBlock({ label, tasks, dayChecks, onToggle }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className={styles.block}>
      {/* Toggle header */}
      <button
        className={styles.toggle}
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        aria-label={`${label} — ${collapsed ? "expandir" : "colapsar"}`}
      >
        <span className={styles.arrow}>{collapsed ? "▶" : "▼"}</span>
        <span className={styles.label}>{label}</span>
        <span className={styles.count}>{tasks.length}</span>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className={styles.card}>
          {tasks.map((task, i) => (
            <TaskItem
              key={task.id}
              task={task}
              checked={!!dayChecks[task.id]}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}
