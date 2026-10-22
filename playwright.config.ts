import { defineConfig, devices } from "@playwright/test";

// `next start` / `next dev` read PORT too, so both sides agree.
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // CI tests the production build (`npm run build` runs first); locally
  // this reuses a running `npm run dev` or starts one.
  webServer: {
    command: isCI ? "npm run start" : "npm run dev -- -H localhost",
    url: `${baseURL}/login`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
