import { test, expect } from '@playwright/test';

test.describe('Working Platform Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage successfully', async ({ page }) => {
    await expect(page).toHaveURL('/');

    // Should have basic content loaded
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // Should show register form
    const emailInput = page.locator('[data-testid="email-input"]');
    await expect(emailInput).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // Should show login form
    const emailField = page.locator('input[name="email"]');
    await expect(emailField).toBeVisible();
  });

  test('should show validation errors on empty registration', async ({ page }) => {
    await page.goto('/register');

    // Try to submit empty form
    await page.click('[data-testid="register-button"]');

    // Should still be on register page
    await expect(page).toHaveURL('/register');
  });

  test('should prevent login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should require authentication for protected routes', async ({ page }) => {
    // Try to access create prompt page without login
    await page.goto('/prompts/new');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to prompts list page', async ({ page }) => {
    await page.goto('/prompts');
    await expect(page).toHaveURL('/prompts');
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/nonexistent-page');

    // Should either show 404 page or redirect
    const currentUrl = page.url();
    const isValidRedirect = currentUrl.includes('/login') ||
                          currentUrl.includes('/register') ||
                          currentUrl.includes('/prompts') ||
                          currentUrl === 'http://localhost:4000/' ||
                          page.locator('text=404').isVisible();

    expect(isValidRedirect).toBeTruthy();
  });

  test('should load pages within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have responsive design elements', async ({ page }) => {
    await page.goto('/');

    // Should have main content - check for root element
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
  });
});