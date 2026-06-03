"use client";

import { useRef, useEffect } from "react";
import type { CheckState, ChecklistAction } from "@/data/types";
import { STORAGE_KEY } from "@/data/constants";

/**
 * Persistence hook — SSR-safe localStorage with 300ms debounce.
 *
 * - On mount: reads from localStorage, dispatches HYDRATE (skipped during SSR)
 * - On state change: debounces writes to localStorage (300ms)
 * - Corrupted data is silently discarded (falls back to empty state)
 * - Storage quota errors are silently caught
 */
export function useLocalStorage(
  state: CheckState,
  dispatch: React.Dispatch<ChecklistAction>,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  // ── Hydrate from localStorage on mount ───────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);

        // Basic structure validation — must be an object (possibly empty)
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          dispatch({ type: "HYDRATE", state: parsed as CheckState });
        }
      }
    } catch {
      // Malformed JSON or schema mismatch — silently ignore, stays at empty state
    }

    hydrated.current = true;
  }, [dispatch]);

  // ── Debounced persist on state change ────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated.current) return;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Quota exceeded or storage full — silently ignore, existing state survives
      }
    }, 300);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [state]);
}
