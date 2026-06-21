/**
 * Home page — Server Component.
 *
 * Orchestrates server-side bootstrap:
 *  1. ensurePersonalGroup()   — idempotent: returns or creates the user's personal group
 *  2. seedDefaultRoutine()    — idempotent: seeds the couple routine if not yet seeded
 *  3. fetchDayData()          — fetches today's tasks + completions filtered by day
 *
 * Then renders <HomeClient> with the data as props.
 * No client state, no useLocalStorage, no useChecklist called here.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensurePersonalGroup } from "@/lib/routines/ensurePersonalGroup";
import { getActiveGroupId } from "@/lib/routines/activeGroup";
import { seedDefaultRoutine } from "@/lib/routines/seedDefaultRoutine";
import { fetchDayData } from "@/lib/routines/fetchDayData";
import { fetchGroupMembers } from "@/lib/routines/fetchGroupMembers";
import HomeClient from "./HomeClient";
import type { DayName } from "@/data/types";

/** JS getDay() (0=Sunday) → Spanish DayName */
const DAY_MAP: DayName[] = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default async function Home() {
  // Auth check — middleware should handle redirects, but guard defensively
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Server bootstrap
  const personalId = await ensurePersonalGroup();
  // Seed only the personal group (shared groups inherit user-created routines)
  await seedDefaultRoutine(personalId);
  // Resolve which group to display — defaults to personal if cookie absent/invalid
  const groupId = await getActiveGroupId(personalId);

  // Compute today's date and day name server-side
  const now = new Date();
  // Format as YYYY-MM-DD in local time
  const todayDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const dayName: DayName = DAY_MAP[now.getDay()];

  const { tasks, completions } = await fetchDayData(groupId, todayDate, dayName);
  const members = await fetchGroupMembers(groupId);

  return (
    <HomeClient
      tasks={tasks}
      completions={completions}
      todayDate={todayDate}
      dayName={dayName}
      groupId={groupId}
      members={members}
      currentUserId={user.id}
    />
  );
}
