import { test, expect } from '@playwright/test';

test.describe('System Performance and Stability', () => {
  test('01. API response times', async ({ page }) => {
    const responseTimeThreshold = 500; // 500ms threshold
    
    // Monitor API calls
    const apiTimes: number[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const timing = response.request().timing();
        if (timing) {
          apiTimes.push(timing.responseEnd);
        }
      }
    });
    
    // Navigate and perform actions
    await page.goto('/prompts');
    await page.waitForLoadState('networkidle');
    
    // Check response times
    const avgResponseTime = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
    expect(avgResponseTime).toBeLessThan(responseTimeThreshold);
  });

  test('02. Page load performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check for Core Web Vitals
    const metrics = await page.evaluate(() => {
      return {
        FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        LCP: performance.getEntriesByType('largest-contentful-paint').pop()?.startTime,
      };
    });
    
    // FCP should be under 1.8s
    if (metrics.FCP) {
      expect(metrics.FCP).toBeLessThan(1800);
    }
  });

  test('03. Concurrent user simulation', async ({ browser }) => {
    const contexts = [];
    const pages = [];
    
    // Create 5 concurrent sessions
    for (let i = 0; i < 5; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }
    
    // All users navigate simultaneously
    const navigationPromises = pages.map(page => 
      page.goto('/prompts').catch(e => ({ error: e }))
    );
    
    const results = await Promise.all(navigationPromises);
    
    // Check all pages loaded successfully
    const failures = results.filter(r => r && 'error' in r);
    expect(failures.length).toBe(0);
    
    // Cleanup
    for (const context of contexts) {
      await context.close();
    }
  });

  test('04. Memory leak detection', async ({ page }) => {
    // Initial memory snapshot
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform multiple navigations
    for (let i = 0; i < 10; i++) {
      await page.goto('/prompts');
      await page.goto('/auth/login');
      await page.goto('/');
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if (global.gc) {
        global.gc();
      }
    });
    
    // Final memory snapshot
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory shouldn't grow more than 50MB
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
  });

  test('05. Error recovery and retry', async ({ page, context }) => {
    let failCount = 0;
    
    // Simulate intermittent failures
    await context.route('**/api/prompts', route => {
      failCount++;
      if (failCount <= 2) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto('/prompts');
    
    // Should eventually load after retries
    await expect(page.locator('.prompt-card, .empty-state')).toBeVisible({ timeout: 10000 });
  });

  test('06. Large data handling', async ({ page }) => {
    // Navigate to prompts with max page size
    await page.goto('/prompts?limit=100');
    
    // Check if page handles large data
    await expect(page.locator('.prompt-list, .prompt-grid')).toBeVisible();
    
    // Scroll performance
    const startScroll = Date.now();
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    const scrollTime = Date.now() - startScroll;
    
    // Scrolling should be smooth (under 100ms)
    expect(scrollTime).toBeLessThan(100);
  });

  test('07. Session timeout handling', async ({ page, context }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    // Mock expired token
    await context.route('**/api/prompts/my', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired'
          }
        })
      });
    });
    
    await page.goto('/prompts/my');
    
    // Should redirect to login or show appropriate message
    await expect(page.locator('text=Please login again, text=Session expired')).toBeVisible({ timeout: 5000 });
  });

  test('08. Cross-browser compatibility check', async ({ browserName, page }) => {
    console.log(`Testing on ${browserName}`);
    
    await page.goto('/');
    
    // Basic functionality should work on all browsers
    await expect(page.locator('h1, .hero-title')).toBeVisible();
    
    // Navigation should work
    await page.click('text=Browse Prompts');
    await expect(page).toHaveURL(/\/prompts/);
    
    // Forms should work
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    expect(await page.inputValue('input[name="email"]')).toBe('test@example.com');
  });
});