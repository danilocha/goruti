"use client";

import { useState } from "react";
import type { Task } from "@/data/types";
import type { MemberStatus } from "@/data/completionStatus";
import TaskItem from "./TaskItem";
import styles from "./TaskBlock.module.css";

interface Props {
  label: string;
  tasks: Task[];
  dayChecks: Record<string, boolean>;
  onToggle: (taskId: string) => void;
  /** Members of the group — optional; only present for shared groups */
  members?: Array<{ userId: string; displayName: string | null; role: "owner" | "member" }>;
  /** Current authenticated user id — optional; only present for shared groups */
  currentUserId?: string;
  /** Returns per-member completion status for a given task */
  memberStatusForTask?: (taskId: string) => MemberStatus[];
}

/**
 * A time block wrapper — label, top accent bar, collapsible content.
 *
 * - Top accent bar in the day color (via CSS Custom Property `--day-border`)
 * - Collapsible via local `useState` — defaults to expanded
 * - Renders a `TaskItem` for each task in the block
 */
export default function TaskBlock({
  label,
  tasks,
  dayChecks,
  onToggle,
  members,
  currentUserId,
  memberStatusForTask,
}: Props) {
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
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              checked={!!dayChecks[task.id]}
              onToggle={onToggle}
              members={members}
              currentUserId={currentUserId}
              memberStatus={memberStatusForTask ? memberStatusForTask(task.id) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
