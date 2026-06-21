import type { Task } from "./types";

/**
 * Determines who cooks lunch based on day index parity.
 * Even index → "D", Odd index → "A"
 */
export function almuerzoPerson(dayIdx: number): "D" | "A" {
  return dayIdx % 2 === 0 ? "D" : "A";
}

/**
 * Builds the full task list for a given day.
 * Mirrors the exact logic from the original checklist.js.
 *
 * @deprecated Internal utility for seed generation only.
 * The public contract is `buildSeedTaskRows()` in `src/data/seedRows.ts`.
 * See buildSeedTaskRows.test.ts for the expected behaviour.
 */
export function buildTasks(dayName: string, dayIdx: number): Task[] {
  const alm = almuerzoPerson(dayIdx);

  // ── WEEKEND: Sábado ──────────────────────────────────────────
  if (dayName === "Sábado") {
    return [
      { id: "lev", time: "7:30", block: "🌅 Mañana", task: "Levantarse", who: "DA", icon: "⏰" },
      { id: "tend", time: "7:35", block: "🌅 Mañana", task: "Tender la cama", who: "DA", icon: "🛏️" },
      { id: "desa", time: "8:00", block: "🌅 Mañana", task: "Desayuno", who: "D", icon: "🍳", note: "D cocina siempre" },
      { id: "loza", time: "8:30", block: "🌅 Mañana", task: "Lavar loza del desayuno", who: "A", icon: "🍽️" },
      { id: "hab", time: "8:40", block: "🌅 Mañana", task: "Arreglar habitación", who: "D", icon: "🛏️" },
      { id: "sala", time: "8:40", block: "🌅 Mañana", task: "Arreglar sala", who: "A", icon: "🛋️" },
      { id: "coc_m", time: "8:50", block: "🌅 Mañana", task: "Arreglar cocina", who: "A", icon: "🍴" },
      { id: "est", time: "8:50", block: "🌅 Mañana", task: "Arreglar estudio", who: "D", icon: "💻" },
      { id: "barr", time: "9:00", block: "🌅 Mañana", task: "Barrer", who: "Rot", icon: "🧹" },
      { id: "gym", time: "9:00", block: "🌅 Mañana", task: "Gym (opcional)", who: "DA", icon: "🏋️", note: "si quieren" },
      { id: "rop", time: "10:00", block: "🧹 Tareas", task: "Organizar ropaje", who: "DA", icon: "👗" },
      { id: "reu", time: "11:00", block: "🧹 Tareas", task: "Reunión semanal 🤝", who: "DA", icon: "📋", note: "~20 min" },
      { id: "alm", time: "12:30", block: "☀️ Mediodía", task: "Almuerzo", who: alm, icon: "🍱", note: `Hoy cocina: ${alm}` },
      { id: "loza_a", time: "1:00", block: "☀️ Mediodía", task: "Lavar loza del almuerzo", who: alm === "D" ? "A" : "D", icon: "🍽️" },
      { id: "coc_a", time: "1:15", block: "☀️ Mediodía", task: "Arreglar cocina", who: "Rot", icon: "🧽" },
      { id: "leer", time: "2:00", block: "🌤️ Tarde libre", task: "Leer", who: "DA", icon: "📖", note: "tiempo libre" },
      { id: "cena", time: "7:00", block: "🌙 Noche", task: "Cena", who: "A", icon: "🍲" },
      { id: "coc_n", time: "7:30", block: "🌙 Noche", task: "Arreglar cocina", who: "D", icon: "🧽" },
      { id: "dorm", time: "9:00", block: "🌙 Noche", task: "Acostarse", who: "DA", icon: "😴", noCheck: true },
    ];
  }

  // ── WEEKEND: Domingo ─────────────────────────────────────────
  if (dayName === "Domingo") {
    return [
      { id: "lev", time: "7:30", block: "🌅 Mañana", task: "Levantarse", who: "DA", icon: "⏰" },
      { id: "tend", time: "7:35", block: "🌅 Mañana", task: "Tender la cama", who: "DA", icon: "🛏️" },
      { id: "desa", time: "8:00", block: "🌅 Mañana", task: "Desayuno", who: "D", icon: "🍳", note: "D cocina siempre" },
      { id: "loza", time: "8:30", block: "🌅 Mañana", task: "Lavar loza del desayuno", who: "A", icon: "🍽️" },
      { id: "hab", time: "8:40", block: "🌅 Mañana", task: "Arreglar habitación", who: "D", icon: "🛏️" },
      { id: "sala", time: "8:40", block: "🌅 Mañana", task: "Arreglar sala", who: "A", icon: "🛋️" },
      { id: "coc_m", time: "8:50", block: "🌅 Mañana", task: "Arreglar cocina", who: "A", icon: "🍴" },
      { id: "est", time: "8:50", block: "🌅 Mañana", task: "Arreglar estudio", who: "D", icon: "💻" },
      { id: "barr", time: "9:00", block: "🌅 Mañana", task: "Barrer", who: "Rot", icon: "🧹" },
      { id: "mer", time: "9:30", block: "🧹 Tareas", task: "Mercar (lo que falta)", who: "DA", icon: "🛒" },
      { id: "org_m", time: "11:00", block: "🧹 Tareas", task: "Organizar mercado", who: "A", icon: "🧺" },
      { id: "apr", time: "11:00", block: "🧹 Tareas", task: "Aprovechar mercado", who: "D", icon: "🍅" },
      { id: "nev", time: "11:30", block: "🧹 Tareas", task: "Limpiar nevera", who: "Rot", icon: "🧊" },
      { id: "ban", time: "11:45", block: "🧹 Tareas", task: "Limpiar baños", who: "Rot", icon: "🚿" },
      { id: "alm", time: "12:30", block: "☀️ Mediodía", task: "Almuerzo", who: alm, icon: "🍱", note: `Hoy cocina: ${alm}` },
      { id: "loza_a", time: "1:00", block: "☀️ Mediodía", task: "Lavar loza del almuerzo", who: alm === "D" ? "A" : "D", icon: "🍽️" },
      { id: "coc_a", time: "1:15", block: "☀️ Mediodía", task: "Arreglar cocina", who: "Rot", icon: "🧽" },
      { id: "aseo", time: "3:00", block: "🌤️ Tarde", task: "Aseo general (barrer, trapear)", who: "DA", icon: "🧹" },
      { id: "mise", time: "4:30", block: "🌤️ Tarde", task: "Mise en place", who: "DA", icon: "🥘", note: "preparar la semana" },
      { id: "leer", time: "6:00", block: "🌤️ Tarde", task: "Leer", who: "DA", icon: "📖" },
      { id: "cena", time: "7:00", block: "🌙 Noche", task: "Cena", who: "A", icon: "🍲" },
      { id: "coc_n", time: "7:30", block: "🌙 Noche", task: "Arreglar cocina", who: "D", icon: "🧽" },
      { id: "dorm", time: "9:00", block: "🌙 Noche", task: "Acostarse", who: "DA", icon: "😴", noCheck: true },
    ];
  }

  // ── WEEKDAY BASE ────────────────────────────────────────────
  const base: Task[] = [
    { id: "lev", time: "6:00", block: "🌅 Mañana", task: "Levantarse", who: "DA", icon: "⏰" },
    { id: "tend", time: "6:05", block: "🌅 Mañana", task: "Tender la cama", who: "DA", icon: "🛏️" },
    { id: "desa", time: "6:10", block: "🌅 Mañana", task: "Desayuno", who: "D", icon: "🍳", note: "D cocina siempre" },
    { id: "loza_d", time: "6:35", block: "🌅 Mañana", task: "Lavar loza del desayuno", who: "A", icon: "🍽️" },
    { id: "hab", time: "6:40", block: "🌅 Mañana", task: "Arreglar habitación", who: "D", icon: "🛏️" },
    { id: "sala", time: "6:40", block: "🌅 Mañana", task: "Arreglar sala", who: "A", icon: "🛋️" },
    { id: "coc_m", time: "6:50", block: "🌅 Mañana", task: "Arreglar cocina", who: "A", icon: "🍴" },
    { id: "est", time: "6:50", block: "🌅 Mañana", task: "Arreglar estudio", who: "D", icon: "💻" },
    { id: "barr", time: "7:00", block: "🌅 Mañana", task: "Barrer", who: "Rot", icon: "🧹" },
    { id: "gym", time: "7:00", block: "🌅 Mañana", task: "Gym", who: "DA", icon: "🏋️", note: "7–9am" },
    { id: "work", time: "9:00", block: "💼 Trabajo", task: "Trabajo", who: "DA", icon: "💼", note: "9am–6pm", noCheck: true },
    { id: "alm", time: "12:00", block: "☀️ Mediodía", task: "Almuerzo", who: alm, icon: "🍱", note: `Hoy cocina: ${alm}` },
    { id: "loza_a", time: "12:30", block: "☀️ Mediodía", task: "Lavar loza del almuerzo", who: alm === "D" ? "A" : "D", icon: "🍽️" },
    { id: "coc_a", time: "12:40", block: "☀️ Mediodía", task: "Arreglar cocina", who: "Rot", icon: "🧽" },
    { id: "cena", time: "6:30", block: "🌙 Noche", task: "Cena", who: "A", icon: "🍲" },
    { id: "coc_n", time: "7:00", block: "🌙 Noche", task: "Arreglar cocina", who: "D", icon: "🧽" },
    { id: "leer", time: "7:30", block: "🌙 Noche", task: "Leer", who: "DA", icon: "📖", note: "~30–45 min" },
    { id: "dorm", time: "8:30", block: "🌙 Noche", task: "Acostarse", who: "DA", icon: "😴", note: "8–9pm", noCheck: true },
  ];

  // ── DAY-SPECIFIC EXTRAS ────────────────────────────────────
  const extras: Task[] = [];

  if (dayName === "Lunes") {
    extras.push(
      { id: "x1", time: "9:00", block: "📌 Extra del día", task: "Lavar ropa", who: "DA", icon: "👕" },
      { id: "x2", time: "6:10", block: "📌 Extra del día", task: "Colgar ropa", who: "DA", icon: "🪝", note: "al llegar a casa" },
    );
  }

  if (dayName === "Martes") {
    extras.push(
      { id: "x1", time: "6:15", block: "📌 Extra del día", task: "Descolgar, doblar y guardar ropa", who: "DA", icon: "👔" },
      { id: "x2", time: "7:00", block: "📌 Extra del día", task: "Sacar basura", who: "Rot", icon: "🗑️" },
      { id: "x3", time: "7:10", block: "📌 Extra del día", task: "Trapear", who: "Rot", icon: "🧴" },
    );
  }

  if (dayName === "Miércoles") {
    extras.push(
      { id: "x1", time: "9:00", block: "📌 Extra del día", task: "Lavar ropa", who: "DA", icon: "👕" },
      { id: "x2", time: "6:10", block: "📌 Extra del día", task: "Colgar ropa", who: "DA", icon: "🪝", note: "al llegar a casa" },
      { id: "x3", time: "6:20", block: "📌 Extra del día", task: "Limpiar baño", who: "Rot", icon: "🚿" },
      { id: "x4", time: "6:40", block: "📌 Extra del día", task: "Lavar filtro", who: "D", icon: "💧" },
    );
  }

  if (dayName === "Jueves") {
    extras.push(
      { id: "x1", time: "6:15", block: "📌 Extra del día", task: "Descolgar y doblar ropa", who: "DA", icon: "👔" },
    );
  }

  if (dayName === "Viernes") {
    extras.push(
      { id: "x1", time: "9:00", block: "📌 Extra del día", task: "Lavar y colgar ropa", who: "DA", icon: "👕" },
      { id: "x2", time: "6:10", block: "📌 Extra del día", task: "Sacar basura", who: "Rot", icon: "🗑️" },
      { id: "x3", time: "6:20", block: "📌 Extra del día", task: "Trapear", who: "Rot", icon: "🧴" },
    );
  }

  return [...base, ...extras];
}
