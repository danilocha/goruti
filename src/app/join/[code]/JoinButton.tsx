"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGroups } from "@/hooks/useGroups";
import styles from "./join.module.css";

interface Props {
  code: string;
}

/**
 * JoinButton — calls joinByInvite(code) then redirects to home.
 * Client component nested inside the /join/[code] Server Component.
 */
export default function JoinButton({ code }: Props) {
  const router = useRouter();
  const { joinByInvite } = useGroups();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      const groupId = await joinByInvite(code);
      // Set the newly joined group as active and go home
      const maxAge = 60 * 60 * 24 * 30;
      document.cookie = `goruti-active-group=${groupId}; path=/; max-age=${maxAge}; SameSite=Lax`;
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo unir al grupo");
      setLoading(false);
    }
  };

  return (
    <div className={styles.actions}>
      {error && <p className={styles.error}>{error}</p>}
      <button
        className={styles.joinButton}
        type="button"
        onClick={handleJoin}
        disabled={loading}
      >
        {loading ? "Uniéndome..." : "Unirme al grupo"}
      </button>
    </div>
  );
}
