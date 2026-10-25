import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { openHome } from "./helpers";

test("FOUND-01 — page loads with ERP + AI title and cold design tokens", async ({ page }) => {
  await openHome(page);
  await expect(page).toHaveTitle(/ERP.*AI/);
  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return ["--fog-1", "--storm", "--ink", "--accent", "--font-display", "--font-mono"].map((t) => cs.getPropertyValue(t).trim());
  });
  tokens.forEach((t) => expect(t.length).toBeGreaterThan(0));
});

test("FOUND-02 — no amber accent remains in the design tokens", async ({ page }) => {
  await openHome(page);
  const amber = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--amber").trim());
  expect(amber).toBe("");
});

for (const width of [375, 768, 1280]) {
  test(`FOUND-03 — no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openHome(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test("FOUND-04 — required config files exist", async () => {
  for (const f of ["astro.config.mjs", "package.json", "tsconfig.json", "vercel.json"]) expect(existsSync(f)).toBe(true);
});

test("FOUND-05 — entry gate offers sound on/off, then removes itself", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#enter-sound")).toBeVisible({ timeout: 8_000 });
  await expect(page.locator("#enter-silent")).toBeVisible();
  await page.click("#enter-sound");
  await page.waitForFunction(() => !document.getElementById("loader"), null, { timeout: 15_000 });
  await expect(page.locator("body")).toHaveClass(/loaded/);
  await expect(page.locator("#audio-toggle")).toHaveAttribute("aria-pressed", "true");
});

test("FOUND-06 — backdrop canvases are present and WebGL fog is active", async ({ page }) => {
  await openHome(page);
  await expect(page.locator("#fog-canvas")).toHaveCount(1);
  await expect(page.locator("#lattice-canvas")).toHaveCount(1);
  const hasWebgl = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl"));
  if (hasWebgl) await expect(page.locator("body")).toHaveClass(/has-webgl/);
});
