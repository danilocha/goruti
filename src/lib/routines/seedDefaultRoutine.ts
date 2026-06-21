/**
 * seedDefaultRoutine — idempotent server-side routine seeder.
 *
 * Creates the default couple routine for the given group if it doesn't exist.
 * Guards idempotency at two levels:
 *   1. App-level: maybeSingle() pre-check avoids a failed insert round-trip.
 *   2. DB-level: unique(group_id, template_id) on routines table.
 *
 * NOT unit-testable with vitest — requires a live Supabase DB.
 * See apply-notes.md for manual smoke validation steps.
 */

import { createClient } from "@/lib/supabase/server";
import { buildSeedTaskRows } from "@/data/seedRows";

const TEMPLATE_ID = "couple-default";

export async function seedDefaultRoutine(groupId: string): Promise<string> {
  const supabase = await createClient();

  // Idempotency guard: already seeded for this group?
  const { data: existing, error: selectError } = await supabase
    .from("routines")
    .select("id")
    .eq("group_id", groupId)
    .eq("template_id", TEMPLATE_ID)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id as string;

  // Insert the routine
  const { data: routine, error: insertRoutineError } = await supabase
    .from("routines")
    .insert({
      group_id: groupId,
      name: "Rutina de Hogar",
      template_id: TEMPLATE_ID,
    })
    .select("id")
    .single();

  if (insertRoutineError) throw insertRoutineError;
  const routineId = routine.id as string;

  // Build and insert task rows
  const rows = buildSeedTaskRows(routineId);

  // Map camelCase domain type back to snake_case DB columns
  const dbRows = rows.map((row) => ({
    routine_id: routineId,
    name: row.name,
    icon: row.icon,
    block: row.block,
    time_label: row.timeLabel,
    note: row.note,
    no_check: row.noCheck,
    schedule: row.schedule,
    assigned_to: row.assignedTo,
    position: row.position,
  }));

  const { error: insertTasksError } = await supabase
    .from("tasks")
    .insert(dbRows);

  if (insertTasksError) throw insertTasksError;

  return routineId;
}
