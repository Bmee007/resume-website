import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";

test("SEO-01 — title, description and canonical", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ERP.*AI/);
  const desc = await page.locator('meta[name="description"]').getAttribute("content");
  expect((desc ?? "").length).toBeGreaterThan(100);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
});

test("SEO-02 — JSON-LD Person with sameAs links", async ({ page }) => {
  await page.goto("/");
  const json = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(json["@type"]).toBe("Person");
  expect(json.sameAs.join(" ")).toMatch(/linkedin/);
  expect(json.sameAs.join(" ")).toMatch(/github/);
});

test("SEO-03 — Open Graph tags and image file", async ({ page }) => {
  await page.goto("/");
  for (const p of ["og:image", "og:title", "og:description"]) {
    expect(await page.locator(`meta[property="${p}"]`).getAttribute("content")).toBeTruthy();
  }
  expect(existsSync("public/og-image.png")).toBe(true);
});

test("SEO-04 — sitemap configured and referenced by robots.txt", async () => {
  expect(readFileSync("astro.config.mjs", "utf8")).toMatch(/sitemap/);
  expect(readFileSync("public/robots.txt", "utf8")).toMatch(/Sitemap/i);
});

test("A11Y-01 — reduced motion still renders all content visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(1200);
  await expect(page.locator("#loader")).toHaveCount(0);
  const opacity = await page.locator("#manifesto [data-split]").evaluate((el) => getComputedStyle(el).opacity);
  expect(parseFloat(opacity)).toBe(1);
});
