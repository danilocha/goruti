import type { Metadata } from "next";
import Providers from "./providers";
import { ThemeProvider } from "@/hooks/useTheme";
import { createClient } from "@/lib/supabase/server";
import { syne, dmSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rutina de Hogar — Couple Life",
  description:
    "Checklist diario de rutina del hogar para dos personas — tareas, hábitos y progreso",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/*
         * Flash-prevention inline script — runs synchronously before
         * React hydrates, reads localStorage + system preference, and
         * sets `data-theme` on <html> so all CSS custom properties are
         * correct from the first render.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var e=localStorage.getItem("goruti-theme");if(!e){e=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",e)}catch(e){}}()`,
          }}
        />
      </head>
      <body className={`${syne.variable} ${dmSans.variable}`}>
        {/*
         * ThemeProvider is the OUTERMOST provider — wraps AuthProvider
         * + ChecklistProvider so useTheme() is available everywhere.
         */}
        <ThemeProvider>
          <Providers session={session}>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
