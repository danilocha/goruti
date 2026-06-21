/**
 * ensurePersonalGroup — idempotent server-side bootstrap.
 *
 * Ensures the authenticated user has a personal group and owner membership.
 * Called at the top of page.tsx before any data fetch.
 *
 * Happy path: the handle_new_user() trigger already created the group.
 * Fallback path: trigger hasn't fired (pre-existing user, edge timing) —
 * this function creates the group + self-membership idempotently.
 *
 * NOT unit-testable with vitest — requires a live Supabase DB.
 * See apply-notes.md for manual smoke validation steps.
 */

import { createClient } from "@/lib/supabase/server";

export async function ensurePersonalGroup(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ensurePersonalGroup: unauthenticated");

  // Check if a personal group already exists for this user.
  // order + limit(1) tolerates legacy duplicates; a partial unique index
  // (one_personal_group_per_user) prevents new ones.
  const findExisting = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("id")
      .eq("type", "personal")
      .eq("created_by", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.id as string | undefined;
  };

  const existingId = await findExisting();
  if (existingId) return existingId;

  // Create personal group
  const { data: group, error: insertGroupError } = await supabase
    .from("groups")
    .insert({ name: "Personal", type: "personal", created_by: user.id })
    .select("id")
    .single();

  // Lost a race against a concurrent insert (unique index) — re-select.
  if (insertGroupError) {
    const raced = await findExisting();
    if (raced) return raced;
    throw insertGroupError;
  }
  const groupId = group.id as string;

  // Self-membership (allowed by gm_self_owner_insert RLS policy)
  const { error: insertMemberError } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: user.id, role: "owner" });

  if (insertMemberError) throw insertMemberError;

  return groupId;
}
