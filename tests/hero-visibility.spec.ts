import { test, expect } from '@playwright/test';

test('hero elements are visible after loader', async ({ page }) => {
  await page.goto('http://localhost:4321');

  // Wait for loader to finish (1.4s) + animation delay (0.2s) + animation duration (~1s)
  await page.waitForTimeout(3000);

  // Take a screenshot
  await page.screenshot({ path: '/tmp/hero-result.jpg', type: 'jpeg', quality: 85, fullPage: false });

  // Check each hero element is visible
  const label  = page.locator('#hero-label');
  const title  = page.locator('#hero-title');
  const sub    = page.locator('#hero-sub');
  const ctas   = page.locator('#hero-ctas');
  const social = page.locator('#hero-social');

  await expect(label).toBeVisible();
  await expect(title).toBeVisible();
  await expect(sub).toBeVisible();
  await expect(ctas).toBeVisible();
  await expect(social).toBeVisible();

  // Check opacity is not 0
  const labelOpacity = await label.evaluate(el => window.getComputedStyle(el).opacity);
  console.log('hero-label opacity:', labelOpacity);
  expect(parseFloat(labelOpacity)).toBeGreaterThan(0.5);
});
