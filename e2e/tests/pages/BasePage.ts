import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object Model
 * Common functionality for all pages
 */
export class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.footer = page.locator('footer');
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
    // Ensure E2E mode is enabled after navigation
    await this.page.evaluate(() => {
      localStorage.setItem('e2e_mode', 'true');
    });
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async checkAccessibility() {
    // Check for basic accessibility elements
    const hasMainLandmark = await this.page.locator('main').count() > 0;
    const hasH1 = await this.page.locator('h1').count() > 0;
    const hasSkipLink = await this.page.locator('a[href="#main"]').count() > 0;
    
    return {
      hasMainLandmark,
      hasH1,
      hasSkipLink
    };
  }

  async waitForToast(message: string) {
    await this.page.locator(`text="${message}"`).waitFor({ state: 'visible', timeout: 5000 });
  }

  async dismissToast() {
    const toast = this.page.locator('.toast, [role="alert"]').first();
    if (await toast.isVisible()) {
      await toast.click();
    }
  }

  async checkResponsiveDesign() {
    const viewports = [
      { width: 375, height: 812, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    const results = [];
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(500); // Wait for responsive adjustments
      results.push({
        name: viewport.name,
        width: viewport.width,
        height: viewport.height,
        isResponsive: await this.isLayoutResponsive()
      });
    }
    return results;
  }

  private async isLayoutResponsive(): Promise<boolean> {
    // Check if elements are properly displayed for current viewport
    const header = await this.header.isVisible();
    const main = await this.page.locator('main').isVisible();
    return header && main;
  }

  async measurePerformance() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    return metrics;
  }
}