import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  // One retry: the dev server occasionally re-optimises deps mid-run (504 'Outdated Optimize Dep'),
  // which makes a single page load miss its JS. Not a site defect; retried runs are deterministic.
  retries: 1,
  timeout: 10_000,
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4321",
    // Use the installed Google Chrome by default (no `playwright install` needed locally).
    // Set PW_CHANNEL="" in CI to fall back to Playwright's bundled Chromium.
    channel: process.env.PW_CHANNEL === undefined ? "chrome" : process.env.PW_CHANNEL || undefined,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "tablet",
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } },
    },
  ],
});
