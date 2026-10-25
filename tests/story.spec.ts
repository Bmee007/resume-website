import { test, expect } from "@playwright/test";
import { openHome, jumpTo } from "./helpers";

test("HERO-01 — hero carries the name, role label and platforms", async ({ page }) => {
  await openHome(page);
  await expect(page.locator("#hero h1")).toBeVisible();
  await expect(page.locator("#hero #hero-label")).toContainText(/Borina Keo/i);
  await expect(page.locator("#hero #hero-title")).toContainText("Microsoft Dynamics 365");
  await expect(page.locator("#hero #hero-title")).toContainText("Manhattan DFIO");
});

test("HERO-02 — hero statement lines are revealed after the intro", async ({ page }) => {
  await openHome(page);
  await page.waitForTimeout(2500);
  const opacity = await page.locator("#hero h1").evaluate((el) => getComputedStyle(el).opacity);
  expect(parseFloat(opacity)).toBeGreaterThan(0.9);
  await expect(page.locator("#hero")).toHaveClass(/is-in/);
});

test("HERO-03 — social links and contact CTA are present", async ({ page }) => {
  await openHome(page);
  const hero = page.locator("#hero");
  await expect(hero.locator('a[aria-label="LinkedIn profile"]')).toHaveAttribute("href", /linkedin\.com\/in\/borinakeo/);
  await expect(hero.locator('a[aria-label="GitHub profile"]')).toHaveAttribute("href", /github\.com\/Bmee007/);
  await page.click('#hero a[href="#contact"]');
  await page.waitForTimeout(2600);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("ORIGIN-01 — origin chapter tells the AS400 to D365 story with counters", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#about");
  const about = page.locator("#about");
  await expect(about).toContainText("IBM AS400");
  await expect(about).toContainText("Microsoft Dynamics 365");
  await expect(about).toContainText("Manhattan DFIO");
  await expect(about.locator(".ledger-row")).toHaveCount(4);
  await jumpTo(page, "#about .ledger");
  await expect(about.locator("[data-count='30']")).toHaveText("30%", { timeout: 8_000 });
});

test("NETWORK-01 — network chapter lists the seven distribution centres by city", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#network");
  await expect(page.locator("#network .dc")).toHaveCount(7);
  for (const city of ["Delta", "Calgary", "Regina", "Winnipeg", "Toronto", "Montreal", "Moncton"]) {
    await expect(page.locator("#network .dc-roster")).toContainText(city);
  }
  await expect(page.locator("#network")).toContainText("Seven warehouses");
  await expect(page.locator("#network")).toContainText("99.7%");
});

test("CHANGE-01 — change chapter teaches D365, Copilot, Claude and Gemini", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#change");
  await expect(page.locator("#change .module")).toHaveCount(3);
  for (const t of ["Dynamics 365", "Copilot", "Claude", "Gemini"]) await expect(page.locator("#change")).toContainText(t);
});

test("INTEL-01 — the live console has chips, an input and a readout ledger", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#ask");
  await expect(page.locator("#ask .ask-chip")).toHaveCount(4);
  await expect(page.locator("#ask-send")).toBeDisabled();
  await page.fill("#ask-input", "What did you do with Azure OpenAI?");
  await expect(page.locator("#ask-send")).toBeEnabled();
  await expect(page.locator("#ask-bento .readout-row")).toHaveCount(5);
});

test("RECORD-01 — three roles with bullet accomplishments; two are featured", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#experience");
  await expect(page.locator("#experience .timeline-entry")).toHaveCount(3);
  await expect(page.locator("#experience .timeline-entry.is-featured")).toHaveCount(2);
  await expect(page.locator("#experience .timeline-entry").first().locator(".entry-bullets li").first()).toBeVisible();
});

test("RECORD-02 — spec sheet lists four columns of skill chips, not a plain list", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#skills");
  await expect(page.locator("#skills .spec-col")).toHaveCount(4);
  expect(await page.locator("#skills .skill-chip").count()).toBeGreaterThanOrEqual(12);
  expect(await page.locator("#skills ul li").count()).toBe(0);
  await expect(page.locator("#skills")).toContainText("Azure OpenAI");
});

test("WORK-01 — case studies frame AI integrations and link to GitHub", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#projects");
  await expect(page.locator("#projects .projects-heading")).toContainText("AI");
  await expect(page.locator("#projects .projects-heading")).toContainText("Integrations");
  const cards = page.locator("#projects .project-card:not(.project-card--end)");
  await expect(cards).toHaveCount(3);
  await expect(cards.first().locator(".project-chip").first()).toBeAttached();
  await expect(cards.first().locator(".project-outcome")).toBeAttached();
  await expect(page.locator('#projects a[href*="github.com/Bmee007"]').first()).toBeAttached();
});

test("CONTACT-01 — form has three fields, validates, and targets Formspree", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#contact");
  const form = page.locator("#contact form");
  await expect(form).toHaveAttribute("data-formspree-id", /.+/);
  await expect(form.locator("input, textarea")).toHaveCount(3);
  await form.locator('button[type="submit"]').click();
  await expect(page.locator("#contact .is-invalid").first()).toBeAttached();
  await expect(page.locator("#contact a[href*='linkedin.com/in/borinakeo']")).toBeAttached();
  await expect(page.locator("#contact a[href*='github.com/Bmee007']")).toBeAttached();
});

test("CHARTS-01 — Lieflat figures exist in four chapters and animate in", async ({ page }) => {
  await openHome(page);
  await expect(page.locator("#about [data-chart='dumbbell']")).toHaveCount(1);
  await expect(page.locator("#network [data-chart='gauge']")).toHaveCount(1);
  await expect(page.locator("#ask [data-chart='hundred']")).toHaveCount(1);
  await expect(page.locator("#projects [data-chart='rungs']")).toHaveCount(3);
  await jumpTo(page, "#ask [data-chart='hundred']");
  await page.waitForTimeout(1500);
  await expect(page.locator("#ask [data-chart='hundred']")).toHaveClass(/is-in/);
  expect(await page.locator("#ask [data-chart='hundred'] circle").count()).toBe(100);
});

test("NETWORK-02 — network chapter credits Dynamics 365 as the larger integration", async ({ page }) => {
  await openHome(page);
  await jumpTo(page, "#network");
  await expect(page.locator("#network .net-copy")).toContainText("Dynamics 365 was the larger integration");
  expect(await page.locator("#network .dc .sys--erp").count()).toBe(7);
});
