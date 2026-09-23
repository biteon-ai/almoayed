import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

dotenv.config();

const PORT = process.env.PLAYWRIGHT_PORT ?? "3099";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Cap parallelism — shared demo WhatsApp identities + one Next server;
  // too many workers abort Supabase profile fetches (SUPABASE_PROFILE_FETCH_FAILED).
  workers: process.env.CI ? 2 : 2,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "ar-SY",
    trace: "on-first-retry",
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npm run build && npm run start -- -p ${PORT}`,
        url: BASE_URL,
        // Always start this process so E2E_FORCE_DEMO_MODE is set. Reusing a
        // leftover :3099 from `next dev` (Demo Mode off) hides «حساب تجريبي».
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          // next start is NODE_ENV=production; keep demo shortcuts for e2e QA
          AUTH_DEMO_BYPASS: "true",
          E2E_FORCE_DEMO_MODE: "true",
        },
      },
});
