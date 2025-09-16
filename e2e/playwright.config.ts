import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Testing for Prompt Driver Web Service
 */
export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Test timeout (30 seconds)
  timeout: 30 * 1000,
  
  // Expect timeout (5 seconds)
  expect: {
    timeout: 5000
  },
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: 'http://localhost:4000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 10 * 1000,
    
    // Navigation timeout
    navigationTimeout: 30 * 1000,
    
    // Storage state to enable E2E test mode
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:4000',
        localStorage: [{
          name: 'e2e_mode',
          value: 'true'
        }]
      }]
    },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    // Tablet testing
    {
      name: 'iPad',
      use: {
        ...devices['iPad (gen 7)'],
      },
    },
  ],

  // Commented out webServer since services are started manually
  // webServer: [
  //   {
  //     command: 'cd ../frontend && npm run dev',
  //     port: 4000,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120 * 1000,
  //   },
  //   {
  //     command: 'cd .. && ./gradlew bootRun',
  //     port: 9090,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120 * 1000,
  //   }
  // ],
});