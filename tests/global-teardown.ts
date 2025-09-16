import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for Bookmark System E2E tests...');

  // Launch browser for cleanup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Check if backend is still running
    try {
      await page.goto('http://localhost:9090/actuator/health', { timeout: 5000 });
      console.log('📊 Cleaning up test data...');

      // Here you could make API calls to clean up test data
      // For example:
      // await page.evaluate(async () => {
      //   await fetch('/api/test/cleanup', { method: 'POST' });
      // });

    } catch (error) {
      console.log('ℹ️ Backend not accessible for cleanup (this is normal if tests shut it down)');
    }

    // Generate test summary
    console.log('📋 Test execution completed');
    console.log('📁 Test results available in test-results/ directory');
    console.log('📊 HTML report available at playwright-report/index.html');

  } catch (error) {
    console.error('❌ Global teardown encountered an error:', error);
    // Don't throw - teardown errors shouldn't fail the test run
  } finally {
    await browser.close();
  }

  console.log('✅ Global teardown complete');
}

export default globalTeardown;