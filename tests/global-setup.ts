import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for Bookmark System E2E tests...');

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend to be ready...');
    await page.goto('http://localhost:9090/actuator/health', { timeout: 60000 });

    const healthCheck = await page.textContent('body');
    if (!healthCheck?.includes('UP')) {
      throw new Error('Backend health check failed');
    }
    console.log('✅ Backend is healthy');

    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend to be ready...');
    await page.goto('http://localhost:4000', { timeout: 60000 });

    // Check if the React app loaded by waiting for content
    try {
      // Wait for the React app to render something in the root div
      await page.waitForSelector('#root', { timeout: 10000 });

      // Wait for React Router to initialize and render content
      // Try to wait for navigation elements or any main content
      try {
        await page.waitForSelector('nav, header, main, [data-testid]', { timeout: 5000 });
        console.log('✅ Frontend is ready');
      } catch (navError) {
        // If no navigation found, wait for any text content
        await page.waitForFunction(() => {
          const root = document.getElementById('root');
          return root && root.textContent && root.textContent.trim().length > 0;
        }, { timeout: 10000 });
        console.log('✅ Frontend is ready (with content)');
      }
    } catch (error) {
      console.log('⚠️ Frontend loaded but React app may not be fully initialized');
    }

    // Setup test database
    console.log('📊 Setting up test database...');

    // Clear existing test data (if any)
    await page.evaluate(async () => {
      try {
        // Clear localStorage
        localStorage.clear();
        sessionStorage.clear();

        // Clear any cached data
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
      } catch (error) {
        console.warn('Failed to clear browser data:', error);
      }
    });

    console.log('✅ Test environment setup complete');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;