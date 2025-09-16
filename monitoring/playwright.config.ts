import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd backend && ./gradlew bootRun',
      port: 8080,
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
    {
      command: 'cd frontend && npm run dev',
      port: 4003,
      timeout: 120 * 1000,
      reuseExistingServer: true,
    }
  ],
});