"use client";

import styles from "./BottomNav.module.css";

export type TabId = "home" | "progress" | "rutinas" | "settings" | "asistente";

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: "home", label: "Inicio", icon: "home_app_logo" },
  { id: "progress", label: "Progreso", icon: "analytics" },
  { id: "rutinas", label: "Rutinas", icon: "edit_note" },
  { id: "settings", label: "Ajustes", icon: "settings" },
  { id: "asistente", label: "Asistente", icon: "auto_awesome" },
];

/**
 * Fixed bottom tab bar (mobile only — hidden on desktop).
 * Three tabs: Inicio, Progreso, Configuración.
 * Active tab highlighted with lime pill + filled Material Symbol.
 */
export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className={styles.nav} role="tablist" aria-label="Navegación principal">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
            >
              {tab.icon}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
