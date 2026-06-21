import "server-only";
import type { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";

export interface ChatSession {
  id: string;
  messages: UIMessage[];
}

/**
 * Loads the current user's most recent chat session so the assistant
 * conversation survives reloads. Returns null when the user is not
 * authenticated or has no prior session.
 */
export async function getLatestChatSession(): Promise<ChatSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("chat_sessions")
    .select("id, messages")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    messages: (data.messages ?? []) as UIMessage[],
  };
}
