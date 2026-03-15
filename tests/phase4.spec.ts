import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

// CONT-01 — Contact section exists at bottom of page
test("CONT-01 @smoke — contact section exists at bottom of page", async ({
  page,
}) => {
  const contact = page.locator("#contact");
  await contact.scrollIntoViewIfNeeded();
  await expect(contact).toBeVisible();
});

// CONT-02 — Contact form has exactly 3 fields (name, email, message)
test("CONT-02 @smoke — contact form has exactly 3 fields (name, email, message)", async ({
  page,
}) => {
  const form = page.locator("#contact form");
  await form.scrollIntoViewIfNeeded();
  await expect(form.locator('input[name="name"]')).toBeVisible();
  await expect(form.locator('input[name="email"]')).toBeVisible();
  await expect(form.locator('textarea[name="message"]')).toBeVisible();
  // Confirm no 4th field exists
  const allInputs = form.locator("input, textarea, select");
  await expect(allInputs).toHaveCount(3);
});

// CONT-03 — Form targets Formspree endpoint
test("CONT-03 @smoke — form targets Formspree endpoint", async ({ page }) => {
  // Verify the form has a data-formspree-id attribute
  const form = page.locator("#contact form");
  await form.scrollIntoViewIfNeeded();
  await expect(form).toBeVisible();
  const formId = await form.getAttribute("data-formspree-id");
  expect(formId).toBeTruthy();
});

// CONT-04 — Error state shown when form submitted empty
test("CONT-04 @smoke — error state shown when form submitted empty", async ({
  page,
}) => {
  const contact = page.locator("#contact");
  await contact.scrollIntoViewIfNeeded();
  // Submit the form with all fields empty — client validation fires before any network call
  const submitBtn = page.locator("#contact form button[type='submit']");
  await submitBtn.click();
  // At least one field should have the is-invalid class
  const invalidField = page.locator("#contact .is-invalid").first();
  await expect(invalidField).toBeVisible();
});

// CONT-05 — LinkedIn profile link in contact section
test("CONT-05 @smoke — LinkedIn profile link in contact section", async ({
  page,
}) => {
  const contact = page.locator("#contact");
  await contact.scrollIntoViewIfNeeded();
  const linkedinLink = page.locator("#contact a[href*='linkedin.com/in/borinakeo']");
  await expect(linkedinLink.first()).toBeVisible();
});

// CONT-06 — GitHub profile link in contact section
test("CONT-06 @smoke — GitHub profile link in contact section", async ({
  page,
}) => {
  const contact = page.locator("#contact");
  await contact.scrollIntoViewIfNeeded();
  const githubLink = page.locator("#contact a[href*='github.com/Bmee007']");
  await expect(githubLink.first()).toBeVisible();
});
