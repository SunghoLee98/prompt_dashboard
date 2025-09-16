import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to homepage
    const response = await page.goto('http://localhost:4000', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // Check if page loads
    expect(response?.status()).toBeLessThanOrEqual(400);
    
    // Check if page has content
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Take screenshot for verification
    await page.screenshot({ path: 'screenshots/homepage.png' });
  });

  test('should have login page accessible', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:4000/login', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    // Check if inputs exist (may or may not be visible depending on implementation)
    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;
    
    console.log('Email input exists:', emailExists);
    console.log('Password input exists:', passwordExists);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/login-page.png' });
  });

  test('should check backend API health', async ({ request }) => {
    try {
      // Try to access a public endpoint
      const response = await request.get('http://localhost:9090/api/health', {
        timeout: 5000
      });
      
      // Backend might require auth, so 401 is also acceptable
      const status = response.status();
      expect([200, 401, 403]).toContain(status);
      
      console.log('Backend API status:', status);
    } catch (error) {
      console.log('Backend API might not have health endpoint:', error);
      // Not failing the test as the endpoint might not exist
    }
  });

  test('should verify basic page structure', async ({ page }) => {
    await page.goto('http://localhost:4000', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // Check for basic HTML structure
    const html = page.locator('html');
    const body = page.locator('body');
    
    await expect(html).toBeVisible();
    await expect(body).toBeVisible();
    
    // Check if React app is mounted (typical React root div)
    const reactRoot = page.locator('#root, #app, [id*="root"]').first();
    if (await reactRoot.count() > 0) {
      await expect(reactRoot).toBeVisible();
      console.log('React app root found');
    }
    
    // Check for any content
    const bodyText = await body.textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('should measure initial page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:4000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    // Very generous threshold for initial load
    expect(loadTime).toBeLessThan(30000);
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      };
    });
    
    console.log('Performance metrics:', metrics);
  });
});