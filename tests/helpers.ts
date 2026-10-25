import type { Page } from "@playwright/test";

/** Load the home page and wait for the loader to finish and motion to boot. */
export async function openHome(page: Page, path = "/") {
  await page.goto(path);
  // First visit shows the entry gate; enter without sound. Repeat visits auto-enter.
  const silent = page.locator("#enter-silent");
  await Promise.race([
    silent.waitFor({ state: "visible", timeout: 8_000 }).then(() => silent.click()).catch(() => {}),
    page.waitForFunction(() => document.body.classList.contains("loaded"), null, { timeout: 8_000 }).catch(() => {}),
  ]);
  await page.waitForFunction(() => document.body.classList.contains("loaded") || !document.getElementById("loader"), null, { timeout: 15_000 });
  await page.waitForTimeout(400);
}

/** Jump to a section without Lenis easing so assertions are immediate. */
export async function jumpTo(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`missing ${sel}`);
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: "auto" });
    // A programmatic jump skips the scroll events ScrollTrigger normally sees; nudge it like a real scroll does
    const st = (window as unknown as { __ST?: { update: () => void } }).__ST;
    if (st) st.update();
  }, selector);
  await page.waitForTimeout(900);
}
