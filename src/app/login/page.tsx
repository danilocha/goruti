"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = "El correo es obligatorio";
    } else if (!emailRegex.test(email)) {
      errors.email = "Correo electrónico no válido";
    }

    if (!password.trim()) {
      errors.password = "La contraseña es obligatoria";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const triggerShake = () => {
    formRef.current?.classList.add(styles.shake);
    setTimeout(() => {
      formRef.current?.classList.remove(styles.shake);
    }, 300);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Inline validation — catches issues before API call
    if (!validate()) {
      triggerShake();
      return;
    }

    setIsSubmitting(true);

    const { error } = await login(email, password);
    if (error) {
      setError(error);
      triggerShake();
      setIsSubmitting(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>Goruti</div>
        <p className={styles.tagline}>Tu vida en pareja, organizada.</p>

        <h1 className={styles.heading}>Iniciar sesión</h1>

        <form onSubmit={handleSubmit} className={styles.form} ref={formRef} noValidate>
          <div>
            <label htmlFor="email" className={styles.label}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className={styles.fieldError}>{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <p className={styles.fieldError}>{fieldErrors.password}</p>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
          </button>
        </form>

        <p className={styles.footer}>
          ¿No tienes cuenta?{" "}
          <Link href="/register" className={styles.link}>
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
