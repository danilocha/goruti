import Link from "next/link";
import styles from "./error.module.css";

export default function ErrorPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>Goruti</div>

        <h1 className={styles.heading}>Algo salió mal</h1>
        <p className={styles.message}>
          Hubo un problema con la autenticación. Intenta de nuevo.
        </p>
        <Link href="/login" className={styles.link}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
