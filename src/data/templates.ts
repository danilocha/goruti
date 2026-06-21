import type { DayName, TaskSchedule } from "./types";
import type { TaskInput } from "@/data/types";

// ── Template types ────────────────────────────────────────────────────

export interface TemplateTask {
  name: string;
  icon: string;
  block: string | null;
  timeLabel: string;
  note?: string;
  days: DayName[];
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tasks: TemplateTask[];
}

// ── Pure helper (TDD) ─────────────────────────────────────────────────

/**
 * Maps a RoutineTemplate's tasks into TaskInput[] ready to be inserted.
 * - schedule.type is always 'weekly'
 * - position = array index
 * - noCheck is always false
 * - note defaults to null when absent
 */
export function templateToTaskInputs(template: RoutineTemplate): TaskInput[] {
  return template.tasks.map((t, index) => {
    const schedule: TaskSchedule = { type: "weekly", days: t.days };
    return {
      name: t.name,
      icon: t.icon,
      block: t.block,
      timeLabel: t.timeLabel,
      note: t.note ?? null,
      noCheck: false,
      schedule,
      position: index,
    };
  });
}

// ── Curated templates ─────────────────────────────────────────────────

const ALL_DAYS: DayName[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const MWF: DayName[] = ["Lunes", "Miércoles", "Viernes"];
const TTH: DayName[] = ["Martes", "Jueves"];

export const CURATED_TEMPLATES: RoutineTemplate[] = [
  {
    id: "pareja",
    name: "Rutina de pareja",
    description: "Hábitos para fortalecer el vínculo de pareja día a día.",
    category: "Pareja",
    icon: "💞",
    tasks: [
      {
        name: "Meditar juntos",
        icon: "🧘",
        block: "mañana",
        timeLabel: "07:00",
        days: ALL_DAYS,
      },
      {
        name: "Desayuno juntos",
        icon: "☕",
        block: "mañana",
        timeLabel: "08:00",
        days: ALL_DAYS,
      },
      {
        name: "Caminar 20 min",
        icon: "🚶",
        block: "tarde",
        timeLabel: "18:00",
        days: MWF,
      },
      {
        name: "Planificar la semana",
        icon: "📅",
        block: "noche",
        timeLabel: "20:00",
        days: ["Domingo"],
      },
      {
        name: "Noche sin pantallas",
        icon: "🌙",
        block: "noche",
        timeLabel: "21:00",
        days: ALL_DAYS,
      },
    ],
  },
  {
    id: "fitness",
    name: "Fitness / Gimnasio",
    description: "Entrena de forma constante y mantén un estilo de vida activo.",
    category: "Salud",
    icon: "🏋️",
    tasks: [
      {
        name: "Gimnasio",
        icon: "💪",
        block: "mañana",
        timeLabel: "07:00",
        days: MWF,
      },
      {
        name: "Cardio 20 min",
        icon: "🏃",
        block: "mañana",
        timeLabel: "07:00",
        days: TTH,
      },
      {
        name: "Estiramiento",
        icon: "🤸",
        block: "noche",
        timeLabel: "21:00",
        days: ALL_DAYS,
      },
      {
        name: "Tomar agua 2L",
        icon: "💧",
        block: null,
        timeLabel: "Todo el día",
        days: ALL_DAYS,
      },
    ],
  },
  {
    id: "mananas-productivas",
    name: "Mañanas productivas",
    description: "Empieza cada día con energía, claridad mental y enfoque.",
    category: "Productividad",
    icon: "🌅",
    tasks: [
      {
        name: "Despertar temprano",
        icon: "⏰",
        block: "mañana",
        timeLabel: "06:00",
        days: ALL_DAYS,
      },
      {
        name: "Meditar 10 min",
        icon: "🧘",
        block: "mañana",
        timeLabel: "06:10",
        days: ALL_DAYS,
      },
      {
        name: "Journaling",
        icon: "📓",
        block: "mañana",
        timeLabel: "06:25",
        days: ALL_DAYS,
      },
      {
        name: "Planificar el día",
        icon: "📋",
        block: "mañana",
        timeLabel: "06:40",
        days: ALL_DAYS,
      },
      {
        name: "Ejercicio ligero",
        icon: "🏃",
        block: "mañana",
        timeLabel: "07:00",
        days: ALL_DAYS,
      },
    ],
  },
  {
    id: "hogar-familia",
    name: "Hogar en familia",
    description: "Mantén el hogar en orden con tareas repartidas para todos.",
    category: "Familia",
    icon: "🏠",
    tasks: [
      {
        name: "Tender las camas",
        icon: "🛏️",
        block: "mañana",
        timeLabel: "08:00",
        days: ALL_DAYS,
      },
      {
        name: "Cocinar la cena",
        icon: "🍳",
        block: "noche",
        timeLabel: "19:00",
        days: ALL_DAYS,
      },
      {
        name: "Lavar los platos",
        icon: "🍽️",
        block: "noche",
        timeLabel: "20:00",
        days: ALL_DAYS,
      },
      {
        name: "Sacar la basura",
        icon: "🗑️",
        block: "noche",
        timeLabel: "21:00",
        days: ["Martes", "Viernes"],
      },
      {
        name: "Orden general",
        icon: "🧹",
        block: "tarde",
        timeLabel: "16:00",
        days: ["Sábado"],
      },
    ],
  },
];
