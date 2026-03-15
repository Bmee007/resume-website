import { test, expect } from "@playwright/test";

// HERO-01 — Hero heading visible in viewport at page load
test("HERO-01 @smoke — hero section contains name and title heading", async ({
  page,
}) => {
  await page.goto("/");
  const heroHeading = page.locator("#hero h1");
  await expect(heroHeading).toContainText("Borina Keo");
  await expect(heroHeading).toContainText("ERP & WMS AI Integration Leader");
});

// HERO-02 — Hero photo visible
test("HERO-02 @smoke — hero photo is visible in hero section", async ({
  page,
}) => {
  await page.goto("/");
  const heroPhoto = page.locator('img.hero-photo, [data-testid="hero-photo"]');
  await expect(heroPhoto).toBeVisible();
});

// HERO-03 — CTA link scrolls to contact section
test("HERO-03 @smoke — contact CTA button scrolls to #contact section", async ({
  page,
}) => {
  await page.goto("/");
  await page.click('a[href="#contact"]');
  await expect(page.locator("#contact")).toBeInViewport();
});

// HERO-04 — Social icon links visible with correct hrefs
test("HERO-04 @smoke — LinkedIn and GitHub social icon links are visible", async ({
  page,
}) => {
  await page.goto("/");
  const linkedin = page.locator('a[aria-label="LinkedIn profile"]');
  const github = page.locator('a[aria-label="GitHub profile"]');
  await expect(linkedin).toBeVisible();
  await expect(github).toBeVisible();
  await expect(linkedin).toHaveAttribute("href", /linkedin\.com/);
  await expect(github).toHaveAttribute("href", /github\.com\/Bmee007/);
});

// ABOUT-01 — About section visible with bio content
test("ABOUT-01 @smoke — about section is visible with bio content", async ({
  page,
}) => {
  await page.goto("/");
  const aboutSection = page.locator("#about");
  await aboutSection.scrollIntoViewIfNeeded();
  await expect(aboutSection).toBeVisible();
  const bioParagraph = page.locator(".about-bio");
  await expect(bioParagraph).toBeVisible();
});

// ABOUT-02 — About section contains key technology terms
test("ABOUT-02 @smoke — about section bio contains D365, Manhattan DFIO, and IBM AS400", async ({
  page,
}) => {
  await page.goto("/");
  const aboutSection = page.locator("#about");
  await aboutSection.scrollIntoViewIfNeeded();
  await expect(aboutSection).toContainText("D365");
  await expect(aboutSection).toContainText("Manhattan DFIO");
  await expect(aboutSection).toContainText("IBM AS400");
});

// ABOUT-03 — Three stat callout boxes present
test("ABOUT-03 @smoke — three stat callout boxes are visible in about section", async ({
  page,
}) => {
  await page.goto("/");
  const aboutSection = page.locator("#about");
  await aboutSection.scrollIntoViewIfNeeded();
  const statBoxes = page.locator('.stat-box, [data-testid="stat-box"]');
  await expect(statBoxes).toHaveCount(3);
});

// SKILL-01 — Skills section has 4 skill category cards
test("SKILL-01 @smoke — skills section contains 4 category cards", async ({
  page,
}) => {
  await page.goto("/");
  const skillsSection = page.locator("#skills");
  await skillsSection.scrollIntoViewIfNeeded();
  const skillCards = page.locator(".skill-card");
  await expect(skillCards).toHaveCount(4);
});

// SKILL-02 — Skills section contains ERP system names
test("SKILL-02 @smoke — skills section contains Microsoft Dynamics 365 and IBM AS400", async ({
  page,
}) => {
  await page.goto("/");
  const skillsSection = page.locator("#skills");
  await skillsSection.scrollIntoViewIfNeeded();
  await expect(skillsSection).toContainText("Microsoft Dynamics 365");
  await expect(skillsSection).toContainText("IBM AS400");
});

// SKILL-03 — Skills section contains WMS system name
test("SKILL-03 @smoke — skills section contains Manhattan DFIO", async ({
  page,
}) => {
  await page.goto("/");
  const skillsSection = page.locator("#skills");
  await skillsSection.scrollIntoViewIfNeeded();
  await expect(skillsSection).toContainText("Manhattan DFIO");
});

// SKILL-04 — Skills section contains AI/ML tool names
test("SKILL-04 @smoke — skills section contains Azure OpenAI and Power Automate", async ({
  page,
}) => {
  await page.goto("/");
  const skillsSection = page.locator("#skills");
  await skillsSection.scrollIntoViewIfNeeded();
  await expect(skillsSection).toContainText("Azure OpenAI");
  await expect(skillsSection).toContainText("Power Automate");
});

// SKILL-05 — Skills use chip elements, not plain list items
test("SKILL-05 @smoke — skills are displayed as chip elements, not plain ul/li list", async ({
  page,
}) => {
  await page.goto("/");
  const skillsSection = page.locator("#skills");
  await skillsSection.scrollIntoViewIfNeeded();
  const chipCount = await page.locator("#skills .skill-chip").count();
  expect(chipCount).toBeGreaterThan(0);
  const plainListCount = await page.locator("#skills ul li").count();
  expect(plainListCount).toBe(0);
});
