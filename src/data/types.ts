export type Person = "D" | "A" | "Rot" | "DA";

export type DayName =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado"
  | "Domingo";

export interface Task {
  id: string;
  time: string;
  block: string;
  task: string;
  who: Person;
  icon: string;
  note?: string;
  noCheck?: boolean;
}

export interface DayPalette {
  border: string;
  header: string;
  light: string;
}

export interface CheckState {
  [day: string]: { [taskId: string]: boolean } | undefined;
}

export type ChecklistAction =
  | { type: "TOGGLE_TASK"; day: string; taskId: string }
  | { type: "HYDRATE"; state: CheckState }
  | { type: "RESET_ALL" };
