"use client";

import { PAL, DAYS } from "@/data/constants";
import type { DayName } from "@/data/types";
import { useChecklistContext } from "./providers";
import Header from "@/components/Header";
import DayTabs from "@/components/DayTabs";
import TaskBlock from "@/components/TaskBlock";
import MicroHabits from "@/components/MicroHabits";
import styles from "./page.module.css";

/**
 * Orchestrator page — the single stateful component.
 *
 * - Consumes `ChecklistContext` from Providers
 * - Sets CSS Custom Properties on the container for day-specific theming
 * - Renders all presentational components via props
 * - No prop drilling beyond 1 level
 */
export default function Home() {
  const {
    selectedDay,
    setSelectedDay,
    todayName,
    blocks,
    dayChecks,
    done,
    total,
    progress,
    toggleTask,
    dayProgressMap,
  } = useChecklistContext();

  const palette = PAL[selectedDay as DayName] ?? PAL.Lunes;

  return (
    <div
      className={styles.page}
      style={
        {
          "--day-border": palette.border,
          "--day-header": palette.header,
          "--day-light": palette.light,
        } as React.CSSProperties
      }
    >
      <Header
        dayName={selectedDay}
        progress={progress}
        done={done}
        total={total}
      />

      <DayTabs
        selectedDay={selectedDay}
        todayName={todayName}
        dayProgressMap={dayProgressMap}
        onSelect={setSelectedDay}
      />

      <main className={styles.main}>
        {blocks.map((block) => (
          <TaskBlock
            key={block.label}
            label={block.label}
            tasks={block.items}
            dayChecks={dayChecks}
            onToggle={toggleTask}
          />
        ))}

        <MicroHabits />
      </main>
    </div>
  );
}
