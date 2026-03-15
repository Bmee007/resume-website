import { test, expect } from "@playwright/test";

// SEO-04: MANUAL ONLY — Core Web Vitals (LCP < 2.5s, CLS < 0.1, FID < 100ms) via PageSpeed Insights
// No automated test created — requires production deployment and Google's measurement infrastructure.

// POLSH-04: MANUAL ONLY — WCAG AA contrast audit via axe DevTools or WebAIM Contrast Checker
// No automated test created — full contrast audit requires manual review of all color combinations.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

// SEO-01 — Page title, meta description, and canonical URL
test("SEO-01 @smoke — page title contains 'ERP' and 'AI'; meta description is substantive (>100 chars); canonical link tag present", async ({
  page,
}) => {
  const title = await page.title();
  expect(title).toMatch(/ERP/);
  expect(title).toMatch(/AI/);

  // Meta description must exist and be substantive (>100 chars — SEO best practice is 150-160 chars)
  const metaDescription = page.locator('meta[name="description"]');
  await expect(metaDescription).toHaveCount(1);
  const content = await metaDescription.getAttribute("content");
  expect(content).toBeTruthy();
  expect((content as string).length).toBeGreaterThan(100);

  // Phase 5 SEO: canonical URL link tag must be present
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  const canonicalHref = await canonical.getAttribute("href");
  expect(canonicalHref).toBeTruthy();
});

// SEO-02 — JSON-LD structured data with Person schema
test("SEO-02 @smoke — JSON-LD script with @type:Person and LinkedIn/GitHub sameAs links", async ({
  page,
}) => {
  const jsonLdScript = page.locator('script[type="application/ld+json"]');
  await expect(jsonLdScript).toHaveCount(1);

  const scriptContent = await jsonLdScript.textContent();
  expect(scriptContent).toBeTruthy();

  const parsed = JSON.parse(scriptContent as string);
  expect(parsed["@type"]).toBe("Person");

  const sameAs: string[] = parsed["sameAs"] ?? [];
  const hasLinkedIn = sameAs.some((url: string) => url.includes("linkedin.com"));
  const hasGitHub = sameAs.some((url: string) => url.includes("github.com"));
  expect(hasLinkedIn).toBe(true);
  expect(hasGitHub).toBe(true);
});

// SEO-03 — Open Graph meta tags
test("SEO-03 @smoke — OG image, title, and description meta tags present in head", async ({
  page,
}) => {
  const ogImage = page.locator('meta[property="og:image"]');
  await expect(ogImage).toHaveCount(1);
  const ogImageContent = await ogImage.getAttribute("content");
  expect(ogImageContent).toBeTruthy();

  const ogTitle = page.locator('meta[property="og:title"]');
  await expect(ogTitle).toHaveCount(1);
  const ogTitleContent = await ogTitle.getAttribute("content");
  expect(ogTitleContent).toBeTruthy();

  const ogDescription = page.locator('meta[property="og:description"]');
  await expect(ogDescription).toHaveCount(1);
  const ogDescContent = await ogDescription.getAttribute("content");
  expect(ogDescContent).toBeTruthy();
});

// SEO-05 — All images have non-empty alt attributes, and hero/OG image meets Phase 5 alt requirements
test("SEO-05 @smoke — every img element has a non-empty alt attribute; hero photo alt is descriptive (>20 chars); OG image is present in public/", async ({
  page,
}) => {
  const imgs = page.locator("img");
  const count = await imgs.count();
  // Must have at least one image
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const alt = await imgs.nth(i).getAttribute("alt");
    expect(alt, `img at index ${i} must have a non-empty alt attribute`).toBeTruthy();
    expect((alt as string).length, `img at index ${i} alt must be non-empty`).toBeGreaterThan(0);
  }

  // Hero photo must have a descriptive alt (>20 chars) containing the person's name
  const heroPhoto = page.locator(".hero-photo");
  await expect(heroPhoto).toHaveCount(1);
  const heroAlt = await heroPhoto.getAttribute("alt");
  expect(heroAlt).toBeTruthy();
  expect((heroAlt as string).length).toBeGreaterThan(20);
  expect(heroAlt as string).toMatch(/Borina Keo/);

  // Phase 5 adds a public OG image at /og-image.png — verify it returns HTTP 200
  const ogImageResponse = await page.request.get("/og-image.png");
  expect(ogImageResponse.status()).toBe(200);
});

// SEO-06 — Sitemap and robots.txt return HTTP 200
test("SEO-06 @smoke — /sitemap-index.xml returns 200; /robots.txt returns 200 with Sitemap: reference", async ({
  page,
}) => {
  const sitemapResponse = await page.request.get("/sitemap-index.xml");
  expect(sitemapResponse.status()).toBe(200);

  const robotsResponse = await page.request.get("/robots.txt");
  expect(robotsResponse.status()).toBe(200);

  const robotsBody = await robotsResponse.text();
  expect(robotsBody).toContain("Sitemap:");
});

// POLSH-01 — Scroll-triggered fade-in animation
test("POLSH-01 @smoke — .section-animate element gains is-visible class after scrolling into view", async ({
  page,
}) => {
  const animatedEl = page.locator(".section-animate").first();
  await expect(animatedEl).toHaveCount(1);

  // Scroll to trigger the IntersectionObserver
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(700); // allow animation observer to fire

  await expect(animatedEl).toHaveClass(/is-visible/);

  // Element must be visible (opacity > 0) after class is applied
  const opacity = await animatedEl.evaluate((el) =>
    parseFloat(getComputedStyle(el).opacity)
  );
  expect(opacity).toBeGreaterThan(0);
});

// POLSH-02 — Hover effects on interactive cards
test("POLSH-02 @smoke — .skill-card has CSS transition containing 'transform'; hover applies translateY; .project-card and .entry-card respond similarly", async ({
  page,
}) => {
  // Check .skill-card transition
  const skillCard = page.locator(".skill-card").first();
  await skillCard.scrollIntoViewIfNeeded();

  const skillTransition = await skillCard.evaluate((el) =>
    getComputedStyle(el).transition
  );
  expect(skillTransition).toContain("transform");

  // Hover .skill-card and check transform changes
  await page.hover(".skill-card");
  // Wait for CSS transition (200ms) to complete before reading computed style
  await page.waitForTimeout(250);
  const skillTransform = await skillCard.evaluate((el) =>
    getComputedStyle(el).transform
  );
  // A non-identity transform indicates translateY is applied
  expect(skillTransform).not.toBe("none");
  expect(skillTransform).not.toBe("matrix(1, 0, 0, 1, 0, 0)");

  // Check .project-card has transition with transform
  const projectCard = page.locator(".project-card").first();
  await projectCard.scrollIntoViewIfNeeded();
  const projectTransition = await projectCard.evaluate((el) =>
    getComputedStyle(el).transition
  );
  expect(projectTransition).toContain("transform");

  // Check .entry-card has transition with transform
  const entryCard = page.locator(".entry-card").first();
  await entryCard.scrollIntoViewIfNeeded();
  const entryTransition = await entryCard.evaluate((el) =>
    getComputedStyle(el).transition
  );
  expect(entryTransition).toContain("transform");
});

// POLSH-03 — Emerald accent color appears across at least 3 distinct element types
test("POLSH-03 @smoke — emerald #10B981 appears in computed styles on at least 3 distinct element types", async ({
  page,
}) => {
  const emeraldHex = "#10b981";
  const emeraldRgb = "rgb(16, 185, 129)";
  const emeraldRgba = "rgba(16, 185, 129,";

  const emeraldCount = await page.evaluate(
    ({ hex, rgb, rgba }) => {
      const selectors = [
        // Photo outline / hero photo border
        ".hero-photo",
        // Section headings with accent
        "h2",
        // Social icon links
        ".social-icon-link",
        // Nav active link
        ".nav-link.active",
        // Skill chip / tag elements
        ".skill-chip",
        ".project-chip",
        // Any element with emerald color
        "[class*='emerald']",
      ];

      let matchCount = 0;
      const matchedSelectors = new Set<string>();

      selectors.forEach((sel) => {
        const els = document.querySelectorAll(sel);
        els.forEach((el) => {
          const style = getComputedStyle(el);
          const colorProps = [
            style.color,
            style.borderColor,
            style.outlineColor,
            style.backgroundColor,
            style.boxShadow,
          ];
          const matched = colorProps.some(
            (v) => v.includes(rgb) || v.toLowerCase().includes(hex) || v.includes(rgba)
          );
          if (matched && !matchedSelectors.has(sel)) {
            matchedSelectors.add(sel);
            matchCount++;
          }
        });
      });

      return matchCount;
    },
    { hex: emeraldHex, rgb: emeraldRgb, rgba: emeraldRgba }
  );

  expect(emeraldCount).toBeGreaterThanOrEqual(3);
});

// POLSH-05 — Custom 404 page with navigation and home CTA
test("POLSH-05 @smoke — /nonexistent-path returns page with nav and a link to '/' (home CTA)", async ({
  page,
}) => {
  await page.goto("/this-page-does-not-exist");

  // Nav must be present
  const nav = page.locator(".desktop-nav, nav[aria-label]").first();
  await expect(nav).toBeVisible();

  // A link back to home must exist
  const homeLink = page.locator('a[href="/"]').first();
  await expect(homeLink).toBeVisible();
});
