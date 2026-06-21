"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// ── Client-side auth guard ─────────────────────────────────────────

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/error");

  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, isPublicRoute, router, pathname]);

  // Show nothing while checking auth (prevents flash)
  if (isLoading && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}

// ── Provider ───────────────────────────────────────────────────────

/**
 * Providers — top-level client providers.
 *
 * Wraps children with AuthProvider + AuthGuard.
 * ChecklistContext has been retired — completion state is now owned
 * by useCompletions (in HomeClient) backed by Supabase task_completions.
 * useMicroHabits continues to use its own useLocalStorage independently.
 */
export default function Providers({
  children,
  session = null,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <AuthProvider initialSession={session}>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
