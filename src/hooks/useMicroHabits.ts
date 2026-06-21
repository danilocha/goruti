"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

const DEFAULT_HABITS: { icon: string; text: string }[] = [
  { icon: "🚿", text: "Secar el baño al usarlo" },
  { icon: "🍽️", text: "Loza al lavaplatos ya" },
  { icon: "👕", text: "Ropa sucia → cesta" },
  { icon: "🍳", text: "Guardar ingredientes al cocinar" },
  { icon: "🪑", text: "Limpiar mesa al terminar" },
  { icon: "🗑️", text: "Recoger basura al verla" },
];

const STORAGE_KEY = "goruti-micro-habits";

export interface MicroHabit {
  id: string;
  icon: string;
  text: string;
  completed: boolean;
}

/**
 * Manages 6 micro-habit toggle state with localStorage persistence.
 *
 * - SSR-safe: guard against `typeof window === "undefined"`
 * - Corrupted localStorage data is silently discarded (all false)
 * - Storage quota errors are silently caught
 * - Returns derived `completedCount` and `habits` array for rendering
 */
export function useMicroHabits() {
  const [completed, setCompleted] = useState<boolean[]>(() => {
    if (typeof window === "undefined") return new Array(6).fill(false);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 6) {
          return parsed.map(Boolean);
        }
      }
    } catch {
      // Malformed JSON — silently fall through to empty state
    }

    return new Array(6).fill(false);
  });

  // ── Persist to localStorage on every change ─────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch {
      // Quota exceeded — existing state survives
    }
  }, [completed]);

  const toggle = useCallback((index: number) => {
    setCompleted((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const habits = useMemo<MicroHabit[]>(
    () =>
      DEFAULT_HABITS.map((h, i) => ({
        id: `micro-${i}`,
        icon: h.icon,
        text: h.text,
        completed: completed[i],
      })),
    [completed],
  );

  const completedCount = useMemo(
    () => completed.filter(Boolean).length,
    [completed],
  );

  return { habits, toggle, completedCount } as const;
}
