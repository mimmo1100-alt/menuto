import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (tests/e2e). They run the real app against a separate database that is wiped first,
 * so the database URL must contain "test". Locally: `npm run test:e2e` (starts `next dev` on port 3100).
 * In CI the app is built first and started with `next start` (see .github/workflows/e2e.yml).
 */
const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const DB = process.env.TEST_DATABASE_URL ?? "postgresql://menuto:menuto@localhost:5432/menuto_test?schema=public";
process.env.TEST_DATABASE_URL = DB;
const CI = !!process.env.CI;

export default defineConfig({
  testDir: "tests/e2e",
  // one shared database: run the files one after another
  workers: 1,
  fullyParallel: false,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: BASE, locale: "it-IT", timezoneId: "Europe/Rome", trace: CI ? "on-first-retry" : "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], locale: "it-IT" } }],
  webServer: {
    command: CI ? `npx next start -p ${PORT}` : `npx next dev -p ${PORT}`,
    url: `${BASE}/login`,
    reuseExistingServer: !CI,
    timeout: 180_000,
    env: { ...process.env, DATABASE_URL: DB, DIRECT_URL: DB, PUBLIC_URL: BASE, RESEND_API_KEY: "", CRON_SECRET: "" } as Record<string, string>,
  },
});
