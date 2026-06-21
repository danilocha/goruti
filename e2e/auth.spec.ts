import { test, expect } from "@playwright/test";

/**
 * These E2E tests require valid Supabase credentials in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=
 *
 * They also need a test user that can be registered / logged in.
 * Update TEST_EMAIL and TEST_PASSWORD before running.
 *
 * Run: npx playwright test e2e/auth.spec.ts
 */

const BASE = "http://localhost:3000";
const TEST_EMAIL = `e2e-${Date.now()}@test.couple-life.app`;
const TEST_PASSWORD = "TestPassword123!";

test.describe("Auth E2E", () => {
  test("register user → confirm session → refresh → still logged in", async ({
    page,
  }) => {
    // Navigate to register page
    await page.goto(`${BASE}/register`);
    await expect(page.getByText("Crear cuenta")).toBeVisible();

    // Fill and submit registration form
    await page.getByLabel(/correo electrónico/i).fill(TEST_EMAIL);
    await page.getByLabel(/contraseña/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /crear cuenta/i }).click();

    // If sign-up requires email confirmation (depends on Supabase project config),
    // the user may be redirected to "/" but not yet authenticated.
    // Wait for the redirect to complete
    await page.waitForURL("**/");

    // Refresh the page — session should survive if cookies are set correctly
    await page.reload();
    await expect(page.getByText("Rutina de Hogar")).toBeVisible();
  });

  test("login → sign out → verify redirect to /login", async ({ page }) => {
    // First, navigate to login
    await page.goto(`${BASE}/login`);
    await expect(page.getByText("Iniciar sesión")).toBeVisible();

    // Fill and submit login form
    await page.getByLabel(/correo electrónico/i).fill(TEST_EMAIL);
    await page.getByLabel(/contraseña/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    // Should redirect to /
    await page.waitForURL("**/");
    await expect(page.getByText("Rutina de Hogar")).toBeVisible();

    // Click sign-out button
    const signOutButton = page.getByRole("button", { name: /cerrar sesión/i });
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    // Should redirect to /login after sign-out
    await page.waitForURL("**/login");
    await expect(page.getByText("Iniciar sesión")).toBeVisible();
  });
});
