/**
 * fetchDayData — server-side fetch for a day's routine tasks and completions.
 *
 * Fetches all tasks for the group's routines, then filters in TypeScript by
 * schedule.days to get only tasks scheduled for the given DayName.
 * Also fetches completions for today (by date string).
 *
 * NOT unit-testable with vitest — requires a live Supabase DB.
 * See apply-notes.md for manual smoke validation steps.
 */

import { createClient } from "@/lib/supabase/server";
import type { Completion, DayName, RoutineTask, TaskSchedule } from "@/data/types";

interface FetchDayDataResult {
  tasks: RoutineTask[];
  completions: Completion[];
}

export async function fetchDayData(
  groupId: string,
  todayDate: string,
  dayName: DayName,
): Promise<FetchDayDataResult> {
  const supabase = await createClient();

  // Fetch all routines for this group
  const { data: routines, error: routinesError } = await supabase
    .from("routines")
    .select("id")
    .eq("group_id", groupId);

  if (routinesError) throw routinesError;
  if (!routines || routines.length === 0) return { tasks: [], completions: [] };

  const routineIds = routines.map((r: { id: string }) => r.id);

  // Fetch all tasks for those routines, ordered by position
  const { data: rawTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .in("routine_id", routineIds)
    .order("position");

  if (tasksError) throw tasksError;

  // Map snake_case DB rows → camelCase domain type, filter by schedule.days
  const allTasks: RoutineTask[] = (rawTasks ?? []).map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      routineId: row.routine_id as string,
      name: row.name as string,
      icon: (row.icon as string | null) ?? null,
      block: (row.block as string | null) ?? null,
      timeLabel: (row.time_label as string | null) ?? null,
      note: (row.note as string | null) ?? null,
      noCheck: row.no_check as boolean,
      schedule: row.schedule as TaskSchedule,
      assignedTo: (row.assigned_to as string[] | null) ?? null,
      position: row.position as number,
    }),
  );

  const tasks = allTasks.filter((t) => t.schedule.days.includes(dayName));
  const taskIds = tasks.map((t) => t.id);

  if (taskIds.length === 0) return { tasks, completions: [] };

  // Fetch completions for today (group-wide read per RLS)
  const { data: rawCompletions, error: completionsError } = await supabase
    .from("task_completions")
    .select("*")
    .in("task_id", taskIds)
    .eq("completed_date", todayDate);

  if (completionsError) throw completionsError;

  const completions: Completion[] = (rawCompletions ?? []).map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      routineId: row.routine_id as string,
      taskId: row.task_id as string,
      userId: row.user_id as string,
      completedDate: row.completed_date as string,
      completedAt: row.completed_at as string,
    }),
  );

  return { tasks, completions };
}
