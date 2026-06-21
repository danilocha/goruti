"use client";

import { useState } from "react";
import { CURATED_TEMPLATES } from "@/data/templates";
import type { RoutineTemplate } from "@/data/templates";
import styles from "./TemplateGallery.module.css";

interface Props {
  onInstall: (template: RoutineTemplate) => Promise<void>;
  onBack: () => void;
}

/**
 * TemplateGallery — shows curated routine templates the user can install.
 * "Usar esta plantilla" calls onInstall and shows a brief loading state.
 */
export default function TemplateGallery({ onInstall, onBack }: Props) {
  const [installing, setInstalling] = useState<string | null>(null);

  async function handleInstall(template: RoutineTemplate) {
    setInstalling(template.id);
    await onInstall(template);
    setInstalling(null);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onBack}
          aria-label="Volver a rutinas"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Volver
        </button>
        <h2 className={styles.heading}>Plantillas</h2>
        <p className={styles.subheading}>
          Elige una rutina prediseñada e instálala con un toque.
        </p>
      </div>

      <div className={styles.grid}>
        {CURATED_TEMPLATES.map((template) => {
          const isInstalling = installing === template.id;
          return (
            <div key={template.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {template.icon}
                </span>
                <span className={styles.categoryChip}>{template.category}</span>
              </div>

              <h3 className={styles.cardName}>{template.name}</h3>
              <p className={styles.cardDesc}>{template.description}</p>

              <span className={styles.taskCount}>
                {template.tasks.length}{" "}
                {template.tasks.length === 1 ? "tarea" : "tareas"}
              </span>

              <button
                type="button"
                className={styles.installBtn}
                onClick={() => handleInstall(template)}
                disabled={isInstalling || installing !== null}
                aria-label={`Usar plantilla ${template.name}`}
              >
                {isInstalling ? "Instalando…" : "Usar esta plantilla"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
