import type { DayName, DayPalette } from "./types";

export const DAYS: DayName[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export const PAL: Record<DayName, DayPalette> = {
  Lunes: { border: "#3B82F6", header: "#1D4ED8", light: "#EFF6FF" },
  Martes: { border: "#8B5CF6", header: "#6D28D9", light: "#F5F3FF" },
  Miércoles: { border: "#EC4899", header: "#BE185D", light: "#FDF2F8" },
  Jueves: { border: "#F59E0B", header: "#B45309", light: "#FFFBEB" },
  Viernes: { border: "#22C55E", header: "#15803D", light: "#F0FDF4" },
  Sábado: { border: "#F43F5E", header: "#BE123C", light: "#FFF1F2" },
  Domingo: { border: "#6366F1", header: "#4338CA", light: "#EEF2FF" },
};

/**
 * Dark-mode day color variants.
 *
 * - `border` — same as light mode or slightly brighter to pop on dark bg
 * - `header` — lighter/more-pastel variant for readability on dark bg
 * - `light` — dark surface variant (tailwind-ish dark bg)
 */
export const PAL_DARK: Record<DayName, DayPalette> = {
  Lunes: { border: "#3B82F6", header: "#93C5FD", light: "#1E293B" },
  Martes: { border: "#8B5CF6", header: "#C4B5FD", light: "#1E1A2E" },
  Miércoles: { border: "#EC4899", header: "#F9A8D4", light: "#2E1A28" },
  Jueves: { border: "#F59E0B", header: "#FCD34D", light: "#2E2514" },
  Viernes: { border: "#22C55E", header: "#86EFAC", light: "#142E1A" },
  Sábado: { border: "#F43F5E", header: "#FDA4AF", light: "#2E141E" },
  Domingo: { border: "#6366F1", header: "#A5B4FC", light: "#1A1A2E" },
};

export const WHO_STYLE: Record<string, { bg: string; color: string }> = {
  D: { bg: "#E8E4DD", color: "#0F0D0C" },
  A: { bg: "#F0EDE6", color: "#0F0D0C" },
  Rot: { bg: "#DDD9D2", color: "#0F0D0C" },
  DA: { bg: "var(--color-lime)", color: "#0F0D0C" },
};

export const STORAGE_KEY = "couple-life-checklist";
