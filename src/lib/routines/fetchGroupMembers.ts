/**
 * fetchGroupMembers — server-side fetch of group members with display names.
 *
 * Mirrors the useGroups pattern: fetches group_members, then profiles
 * separately (no PostgREST embed — there's no direct FK between group_members
 * and profiles), merges in JS.
 */

import { createClient } from "@/lib/supabase/server";

export interface GroupMemberInfo {
  userId: string;
  displayName: string | null;
  role: "owner" | "member";
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMemberInfo[]> {
  const supabase = await createClient();

  // Fetch members for the group
  const { data: memberRows, error: memberErr } = await supabase
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", groupId);

  if (memberErr) throw memberErr;
  if (!memberRows || memberRows.length === 0) return [];

  const userIds = memberRows.map((m: { user_id: string }) => m.user_id);

  // Fetch display names separately (no FK between group_members and profiles)
  const { data: profileRows, error: profileErr } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  if (profileErr) throw profileErr;

  const nameByUser = new Map<string, string | null>();
  for (const p of (profileRows ?? []) as Array<{ id: string; display_name: string | null }>) {
    nameByUser.set(p.id, p.display_name);
  }

  return memberRows.map((m: { user_id: string; role: "owner" | "member" }) => ({
    userId: m.user_id,
    displayName: nameByUser.get(m.user_id) ?? null,
    role: m.role,
  }));
}
