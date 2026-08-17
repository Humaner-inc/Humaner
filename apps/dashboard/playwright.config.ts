import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.DASHBOARD_PORT ?? 3001);
const baseURL = process.env.DASHBOARD_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome']
  },
  webServer: process.env.DASHBOARD_BASE_URL
    ? undefined
    : {
        command: 'pnpm exec next dev --port 3001',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000
      }
});
