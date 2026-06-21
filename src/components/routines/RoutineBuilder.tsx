"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRoutines } from "@/hooks/useRoutines";
import type { RoutineWithTasks, TaskInput } from "@/hooks/useRoutines";
import type { RoutineTemplate } from "@/data/templates";
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
 * Manages view state: list → create/edit routine → back to list.
 */
export default function RoutineBuilder({ groupId }: Props) {
  const {
    routines,
    loading,
    error,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addTask,
    updateTask,
    deleteTask,
    installTemplate,
  } = useRoutines(groupId);

  const [view, setView] = useState<View>({ mode: "list" });
  const router = useRouter();

  // Re-run the home Server Component so Inicio reflects routine/task edits
  // without a manual page reload (page.tsx fetches tasks server-side as props).
  function refreshHome() {
    router.refresh();
  }

  // ── Handlers ────────────────────────────────────────────────

  async function handleCreateRoutine(name: string, description: string) {
    await createRoutine(name, description || undefined);
    refreshHome();
    setView({ mode: "list" });
  }

  async function handleUpdateRoutine(name: string, description: string) {
    if (view.mode !== "edit") return;
    await updateRoutine(view.routine.id, { name, description: description || null });
    refreshHome();
    setView({ mode: "list" });
  }

  async function handleDeleteRoutine(id: string) {
    await deleteRoutine(id);
    refreshHome();
    if (view.mode === "edit" && view.routine.id === id) {
      setView({ mode: "list" });
    }
  }

  async function handleAddTask(routineId: string, input: TaskInput) {
    await addTask(routineId, input);
    refreshHome();
    // Refresh the routine in edit view if it matches
    if (view.mode === "edit" && view.routine.id === routineId) {
      const updated = routines.find((r) => r.id === routineId);
      if (updated) setView({ mode: "edit", routine: updated });
    }
  }

  async function handleUpdateTask(taskId: string, input: TaskInput) {
    await updateTask(taskId, input);
    refreshHome();
  }

  async function handleDeleteTask(taskId: string) {
    await deleteTask(taskId);
    refreshHome();
  }

  async function handleMoveTask(taskId: string, direction: "up" | "down") {
    if (view.mode !== "edit") return;
    const routine = routines.find((r) => r.id === view.routine.id) ?? view.routine;
    const ordered = [...routine.tasks].sort((a, b) => a.position - b.position);
    const idx = ordered.findIndex((t) => t.id === taskId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return;
    [ordered[idx], ordered[swapIdx]] = [ordered[swapIdx], ordered[idx]];
    // Reassign sequential positions; persist only the ones that changed.
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].position !== i) {
        await updateTask(ordered[i].id, { position: i });
      }
    }
    refreshHome();
  }

  async function handleInstallTemplate(template: RoutineTemplate) {
    await installTemplate(template);
    refreshHome();
    setView({ mode: "list" });
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
