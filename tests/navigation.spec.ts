import { test, expect } from "@playwright/test";
import { openHome, jumpTo } from "./helpers";

test("NAV-01 — site nav is fixed; hides on a fast scroll down, returns on scroll up", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#network");
  const nav = page.locator("#site-nav");
  await expect(nav).toHaveCSS("position", "fixed");
  await expect(nav).toHaveClass(/is-hidden/, { timeout: 4_000 }); // a long jump down tucks the chrome away
  await page.evaluate(() => window.scrollBy(0, -40));
  await expect(nav).not.toHaveClass(/is-hidden/, { timeout: 4_000 });
  await expect(nav).toBeInViewport();
});

test("NAV-02 — chapter links reach their sections", async ({ page }) => {
  await openHome(page);
  const hamburger = page.locator("#hamburger");
  if (await hamburger.isVisible()) {
    await hamburger.click();
    await expect(page.locator("#mobile-menu")).toHaveClass(/is-open/);
    await page.click('a.mobile-link[href="#about"]');
  } else {
    await page.click('.desktop-nav a[href="#about"]');
  }
  await page.waitForTimeout(2200);
  await expect(page.locator("#about")).toBeInViewport();
});

test("NAV-03 — the active chapter is marked in the nav and the rail", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#network");
  await expect(page.locator('a.nav-link.active[href="#network"]').first()).toHaveCount(1, { timeout: 8_000 });
  await expect(page.locator("#rail-num")).toHaveText("02", { timeout: 8_000 });
});

test("NAV-04 — dark chapters flip the html tone", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#about");
  await page.waitForTimeout(800);
  await expect(page.locator("html")).toHaveAttribute("data-tone", "dark");
  await jumpTo(page, "#ask");
  await page.waitForTimeout(800);
  await expect(page.locator("html")).toHaveAttribute("data-tone", "light");
});

test("NAV-05 — hamburger overlay opens and closes on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openHome(page);
  await expect(page.locator("#hamburger")).toBeVisible();
  await expect(page.locator(".desktop-nav")).not.toBeVisible();
  await page.click("#hamburger");
  await expect(page.locator("#mobile-menu")).toHaveClass(/is-open/);
  await page.click('a.mobile-link[href="#about"]');
  await expect(page.locator("#mobile-menu")).toHaveAttribute("inert", "");
});

test("NAV-06 — 404 page keeps the nav and links home", async ({ page }) => {
  await page.goto("/nonexistent-path");
  await expect(page.locator("#site-nav")).toHaveCount(1);
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
});
