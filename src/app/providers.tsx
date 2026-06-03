"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CheckState, ChecklistAction, Task } from "@/data/types";
import { useChecklist } from "@/hooks/useChecklist";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// ── Context shape ──────────────────────────────────────────────────

export interface ChecklistContextValue {
  state: CheckState;
  dispatch: React.Dispatch<ChecklistAction>;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  todayName: string;
  tasks: Task[];
  blocks: { label: string; items: Task[] }[];
  dayChecks: Record<string, boolean>;
  done: number;
  total: number;
  progress: number;
  toggleTask: (taskId: string) => void;
  dayProgressMap: Record<string, number>;
}

const ChecklistContext = createContext<ChecklistContextValue | null>(null);

/**
 * Access the checklist state from any child component.
 * Must be called within `<Providers>`.
 */
export function useChecklistContext(): ChecklistContextValue {
  const ctx = useContext(ChecklistContext);
  if (ctx === null) {
    throw new Error("useChecklistContext must be used within <Providers>");
  }
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────

export default function Providers({ children }: { children: ReactNode }) {
  const checklist = useChecklist();

  // Wire up localStorage persistence — dispatch is stable from useReducer
  useLocalStorage(checklist.state, checklist.dispatch);

  return (
    <ChecklistContext.Provider
      value={{
        state: checklist.state,
        dispatch: checklist.dispatch,
        selectedDay: checklist.selectedDay,
        setSelectedDay: checklist.setSelectedDay,
        todayName: checklist.todayName,
        tasks: checklist.tasks,
        blocks: checklist.blocks,
        dayChecks: checklist.dayChecks,
        done: checklist.done,
        total: checklist.total,
        progress: checklist.progress,
        toggleTask: checklist.toggleTask,
        dayProgressMap: checklist.dayProgressMap,
      }}
    >
      {children}
    </ChecklistContext.Provider>
  );
}
