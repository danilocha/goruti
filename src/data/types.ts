export type Person = "D" | "A" | "Rot" | "DA";

// ── Routine Builder v2 domain types ──────────────────────────────────

export interface TaskSchedule {
  type: "weekly";
  days: DayName[];
}

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

export interface RoutineTask {
  id: string;
  routineId: string;
  name: string;
  icon: string | null;
  block: string | null;
  timeLabel: string | null;
  note: string | null;
  noCheck: boolean;
  schedule: TaskSchedule;
  assignedTo: string[] | null;
  position: number;
}

export interface Routine {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  templateId: string | null;
}

export interface Group {
  id: string;
  name: string;
  type: "personal" | "shared";
  createdBy: string;
  inviteCode: string | null;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: "owner" | "member";
}

export interface Profile {
  id: string;
  displayName: string | null;
  createdAt: string;
}

export interface GroupWithMembers extends Group {
  members: Array<{ userId: string; role: "owner" | "member"; displayName: string | null }>;
}

export interface TaskInput {
  name: string;
  icon?: string | null;
  block?: string | null;
  timeLabel?: string | null;
  note?: string | null;
  noCheck?: boolean;
  schedule: TaskSchedule;
  position?: number;
}

export interface Completion {
  id: string;
  routineId: string;
  taskId: string;
  userId: string;
  completedDate: string;
  completedAt: string;
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
