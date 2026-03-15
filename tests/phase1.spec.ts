import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// FOUND-01 — dev server page loads
test("FOUND-01 @smoke — page loads with correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Borina Keo/);
});

// FOUND-02 — design tokens on :root
test("FOUND-02 @smoke — design tokens are set on :root", async ({ page }) => {
  await page.goto("/");

  const accentColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim()
  );
  expect(accentColor === "#10B981" || accentColor === "rgb(16, 185, 129)").toBe(
    true
  );

  const bgColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-bg")
      .trim()
  );
  expect(bgColor === "#0F172A" || bgColor === "rgb(15, 23, 42)").toBe(true);
});

// FOUND-03 — responsive layout at all three viewports
test("FOUND-03 @smoke — no horizontal overflow at 375px viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const noOverflow = await page.evaluate(
    () => document.body.scrollWidth <= window.innerWidth
  );
  expect(noOverflow).toBe(true);
});

test("FOUND-03 @smoke — no horizontal overflow at 768px viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  const noOverflow = await page.evaluate(
    () => document.body.scrollWidth <= window.innerWidth
  );
  expect(noOverflow).toBe(true);
});

test("FOUND-03 @smoke — no horizontal overflow at 1280px viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const noOverflow = await page.evaluate(
    () => document.body.scrollWidth <= window.innerWidth
  );
  expect(noOverflow).toBe(true);
});

// FOUND-05 — config files exist (filesystem check)
test("FOUND-05 @smoke — required config files exist in project root", async () => {
  expect(fs.existsSync(path.join(PROJECT_ROOT, "astro.config.mjs"))).toBe(
    true
  );
  expect(fs.existsSync(path.join(PROJECT_ROOT, "package.json"))).toBe(true);
  expect(fs.existsSync(path.join(PROJECT_ROOT, ".gitignore"))).toBe(true);
});

// NAV-01 — nav is sticky
test("NAV-01 @smoke — site nav is sticky/fixed on scroll", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    window.scrollTo(0, document.body.scrollHeight)
  );
  const nav = page.locator("#site-nav");
  await expect(nav).toBeVisible();
  const position = await nav.evaluate(
    (el) => getComputedStyle(el).position
  );
  expect(position).toBe("fixed");
});

// NAV-02 — smooth scroll to section
test("NAV-02 @smoke — clicking nav link scrolls to #about section", async ({
  page,
}) => {
  await page.goto("/");

  // On mobile (< 768px), desktop nav is hidden — open hamburger first
  const hamburger = page.locator("#hamburger");
  const isHamburgerVisible = await hamburger.isVisible();
  if (isHamburgerVisible) {
    await hamburger.click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await page.click('a.mobile-nav-link[href="#about"]');
  } else {
    await page.click('.desktop-nav a[href="#about"]');
  }

  await expect(page.locator("#about")).toBeInViewport();
});

// NAV-03 — active section highlighting
test("NAV-03 @smoke — nav link gets active class when section is in view", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const navLink = page.locator('.desktop-nav a[href="#skills"]');
  await expect(navLink).toHaveClass(/active/);
});

// NAV-04 — hamburger menu on mobile (375px viewport)
test("NAV-04 @smoke — hamburger menu works on mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  // Hamburger visible, desktop nav hidden
  await expect(page.locator("#hamburger")).toBeVisible();
  await expect(page.locator(".desktop-nav")).not.toBeVisible();

  // Open mobile menu
  await page.click("#hamburger");
  await expect(page.locator("#mobile-menu")).toBeVisible();

  // Click a mobile nav link closes menu
  await page.click('a.mobile-nav-link[href="#about"]');
  await expect(page.locator("#mobile-menu")).toBeHidden();
});
