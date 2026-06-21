"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PAL, PAL_DARK, DAYS } from "@/data/constants";
import { useTheme } from "@/hooks/useTheme";
import type { DayName, RoutineTask, Completion } from "@/data/types";
import type { GroupMemberInfo } from "@/lib/routines/fetchGroupMembers";
import { memberStatusForTask } from "@/data/completionStatus";
import Header from "@/components/Header";
import DayTabs from "@/components/DayTabs";
import TaskBlock from "@/components/TaskBlock";
import MicroHabits from "@/components/MicroHabits";
import BottomNav from "@/components/BottomNav";
import type { TabId } from "@/components/BottomNav";
import SettingsPanel from "@/components/SettingsPanel";
import RoutineBuilder from "@/components/routines/RoutineBuilder";
import WeeklyProgress from "@/components/WeeklyProgress";
import Asistente from "@/components/Asistente";
import { useChecklist } from "@/hooks/useChecklist";
import { useCompletions } from "@/hooks/useCompletions";
import styles from "./page.module.css";

interface Props {
  tasks: RoutineTask[];
  completions: Completion[];
  todayDate: string;
  dayName: DayName;
  groupId: string;
  members: GroupMemberInfo[];
  currentUserId: string;
}

/**
 * HomeClient — interactive client shell for the home page.
 *
 * Receives server-fetched routine data as props.
 * Manages day selection, checklist state, and completion persistence.
 *
 * - useChecklist(tasks, dayName): filters tasks for the selected day,
 *   groups into blocks, computes progress.
 * - useCompletions(taskIds, todayDate, completions): optimistic
 *   toggle backed by Supabase task_completions.
 */
export default function HomeClient({
  tasks,
  completions,
  todayDate,
  dayName: initialDayName,
  groupId,
  members,
  currentUserId,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [selectedDay, setSelectedDay] = useState<DayName>(initialDayName);
  const [chatSessionId, setChatSessionId] = useState<string | undefined>(undefined);

  const { blocks, checkable, total } = useChecklist(tasks, selectedDay);
  const taskIds = tasks.map((t) => t.id);
  const { isChecked, toggle, completedUserIds, failedTaskId } = useCompletions(tasks, todayDate, completions, currentUserId);

  // Build dayChecks Record<string, boolean> from useCompletions for TaskBlock
  const dayChecks: Record<string, boolean> = {};
  for (const id of taskIds) {
    dayChecks[id] = isChecked(id);
  }

  // Compute done/progress from completion state
  const done = checkable.filter((t) => isChecked(t.id)).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // ── Direction-aware day slide ──────────────────────────────────
  const prevDayRef = useRef<DayName>(selectedDay);
  const [direction, setDirection] = useState(0);

  const handleDayChange = useCallback(
    (day: string) => {
      const dayIndex = DAYS.indexOf(day as DayName);
      const prevIndex = DAYS.indexOf(prevDayRef.current as DayName);
      setDirection(dayIndex > prevIndex ? 1 : -1);
      prevDayRef.current = day as DayName;
      setSelectedDay(day as DayName);
    },
    [],
  );

  const prefersReducedMotion = useReducedMotion();

  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -300, opacity: 0 }),
  };

  const { theme } = useTheme();
  const dayPalette =
    (theme === "dark" ? PAL_DARK : PAL)[selectedDay] ?? PAL.Lunes;

  const dayDependentContent = (
    <>
      <DayTabs selectedDay={selectedDay} onSelect={handleDayChange} />

      {prefersReducedMotion ? (
        <main key={selectedDay} className={styles.main}>
          {blocks.map((block) => (
            <TaskBlock
              key={block.label}
              label={block.label}
              tasks={block.items}
              dayChecks={dayChecks}
              onToggle={toggle}
              members={members}
              currentUserId={currentUserId}
              memberStatusForTask={(taskId) =>
                memberStatusForTask(taskId, members, completedUserIds(taskId))
              }
            />
          ))}
          <MicroHabits />
        </main>
      ) : (
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={selectedDay}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <main className={styles.main}>
              {blocks.map((block) => (
                <TaskBlock
                  key={block.label}
                  label={block.label}
                  tasks={block.items}
                  dayChecks={dayChecks}
                  onToggle={toggle}
                  members={members}
                  currentUserId={currentUserId}
                  memberStatusForTask={(taskId) =>
                    memberStatusForTask(taskId, members, completedUserIds(taskId))
                  }
                />
              ))}
              <MicroHabits />
            </main>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );

  return (
    <div
      className={styles.page}
      style={
        {
          "--day-border": dayPalette.border,
          "--day-header": dayPalette.header,
          "--day-light": dayPalette.light,
        } as React.CSSProperties
      }
    >
      <Header
        dayName={selectedDay}
        progress={progress}
        done={done}
        total={total}
      />

      <div className={styles.content}>
        {activeTab === "home" && dayDependentContent}

        {activeTab === "progress" && (
          <main className={styles.main}>
            <WeeklyProgress groupId={groupId} currentUserId={currentUserId} />
          </main>
        )}

        {activeTab === "rutinas" && <RoutineBuilder groupId={groupId} />}

        {activeTab === "settings" && <SettingsPanel groupId={groupId} />}

        {activeTab === "asistente" && (
          <main className={styles.main}>
            <Asistente sessionId={chatSessionId} />
          </main>
        )}
      </div>

      {failedTaskId && (
        <div className={styles.errorToast} role="alert">
          No se pudo guardar. Revisá tu conexión y reintentá.
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
