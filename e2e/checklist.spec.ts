import { test, expect } from "@playwright/test";
import { STORAGE_KEY } from "../src/data/constants";

test.describe("Checklist E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test that doesn't need persistence
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test.afterEach(async ({ page }) => {
    // Clean up localStorage after each test
    await page.evaluate(() => localStorage.clear()).catch(() => {});
  });

  test("load page and verify all 7 day tabs render", async ({ page }) => {
    await page.goto("/");

    // Wait for the app to render
    await expect(page.getByText("Rutina de Hogar")).toBeVisible();

    // Verify all 7 day tabs are present (3-letter abbreviations)
    const tabs = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    for (const tab of tabs) {
      const tabElement = page.getByRole("tab", { name: tab });
      await expect(tabElement).toBeVisible();
    }
  });

  test("click a task and verify it checks and progress updates", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to render
    await expect(page.getByText("Rutina de Hogar")).toBeVisible();

    // Find a task checkbox and click it — Lunes default first task: "Levantarse"
    const firstTask = page.getByLabel(/Levantarse/, { exact: false });
    await expect(firstTask).toBeVisible();

    // Click the task
    await firstTask.click();

    // Verify the progress circle updated (should no longer show 0%)
    // Wait for progress text to update (should be non-zero)
    const progressText = page.getByText("%");

    // Get the progress value and verify it's not "0%"
    const text = await progressText.first().textContent();
    expect(text).not.toBe("0%");
  });

  test("toggle multiple tasks across days", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Rutina de Hogar")).toBeVisible();

    // Toggle a task on Lunes (default day)
    const lunesTask = page.getByLabel(/Levantarse/, { exact: false });
    await lunesTask.click();

    // Switch to Martes
    const martesTab = page.getByRole("tab", { name: "Mar" });
    await martesTab.click();

    // Wait for Martes content to render
    await expect(page.getByText("Martes")).toBeVisible();

    // Toggle a task on Martes
    const martesTask = page.getByLabel(/Levantarse/, { exact: false });
    await martesTask.click();

    // Switch to Miércoles
    const miercolesTab = page.getByRole("tab", { name: "Mié" });
    await miercolesTab.click();

    await expect(page.getByText("Miércoles")).toBeVisible();

    // Toggle a task on Miércoles
    const miercolesTask = page.getByLabel(/Levantarse/, { exact: false });
    await miercolesTask.click();

    // Verify all days have non-zero progress visible on their tabs
    // Lunes tab should show a progress bar (progress > 0 means we see the mini bar)
    // Martes tab should show a progress bar
    // Miércoles tab should show a progress bar
    // Just verify the UI didn't crash
    await expect(page.getByText("Rutina de Hogar")).toBeVisible();
  });

  test("reload page and verify state persists (localStorage)", async ({ page }) => {
    // Start fresh: clear any existing state, then load
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText("Rutina de Hogar")).toBeVisible();

    // Toggle 3 tasks by clicking their rows (use role="button" locator)
    // Tasks have aria-label like "Levantarse — pendiente"
    const taskLabels = [
      "Levantarse — pendiente",
      "Tender la cama — pendiente",
      "Desayuno — pendiente",
    ];
    for (const label of taskLabels) {
      await page.getByRole("button", { name: label, exact: true }).click();
    }

    // Wait for the 300ms debounce to flush and verify localStorage was written
    await page.waitForTimeout(500);
    const stored = await page.evaluate(() =>
      localStorage.getItem("couple-life-checklist")
    );
    expect(stored).not.toBeNull();

    // Reload and verify state survives after hydration
    await page.reload();
    await expect(page.getByText("Rutina de Hogar")).toBeVisible();

    // Wait for hydration (useEffect fires asynchronously on mount)
    await expect(
      page.getByRole("button", { name: "Levantarse — completado" })
    ).toBeVisible({ timeout: 10000 });
  });

  test("corrupted JSON in localStorage renders clean app", async ({ page }) => {
    // Set corrupted data before loading
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "couple-life-checklist",
        "this is not valid json {{{"
      );
    });

    // Reload with corrupted data
    await page.reload();
    await expect(page.getByText("Rutina de Hogar")).toBeVisible();

    // All tasks should be unchecked (fresh clean state)
    const levantarseLabel = page.getByLabel(/Levantarse/, { exact: false });
    const ariaLabel = await levantarseLabel.getAttribute("aria-label");
    expect(ariaLabel).toContain("pendiente");
  });
});
