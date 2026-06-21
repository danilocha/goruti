/**
 * getActiveGroupId — server-side helper.
 *
 * Reads the `goruti-active-group` cookie. If it exists and the current user is
 * a member of that group, returns it. Otherwise falls back to personalGroupId.
 *
 * This keeps the app functional when the cookie is absent (first visit, cleared
 * cookies, or unrecognised group id).
 *
 * NOT unit-testable with vitest — requires live Supabase + cookies() from Next.js.
 */

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const COOKIE_NAME = "goruti-active-group";

export async function getActiveGroupId(personalGroupId: string): Promise<string> {
  const cookieStore = await cookies();
  const rawGroupId = cookieStore.get(COOKIE_NAME)?.value;

  // No cookie set — use personal group
  if (!rawGroupId) return personalGroupId;

  // Same as personal — skip the DB check
  if (rawGroupId === personalGroupId) return personalGroupId;

  // Verify the user is actually a member of the stored group.
  // RLS (gm_select) only returns rows for groups the user belongs to, so any
  // visible row implies membership. limit(1) avoids a maybeSingle() error when
  // the group has multiple members.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", rawGroupId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // Not a member (or group deleted) — fall back gracefully
    return personalGroupId;
  }

  return rawGroupId;
}
