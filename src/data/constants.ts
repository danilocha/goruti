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

export const WHO_STYLE: Record<string, { bg: string; color: string }> = {
  D: { bg: "#DBEAFE", color: "#1D4ED8" },
  A: { bg: "#FCE7F3", color: "#BE185D" },
  Rot: { bg: "#EDE9FE", color: "#6D28D9" },
  DA: { bg: "#DCFCE7", color: "#15803D" },
};

export const STORAGE_KEY = "couple-life-checklist";
