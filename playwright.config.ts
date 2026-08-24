import { defineConfig, devices } from "@playwright/test";

const hasFixtureCredentials = Boolean(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: hasFixtureCredentials ? [
    {
      command: "npm run dev:next",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev:collaboration",
      url: "http://127.0.0.1:1234/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ] : undefined,
});
