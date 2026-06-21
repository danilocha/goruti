/**
 * /join/[code] — Server Component.
 *
 * Looks up the group by invite code using the SECURITY DEFINER RPC
 * `get_group_by_invite` (readable before the user joins).
 *
 * Shows the group name and a client "Unirme" button.
 * The route is protected by middleware — anonymous users are redirected
 * to /login?redirect=/join/[code] automatically.
 */

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import JoinButton from "./JoinButton";
import styles from "./join.module.css";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  // Use the SECURITY DEFINER RPC so we can read the group before joining
  const { data, error } = await supabase.rpc("get_group_by_invite", {
    p_code: code,
  });

  const group = Array.isArray(data) ? data[0] : data;

  if (error || !group) {
    return (
      <div className={styles.page}>
        <div className={styles.invalidCard}>
          <p className={styles.invalidTitle}>Invitación inválida</p>
          <p className={styles.invalidMessage}>
            Este enlace de invitación no es válido o ya expiró.
          </p>
          <Link href="/" className={styles.backLink}>
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>🏠</div>
        <h1 className={styles.title}>
          Te invitaron a{" "}
          <span className={styles.groupName}>{group.name}</span>
        </h1>
        <p className={styles.subtitle}>
          Únete para compartir rutinas y hábitos con tu grupo.
        </p>
        <JoinButton code={code} />
      </div>
    </div>
  );
}
