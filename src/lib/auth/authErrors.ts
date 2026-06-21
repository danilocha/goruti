/**
 * Maps raw Supabase Auth error messages (English) to Spanish, user-facing
 * copy. Supabase returns error strings, not stable codes, so we match on
 * known substrings and fall back to a generic message.
 */
export function translateAuthError(message: string | null | undefined): string {
  if (!message) return "Ocurrió un error. Inténtalo de nuevo.";

  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Correo electrónico o contraseña incorrectos.";
  }
  if (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("duplicate")
  ) {
    return "Este correo electrónico ya está registrado. Prueba con otro o inicia sesión.";
  }
  if (m.includes("email address") && m.includes("invalid")) {
    return "El correo electrónico no es válido.";
  }
  if (m.includes("email rate limit") || m.includes("rate limit")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }
  if (m.includes("password should be at least") || m.includes("password")) {
    return "La contraseña no cumple los requisitos mínimos.";
  }
  if (m.includes("email not confirmed")) {
    return "Debes confirmar tu correo electrónico antes de iniciar sesión.";
  }
  if (m.includes("user not found")) {
    return "No existe una cuenta con este correo electrónico.";
  }

  return "Ocurrió un error. Inténtalo de nuevo.";
}
