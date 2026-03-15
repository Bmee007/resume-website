import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

// EXP-01 — Experience section visible with 3 timeline entries
test("EXP-01 @smoke — experience section visible with 3 timeline entries", async ({
  page,
}) => {
  const experienceSection = page.locator("#experience");
  await experienceSection.scrollIntoViewIfNeeded();
  await expect(experienceSection).toBeVisible();
  await expect(page.locator("#experience .timeline-entry")).toHaveCount(3);
});

// EXP-02 — First timeline entry contains company, title, date range, and bullet list
test("EXP-02 @smoke — first timeline entry contains role details and bullet accomplishments", async ({
  page,
}) => {
  const experienceSection = page.locator("#experience");
  await experienceSection.scrollIntoViewIfNeeded();
  const firstEntry = page.locator("#experience .timeline-entry").first();
  await firstEntry.scrollIntoViewIfNeeded();
  await expect(firstEntry).toBeVisible();
  // Should contain a date range (4-digit year)
  await expect(firstEntry).toContainText(/\d{4}/);
  // Should contain a bullet list item
  const listItem = firstEntry.locator("li").first();
  await expect(listItem).toBeVisible();
});

// EXP-03 — Featured entry for D365 / Dynamics 365
test("EXP-03 @smoke — featured timeline entry contains D365 or Dynamics 365", async ({
  page,
}) => {
  const experienceSection = page.locator("#experience");
  await experienceSection.scrollIntoViewIfNeeded();
  const featuredEntries = page.locator("#experience .timeline-entry.is-featured");
  await expect(featuredEntries.filter({ hasText: /D365|Dynamics 365/i })).toBeVisible();
});

// EXP-04 — Featured entry for Manhattan DFIO
test("EXP-04 @smoke — featured timeline entry contains Manhattan DFIO", async ({
  page,
}) => {
  const experienceSection = page.locator("#experience");
  await experienceSection.scrollIntoViewIfNeeded();
  const featuredEntries = page.locator("#experience .timeline-entry.is-featured");
  await expect(featuredEntries.filter({ hasText: /Manhattan DFIO/i })).toBeVisible();
});

// EXP-05 — Experience section has no horizontal overflow at 375px viewport
test("EXP-05 @smoke — experience section has no horizontal overflow on mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const experienceSection = page.locator("#experience");
  await experienceSection.scrollIntoViewIfNeeded();
  // First confirm the section has timeline entries (not just an empty stub)
  await expect(page.locator("#experience .timeline-entry")).toHaveCount(3);
  const noOverflow = await page.evaluate(() => {
    const el = document.querySelector("#experience") as HTMLElement | null;
    if (!el) return false;
    return el.scrollWidth === el.offsetWidth;
  });
  expect(noOverflow).toBe(true);
});

// PROJ-01 — Projects section visible with 2-4 project cards
test("PROJ-01 @smoke — projects section visible with 2 to 4 project cards", async ({
  page,
}) => {
  const projectsSection = page.locator("#projects");
  await projectsSection.scrollIntoViewIfNeeded();
  await expect(projectsSection).toBeVisible();
  const cardCount = await page.locator("#projects .project-card").count();
  expect(cardCount).toBeGreaterThanOrEqual(2);
  expect(cardCount).toBeLessThanOrEqual(4);
});

// PROJ-02 — Each project card contains at least one chip and an outcome element
test("PROJ-02 @smoke — each project card contains chip and outcome elements", async ({
  page,
}) => {
  const projectsSection = page.locator("#projects");
  await projectsSection.scrollIntoViewIfNeeded();
  // First confirm cards exist (not vacuously true on empty section)
  const cards = page.locator("#projects .project-card");
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(2);
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator(".project-chip").first()).toBeVisible();
    await expect(card.locator(".project-outcome")).toBeVisible();
  }
});

// PROJ-03 — At least one link in projects section points to GitHub profile
test("PROJ-03 @smoke — at least one project card links to github.com/Bmee007", async ({
  page,
}) => {
  const projectsSection = page.locator("#projects");
  await projectsSection.scrollIntoViewIfNeeded();
  await expect(
    page.locator('#projects a[href*="github.com/Bmee007"]')
  ).toBeVisible();
});

// PROJ-04 — Projects section contains leadership framing text
test("PROJ-04 @smoke — projects section tagline contains leading/lead framing", async ({
  page,
}) => {
  const projectsSection = page.locator("#projects");
  await projectsSection.scrollIntoViewIfNeeded();
  await expect(page.locator("#projects")).toContainText(/[Ll]ead/i);
});
