"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Group, GroupWithMembers } from "@/data/types";

// ── Pure helper (TDD'd) ────────────────────────────────────────────────

/**
 * makeInviteCode — generates a random 8-character base36 string.
 * Pure function, no side effects, exported for testing.
 */
export function makeInviteCode(): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  // Use crypto.getRandomValues for better randomness when available (browser + Node 18+)
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      result += chars[byte % 36];
    }
  } else {
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * 36)];
    }
  }
  return result;
}

// ── DB row types ───────────────────────────────────────────────────────

interface DbGroup {
  id: string;
  name: string;
  type: "personal" | "shared";
  created_by: string;
  invite_code: string | null;
  created_at: string;
}

interface DbGroupMember {
  group_id: string;
  user_id: string;
  role: "owner" | "member";
}

// ── Hook result type ───────────────────────────────────────────────────

export interface UseGroupsResult {
  groups: GroupWithMembers[];
  loading: boolean;
  error: string | null;
  /** Create a new shared group with the given name. */
  createGroup: (name: string) => Promise<void>;
  /**
   * Return the existing invite code for a group, or generate and persist
   * a new one if none exists yet. Returns the code string.
   */
  generateInvite: (groupId: string) => Promise<string | null>;
  /** Call the join_group_by_invite RPC. Throws on invalid code. */
  joinByInvite: (code: string) => Promise<string>;
  /** Delete a group (owner only, enforced by RLS). Cascades members/routines. */
  deleteGroup: (groupId: string) => Promise<void>;
  /**
   * Write the goruti-active-group cookie and reload the page so the server
   * re-runs ensurePersonalGroup → getActiveGroupId → fetchDayData with the
   * new active group.
   */
  setActiveGroup: (groupId: string) => void;
}

// ── useGroups ──────────────────────────────────────────────────────────

/**
 * useGroups — lists the authenticated user's groups with member display names.
 *
 * Fetches group_members joined with profiles so the UI can show who belongs
 * to each group. Exposes mutations for group management and the invite flow.
 */
export function useGroups(): UseGroupsResult {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Fetch all groups the user is a member of
    const { data: memberRows, error: memberErr } = await supabase
      .from("group_members")
      .select("group_id, role")
      .order("group_id");

    if (memberErr) {
      setError(memberErr.message);
      setLoading(false);
      return;
    }

    const groupIds = (memberRows ?? []).map(
      (r: { group_id: string; role: string }) => r.group_id,
    );

    if (groupIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Fetch group details
    const { data: groupRows, error: groupErr } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: true });

    if (groupErr) {
      setError(groupErr.message);
      setLoading(false);
      return;
    }

    // Fetch all members for these groups. NOTE: no PostgREST embed of profiles
    // — group_members.user_id and profiles.id both FK to auth.users but there's
    // no direct FK between the two tables, so we fetch profiles separately and
    // merge in JS.
    const { data: allMembers, error: allMembersErr } = await supabase
      .from("group_members")
      .select("group_id, user_id, role")
      .in("group_id", groupIds);

    if (allMembersErr) {
      setError(allMembersErr.message);
      setLoading(false);
      return;
    }

    // Fetch display names for all member user_ids (RLS: profiles_select allows
    // reading profiles of users who share a group with you).
    const memberUserIds = [
      ...new Set((allMembers ?? []).map((m: DbGroupMember) => m.user_id)),
    ];
    const nameByUser = new Map<string, string | null>();
    if (memberUserIds.length > 0) {
      const { data: profileRows, error: profileErr } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", memberUserIds);
      if (profileErr) {
        setError(profileErr.message);
        setLoading(false);
        return;
      }
      for (const p of (profileRows ?? []) as Array<{
        id: string;
        display_name: string | null;
      }>) {
        nameByUser.set(p.id, p.display_name);
      }
    }

    // Group members by group_id
    const membersByGroup = new Map<
      string,
      Array<{ userId: string; role: "owner" | "member"; displayName: string | null }>
    >();
    for (const m of (allMembers ?? []) as DbGroupMember[]) {
      const list = membersByGroup.get(m.group_id) ?? [];
      list.push({
        userId: m.user_id,
        role: m.role,
        displayName: nameByUser.get(m.user_id) ?? null,
      });
      membersByGroup.set(m.group_id, list);
    }

    const result: GroupWithMembers[] = (groupRows ?? []).map((g: DbGroup) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      createdBy: g.created_by,
      inviteCode: g.invite_code,
      members: membersByGroup.get(g.id) ?? [],
    }));

    setGroups(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Mutations ──────────────────────────────────────────────────────

  const createGroup = useCallback(
    async (name: string) => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("No autenticado");
        return;
      }

      // Insert the shared group
      const { data: group, error: groupErr } = await supabase
        .from("groups")
        .insert({ name, type: "shared", created_by: user.id })
        .select("id")
        .single();

      if (groupErr) {
        setError(groupErr.message);
        return;
      }

      // Insert self as owner (gm_self_owner_insert policy allows this)
      const { error: memberErr } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id, role: "owner" });

      if (memberErr) {
        setError(memberErr.message);
        return;
      }

      await fetchAll();
    },
    [fetchAll],
  );

  const generateInvite = useCallback(
    async (groupId: string): Promise<string | null> => {
      const supabase = createClient();

      // Check if an invite_code already exists
      const { data: existing, error: fetchErr } = await supabase
        .from("groups")
        .select("invite_code")
        .eq("id", groupId)
        .single();

      if (fetchErr) {
        setError(fetchErr.message);
        return null;
      }

      if (existing?.invite_code) {
        return existing.invite_code as string;
      }

      // Generate and persist a new code
      const code = makeInviteCode();
      const { error: updateErr } = await supabase
        .from("groups")
        .update({ invite_code: code })
        .eq("id", groupId);

      if (updateErr) {
        setError(updateErr.message);
        return null;
      }

      await fetchAll();
      return code;
    },
    [fetchAll],
  );

  const joinByInvite = useCallback(async (code: string): Promise<string> => {
    const supabase = createClient();

    const { data, error: rpcErr } = await supabase.rpc("join_group_by_invite", {
      p_code: code,
    });

    if (rpcErr) {
      throw new Error(rpcErr.message);
    }

    await fetchAll();
    return data as string;
  }, [fetchAll]);

  const deleteGroup = useCallback(
    async (groupId: string) => {
      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);
      if (delErr) {
        setError(delErr.message);
        return;
      }
      // If the deleted group was active, clear the cookie so the server falls
      // back to the personal group on next render.
      if (
        typeof document !== "undefined" &&
        document.cookie.includes(`goruti-active-group=${groupId}`)
      ) {
        document.cookie = "goruti-active-group=; path=/; max-age=0; SameSite=Lax";
      }
      await fetchAll();
    },
    [fetchAll],
  );

  const setActiveGroup = useCallback((groupId: string) => {
    // Write a persistent cookie (30 days) and reload so the server picks it up
    const maxAge = 60 * 60 * 24 * 30;
    document.cookie = `goruti-active-group=${groupId}; path=/; max-age=${maxAge}; SameSite=Lax`;
    window.location.reload();
  }, []);

  return {
    groups,
    loading,
    error,
    createGroup,
    generateInvite,
    joinByInvite,
    deleteGroup,
    setActiveGroup,
  };
}
