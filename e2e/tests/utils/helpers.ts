import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for E2E tests
 */

export class TestHelpers {
  /**
   * Wait for API response
   */
  static async waitForAPI(page: Page, endpoint: string, method: string = 'GET') {
    return await page.waitForResponse(
      response => response.url().includes(endpoint) && response.request().method() === method
    );
  }

  /**
   * Login helper
   */
  static async login(page: Page, email: string, password: string) {
    // Navigate to login page first
    await page.goto('/login');
    
    // Ensure E2E mode is enabled after navigation
    await page.evaluate(() => {
      localStorage.setItem('e2e_mode', 'true');
    });
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Click login button and wait for navigation
    await Promise.all([
      page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Additional wait to ensure the page has fully loaded
    await page.waitForLoadState('networkidle');
  }

  /**
   * Logout helper
   */
  static async logout(page: Page) {
    // Try multiple selectors for logout button
    const logoutSelectors = [
      'button:has-text("로그아웃")',
      'button:has-text("Logout")',
      '[data-testid="logout-button"]'
    ];
    
    for (const selector of logoutSelectors) {
      const button = page.locator(selector);
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click();
        break;
      }
    }
    
    await page.waitForURL('**/login', { timeout: 5000 });
  }

  /**
   * Check if user is logged in
   */
  static async isLoggedIn(page: Page): Promise<boolean> {
    // Check for auth token (using accessToken key)
    const token = await page.evaluate(() => {
      return localStorage.getItem('accessToken') || 
             localStorage.getItem('authToken') ||
             sessionStorage.getItem('accessToken') ||
             sessionStorage.getItem('authToken') ||
             document.cookie.includes('auth');
    });
    
    return !!token;
  }

  /**
   * Clear all storage
   */
  static async clearStorage(page: Page) {
    // Navigate to base URL first to ensure we have access to localStorage
    try {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        // Always set E2E mode for tests
        localStorage.setItem('e2e_mode', 'true');
      });
    } catch (error) {
      // If we can't clear storage, it's okay to continue
      console.log('Could not clear storage:', error);
    }
    
    // Clear cookies
    const context = page.context();
    await context.clearCookies();
  }

  /**
   * Set auth token directly
   */
  static async setAuthToken(page: Page, token: string) {
    await page.evaluate((authToken) => {
      localStorage.setItem('accessToken', authToken);
      // Also set the old key for backwards compatibility
      localStorage.setItem('authToken', authToken);
    }, token);
  }

  /**
   * Mock API response
   */
  static async mockAPIResponse(page: Page, endpoint: string, response: any, status: number = 200) {
    await page.route(`**/${endpoint}`, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Wait for network idle
   */
  static async waitForNetworkIdle(page: Page, timeout: number = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Check element visibility with retry
   */
  static async isElementVisible(page: Page, selector: string, retries: number = 3): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      if (await page.locator(selector).isVisible()) {
        return true;
      }
      await page.waitForTimeout(500);
    }
    return false;
  }

  /**
   * Scroll to element
   */
  static async scrollToElement(page: Page, selector: string) {
    await page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Check toast message
   */
  static async checkToastMessage(page: Page, expectedMessage: string) {
    const toast = page.locator('.toast, [role="alert"]');
    await expect(toast).toContainText(expectedMessage);
  }

  /**
   * Upload file
   */
  static async uploadFile(page: Page, selector: string, filePath: string) {
    const fileInput = page.locator(selector);
    await fileInput.setInputFiles(filePath);
  }

  /**
   * Check page performance
   */
  static async checkPagePerformance(page: Page) {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    return metrics;
  }

  /**
   * Check API response time
   */
  static async measureAPIResponseTime(page: Page, action: () => Promise<void>, endpoint: string): Promise<number> {
    const startTime = Date.now();
    
    const responsePromise = page.waitForResponse(
      response => response.url().includes(endpoint),
      { timeout: 10000 }
    );
    
    await action();
    await responsePromise;
    
    const endTime = Date.now();
    return endTime - startTime;
  }

  /**
   * Take screenshot with timestamp
   */
  static async takeScreenshot(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `screenshots/${name}_${timestamp}.png`,
      fullPage: true
    });
  }

  /**
   * Check for console errors
   */
  static async checkConsoleErrors(page: Page): Promise<string[]> {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    return errors;
  }

  /**
   * Check for broken images
   */
  static async checkBrokenImages(page: Page): Promise<string[]> {
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .filter(img => !img.complete || img.naturalHeight === 0)
        .map(img => img.src);
    });
    
    return brokenImages;
  }

  /**
   * Check for broken links
   */
  static async checkBrokenLinks(page: Page): Promise<string[]> {
    const links = await page.locator('a[href]').all();
    const brokenLinks: string[] = [];
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('http')) {
        try {
          const response = await page.request.head(href);
          if (response.status() >= 400) {
            brokenLinks.push(href);
          }
        } catch (error) {
          brokenLinks.push(href || 'unknown');
        }
      }
    }
    
    return brokenLinks;
  }

  /**
   * Generate random string
   */
  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Retry action
   */
  static async retryAction<T>(
    action: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await action();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Rating-specific helpers
   */
  
  /**
   * Create a rating via API
   */
  static async createRatingViaAPI(
    page: Page,
    promptId: string,
    score: number,
    token?: string
  ): Promise<any> {
    const authToken = token || await page.evaluate(() => localStorage.getItem('accessToken') || localStorage.getItem('authToken'));
    
    const response = await page.evaluate(async ({ promptId, score, token }) => {
      const res = await fetch(`/api/prompts/${promptId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score })
      });
      
      return {
        status: res.status,
        ok: res.ok,
        data: res.ok ? await res.json() : null
      };
    }, { promptId, score, token: authToken });
    
    return response;
  }

  /**
   * Get rating statistics for a prompt
   */
  static async getRatingStats(page: Page, promptId: string): Promise<{
    average: number;
    count: number;
    distribution: { [key: number]: number };
  }> {
    const response = await page.evaluate(async (id) => {
      const res = await fetch(`/api/prompts/${id}/ratings/stats`);
      return res.ok ? await res.json() : null;
    }, promptId);
    
    return response || { average: 0, count: 0, distribution: {} };
  }

  /**
   * Wait for rating to be updated in UI
   */
  static async waitForRatingUpdate(
    page: Page,
    selector: string,
    expectedValue: number,
    timeout: number = 5000
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const text = await page.locator(selector).textContent();
      const value = parseFloat(text?.match(/[\d.]+/)?.[0] || '0');
      
      if (Math.abs(value - expectedValue) < 0.1) {
        return true;
      }
      
      await page.waitForTimeout(100);
    }
    
    return false;
  }

  /**
   * Simulate multiple user ratings
   */
  static async simulateMultipleRatings(
    page: Page,
    promptId: string,
    ratings: Array<{ userId: string; score: number; token: string }>
  ): Promise<void> {
    for (const rating of ratings) {
      await TestHelpers.createRatingViaAPI(page, promptId, rating.score, rating.token);
      await page.waitForTimeout(100); // Small delay between ratings
    }
  }

  /**
   * Check if rating stars are interactive
   */
  static async areRatingStarsInteractive(page: Page): Promise<boolean> {
    const stars = page.locator('.rating-star, [data-testid="rating-star"]');
    const count = await stars.count();
    
    if (count === 0) return false;
    
    for (let i = 0; i < count; i++) {
      const star = stars.nth(i);
      const isDisabled = await star.isDisabled();
      const isVisible = await star.isVisible();
      
      if (!isVisible || isDisabled) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get user's rating for a prompt
   */
  static async getUserRatingViaAPI(
    page: Page,
    promptId: string,
    token?: string
  ): Promise<number | null> {
    const authToken = token || await page.evaluate(() => localStorage.getItem('accessToken') || localStorage.getItem('authToken'));
    
    const response = await page.evaluate(async ({ promptId, token }) => {
      const res = await fetch(`/api/prompts/${promptId}/ratings/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.score || null;
      }
      return null;
    }, { promptId, token: authToken });
    
    return response;
  }

  /**
   * Delete user's rating
   */
  static async deleteRatingViaAPI(
    page: Page,
    promptId: string,
    ratingId: string,
    token?: string
  ): Promise<boolean> {
    const authToken = token || await page.evaluate(() => localStorage.getItem('accessToken') || localStorage.getItem('authToken'));
    
    const response = await page.evaluate(async ({ promptId, ratingId, token }) => {
      const res = await fetch(`/api/prompts/${promptId}/ratings/${ratingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return res.ok;
    }, { promptId, ratingId, token: authToken });
    
    return response;
  }

  /**
   * Verify rating display format
   */
  static async verifyRatingDisplay(
    page: Page,
    selector: string,
    expectedFormat: 'stars' | 'numeric' | 'both'
  ): Promise<boolean> {
    const element = page.locator(selector);
    
    if (!await element.isVisible()) return false;
    
    const hasStars = await element.locator('.star-icon, .rating-star').count() > 0;
    const text = await element.textContent();
    const hasNumeric = /[\d.]+/.test(text || '');
    
    switch (expectedFormat) {
      case 'stars':
        return hasStars && !hasNumeric;
      case 'numeric':
        return !hasStars && hasNumeric;
      case 'both':
        return hasStars && hasNumeric;
      default:
        return false;
    }
  }

  /**
   * Calculate expected average after rating update
   */
  static calculateNewAverage(
    currentAverage: number,
    currentCount: number,
    newRating: number,
    isUpdate: boolean = false,
    oldRating?: number
  ): number {
    if (isUpdate && oldRating !== undefined) {
      // For update: remove old rating and add new rating
      const total = (currentAverage * currentCount) - oldRating + newRating;
      return total / currentCount;
    } else {
      // For new rating: add to total
      const total = (currentAverage * currentCount) + newRating;
      return total / (currentCount + 1);
    }
  }

  /**
   * Verify star rating visual state
   */
  static async verifyStarRatingVisual(
    page: Page,
    expectedRating: number
  ): Promise<boolean> {
    const stars = page.locator('.rating-star, [data-testid="rating-star"]');
    const count = await stars.count();
    
    if (count !== 5) return false; // Should have exactly 5 stars
    
    for (let i = 0; i < count; i++) {
      const star = stars.nth(i);
      const shouldBeFilled = i < expectedRating;
      
      const classes = await star.getAttribute('class');
      const isFilled = classes?.includes('filled') || 
                       classes?.includes('active') ||
                       classes?.includes('selected');
      
      if (shouldBeFilled !== isFilled) {
        return false;
      }
    }
    
    return true;
  }
}