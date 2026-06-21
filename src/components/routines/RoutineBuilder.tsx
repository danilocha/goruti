"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRoutines } from "@/hooks/useRoutines";
import type { RoutineWithTasks } from "@/hooks/useRoutines";
import type { RoutineTemplate } from "@/data/templates";
import type { TaskInput } from "@/data/types";
import * as actions from "@/lib/actions/routines";
import RoutineList from "./RoutineList";
import RoutineEditor from "./RoutineEditor";
import TemplateGallery from "./TemplateGallery";
import styles from "./RoutineBuilder.module.css";

interface Props {
  groupId: string;
}

type View =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; routine: RoutineWithTasks }
  | { mode: "gallery" };

/**
 * RoutineBuilder — orchestrator component for the Rutinas tab.
 *
 * Reads via useRoutines, mutates via server actions (from @/lib/actions/routines).
 * Uses router.refresh() after mutations to re-render the Home Server Component.
 */
export default function RoutineBuilder({ groupId }: Props) {
  const { routines, loading, error, refetch } = useRoutines(groupId);

  const [view, setView] = useState<View>({ mode: "list" });
  const router = useRouter();

  // Re-fetch the client-side routines list AND re-render the Home Server
  // Component. router.refresh() alone does NOT invalidate the useRoutines
  // client state, so the Rutinas list/editor would otherwise stay stale.
  async function refreshHome() {
    await refetch();
    router.refresh();
  }

  // ── Handlers — all mutations go through server actions ────

  async function handleCreateRoutine(name: string, description: string) {
    const result = await actions.createRoutineAction(groupId, name, description || undefined);
    if (result.ok) {
      refreshHome();
      setView({ mode: "list" });
    }
  }

  async function handleUpdateRoutine(name: string, description: string) {
    if (view.mode !== "edit") return;
    const result = await actions.updateRoutineAction(view.routine.id, {
      name,
      description: description || null,
    });
    if (result.ok) {
      refreshHome();
      setView({ mode: "list" });
    }
  }

  async function handleDeleteRoutine(id: string) {
    const result = await actions.deleteRoutineAction(id);
    if (result.ok) {
      refreshHome();
      if (view.mode === "edit" && view.routine.id === id) {
        setView({ mode: "list" });
      }
    }
  }

  async function handleAddTask(routineId: string, input: TaskInput) {
    const result = await actions.addTaskAction(routineId, input);
    // The edit view re-syncs automatically via `currentRoutine` once the
    // refetch updates the routines list.
    if (result.ok) await refreshHome();
  }

  async function handleUpdateTask(taskId: string, input: TaskInput) {
    const result = await actions.updateTaskAction(taskId, input);
    if (result.ok) refreshHome();
  }

  async function handleDeleteTask(taskId: string) {
    const result = await actions.deleteTaskAction(taskId);
    if (result.ok) refreshHome();
  }

  async function handleMoveTask(taskId: string, direction: "up" | "down") {
    if (view.mode !== "edit") return;
    const routine = routines.find((r) => r.id === view.routine.id) ?? view.routine;
    const ordered = [...routine.tasks].sort((a, b) => a.position - b.position);
    const idx = ordered.findIndex((t) => t.id === taskId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return;
    [ordered[idx], ordered[swapIdx]] = [ordered[swapIdx], ordered[idx]];
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].position !== i) {
        await actions.updateTaskAction(ordered[i].id, { position: i });
      }
    }
    refreshHome();
  }

  async function handleInstallTemplate(template: RoutineTemplate) {
    const result = await actions.installTemplateAction(groupId, template);
    if (result.ok) {
      refreshHome();
      setView({ mode: "list" });
    }
  }

  // After refetch, sync the edit view with fresh routine data
  const currentRoutine =
    view.mode === "edit"
      ? (routines.find((r) => r.id === view.routine.id) ?? view.routine)
      : null;

  // ── Render ──────────────────────────────────────────────────

  if (loading) {
    return <div className={styles.loading}>Cargando rutinas…</div>;
  }

  return (
    <div className={styles.container}>
      {error && <div className={styles.errorBanner}>{error}</div>}

      {view.mode === "list" && (
        <RoutineList
          routines={routines}
          onEdit={(routine) => setView({ mode: "edit", routine })}
          onDelete={handleDeleteRoutine}
          onCreate={() => setView({ mode: "create" })}
          onGallery={() => setView({ mode: "gallery" })}
        />
      )}

      {view.mode === "gallery" && (
        <TemplateGallery
          onInstall={handleInstallTemplate}
          onBack={() => setView({ mode: "list" })}
        />
      )}

      {view.mode === "create" && (
        <RoutineEditor
          routine={null}
          onSaveRoutine={handleCreateRoutine}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onBack={() => setView({ mode: "list" })}
        />
      )}

      {view.mode === "edit" && currentRoutine && (
        <RoutineEditor
          routine={currentRoutine}
          onSaveRoutine={handleUpdateRoutine}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onMoveTask={handleMoveTask}
          onBack={() => setView({ mode: "list" })}
        />
      )}
    </div>
  );
}
