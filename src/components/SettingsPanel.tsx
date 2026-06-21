"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useGroups } from "@/hooks/useGroups";
import styles from "./SettingsPanel.module.css";

interface Props {
  groupId: string;
}

/**
 * Settings view showing user account info, sign-out, dark mode toggle,
 * and group management (Fase 3a).
 */
export default function SettingsPanel({ groupId }: Props) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const { groups, loading: groupsLoading, error: groupsError, createGroup, generateInvite, deleteGroup, setActiveGroup } =
    useGroups();

  const handleDeleteGroup = async (gId: string, name: string) => {
    if (!window.confirm(`¿Borrar el grupo "${name}"? Esto elimina sus miembros y no se puede deshacer.`)) {
      return;
    }
    await deleteGroup(gId);
  };

  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<Record<string, string>>({});
  const [generatingInvite, setGeneratingInvite] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    setCreating(true);
    await createGroup(name);
    setNewGroupName("");
    setCreating(false);
  };

  const handleGenerateInvite = async (gId: string) => {
    setGeneratingInvite(gId);
    const code = await generateInvite(gId);
    if (code) {
      setInviteCodes((prev) => ({ ...prev, [gId]: code }));
    }
    setGeneratingInvite(null);
  };

  const handleCopyInvite = async (gId: string) => {
    const code = inviteCodes[gId];
    if (!code) return;
    const link = `${window.location.origin}/join/${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCode(gId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback: show the link
    }
  };

  return (
    <main className={styles.panel}>
      {/* ── Cuenta ─────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cuenta</h2>
        <div className={styles.card}>
          {user ? (
            <>
              <div className={styles.row}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{user.email}</span>
              </div>
              <button
                className={styles.signOutButton}
                onClick={signOut}
                type="button"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <p className={styles.notSignedIn}>No has iniciado sesión</p>
          )}
        </div>
      </section>

      {/* ── Apariencia ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Apariencia</h2>
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.label}>Modo oscuro</span>
            <span className={styles.toggleValue}>
              {isDark ? "Modo oscuro" : "Modo claro"}
            </span>
          </div>
          <button
            className={`${styles.themeToggle} ${isDark ? styles.themeToggleActive : ""}`}
            onClick={toggleTheme}
            type="button"
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            <span className={styles.toggleTrack}>
              <span
                className={`${styles.toggleThumb} ${isDark ? styles.toggleThumbDark : ""}`}
              />
            </span>
          </button>
        </div>
      </section>

      {/* ── Grupos ─────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Grupos</h2>

        {groupsError && (
          <p className={styles.groupError}>{groupsError}</p>
        )}

        {groupsLoading ? (
          <div className={styles.card}>
            <p className={styles.groupLoading}>Cargando grupos...</p>
          </div>
        ) : (
          <>
            {/* Group list */}
            {groups.map((g) => {
              const isActive = g.id === groupId;
              const code = inviteCodes[g.id] ?? g.inviteCode;
              const inviteLink = code
                ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${code}`
                : null;

              return (
                <div
                  key={g.id}
                  className={`${styles.card} ${styles.groupCard} ${isActive ? styles.groupCardActive : ""}`}
                >
                  <div className={styles.groupHeader}>
                    <div>
                      <span className={styles.groupName}>{g.name}</span>
                      {isActive && (
                        <span className={styles.activeBadge}>activo</span>
                      )}
                    </div>
                    <span className={styles.groupType}>
                      {g.type === "personal" ? "Personal" : "Compartido"}
                    </span>
                  </div>

                  {/* Members */}
                  <div className={styles.memberList}>
                    {g.members.map((m) => (
                      <span key={m.userId} className={styles.memberTag}>
                        {m.displayName ?? m.userId.slice(0, 8)}
                        {m.role === "owner" && (
                          <span className={styles.ownerBadge}> (dueño)</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className={styles.groupActions}>
                    {!isActive && (
                      <button
                        className={styles.switchButton}
                        type="button"
                        onClick={() => setActiveGroup(g.id)}
                      >
                        Cambiar a este grupo
                      </button>
                    )}

                    {/* Delete — only for shared groups you own */}
                    {g.type === "shared" && g.createdBy === user?.id && (
                      <button
                        className={styles.deleteGroupButton}
                        type="button"
                        onClick={() => handleDeleteGroup(g.id, g.name)}
                      >
                        Borrar grupo
                      </button>
                    )}

                    {/* Invite — only for shared groups */}
                    {g.type === "shared" && (
                      <div className={styles.inviteRow}>
                        {!code ? (
                          <button
                            className={styles.inviteButton}
                            type="button"
                            disabled={generatingInvite === g.id}
                            onClick={() => handleGenerateInvite(g.id)}
                          >
                            {generatingInvite === g.id
                              ? "Generando..."
                              : "Invitar"}
                          </button>
                        ) : (
                          <button
                            className={`${styles.inviteButton} ${copiedCode === g.id ? styles.inviteButtonCopied : ""}`}
                            type="button"
                            onClick={() => handleCopyInvite(g.id)}
                            title={inviteLink ?? ""}
                          >
                            {copiedCode === g.id
                              ? "¡Copiado!"
                              : "Copiar enlace de invitación"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Create group form */}
            <form className={styles.card} onSubmit={handleCreateGroup}>
              <p className={styles.label}>Crear grupo compartido</p>
              <div className={styles.createGroupRow}>
                <input
                  className={styles.groupNameInput}
                  type="text"
                  placeholder="Nombre del grupo"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={80}
                  disabled={creating}
                />
                <button
                  className={styles.createGroupButton}
                  type="submit"
                  disabled={creating || !newGroupName.trim()}
                >
                  {creating ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
