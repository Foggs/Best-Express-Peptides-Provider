import { defineConfig, devices } from '@playwright/test';

const skipWebServer = !!process.env.PLAYWRIGHT_SKIP_WEBSERVER;

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  timeout: 180000,
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: undefined,
      },
    },
  ],
  ...(skipWebServer ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:5000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  }),
});
