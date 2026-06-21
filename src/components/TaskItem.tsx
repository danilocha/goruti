"use client";

import type { Task } from "@/data/types";
import type { MemberStatus } from "@/data/completionStatus";
import { resolvePersonStyle } from "@/data/utils";
import styles from "./TaskItem.module.css";

interface Props {
  task: Task;
  checked: boolean;
  onToggle: (taskId: string) => void;
  /** Group members — only provided for shared groups (2+ members) */
  members?: Array<{ userId: string; displayName: string | null; role: "owner" | "member" }>;
  /** Current authenticated user id — only provided for shared groups */
  currentUserId?: string;
  /** Per-member completion status for this task — only provided for shared groups */
  memberStatus?: MemberStatus[];
}

/**
 * A single task row — Stitch-style with native checkbox.
 *
 * - Personal mode (members undefined or length <= 1): renders exactly as before —
 *   legacy "who" badge + checkbox. No regression.
 * - Shared mode (members.length >= 2): replaces the legacy badge with a row of
 *   small member circles (initial letter, filled green when done). The current
 *   user's own circle is driven by their toggle checkbox (optimistic). Others'
 *   circles are read-only snapshots from page load.
 *
 * - Entire row is wrapped in <label>: click anywhere toggles
 * - Native <input type="checkbox"> handles all keyboard/accessibility
 * - Checked state uses CSS sibling selector for line-through + opacity
 * - noCheck tasks render as informational rows (no interaction)
 * - No Framer Motion, no role="button", no onKeyDown
 */
export default function TaskItem({
  task,
  checked,
  onToggle,
  members,
  currentUserId,
  memberStatus,
}: Props) {
  const isShared = members !== undefined && members.length >= 2;
  const isWork = task.noCheck === true;

  // ── Personal / legacy badge ────────────────────────────────────────
  const whoStyle = resolvePersonStyle(task.who);
  const showBadge = task.who === "DA" ? "D+A" : task.who;

  const legacyBadge = (
    <span
      className={styles.badge}
      style={{ background: whoStyle.bg, color: whoStyle.color }}
    >
      {showBadge}
    </span>
  );

  // ── Shared mode: member status badges ─────────────────────────────
  const memberBadges = isShared && memberStatus ? (
    <div className={styles.memberBadges}>
      {memberStatus.map((m) => {
        const isMe = m.userId === currentUserId;
        // Use displayName initial; fall back to first 2 chars of userId
        const initial = m.displayName
          ? m.displayName.charAt(0).toUpperCase()
          : m.userId.slice(0, 2).toUpperCase();

        return (
          <span
            key={m.userId}
            className={`${styles.memberCircle} ${m.done ? styles.memberCircleDone : styles.memberCirclePending} ${isMe ? styles.memberCircleMe : ""}`}
            title={isMe ? `${m.displayName ?? "tú"} (tú)` : (m.displayName ?? m.userId)}
            aria-label={`${m.displayName ?? m.userId}: ${m.done ? "completado" : "pendiente"}`}
          >
            {initial}
          </span>
        );
      })}
    </div>
  ) : null;

  const contentMarkup = (
    <div className={styles.content}>
      <div className={styles.taskRow}>
        <span className={styles.taskIcon}>{task.icon}</span>
        <div className={styles.taskInfo}>
          <span className={styles.taskName}>{task.task}</span>
          <span className={styles.taskTime}>{task.time}</span>
          {task.note && <span className={styles.taskNote}>{task.note}</span>}
        </div>
      </div>
      {isShared ? memberBadges : legacyBadge}
    </div>
  );

  // Work items (noCheck) — informational row, no interaction
  if (isWork) {
    return (
      <div className={`${styles.container} ${styles.work}`}>
        {contentMarkup}
      </div>
    );
  }

  return (
    <label className={styles.container}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        onChange={() => onToggle(task.id)}
        aria-label={`${task.task} — ${checked ? "completado" : "pendiente"}`}
      />
      {contentMarkup}
    </label>
  );
}
