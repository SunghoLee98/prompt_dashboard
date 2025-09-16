import { test, expect } from '@playwright/test';

test.describe('Simple Authentication Flow', () => {
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testNickname = `test${timestamp}`;
  const testPassword = 'Test1234';

  test.beforeEach(async ({ page }) => {
    // Set frontend URL
    await page.goto('http://localhost:4000');
  });

  test('Registration flow redirects to login', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:4000/register');

    // Use unique email for this test
    const uniqueEmail = `test${Date.now()}@example.com`;
    const uniqueNickname = `test${Date.now()}`;

    // Fill registration form
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="nickname"]', uniqueNickname);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Check terms checkbox
    await page.check('input[data-testid="terms-checkbox"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login flow redirects to prompts', async ({ page }) => {
    // First register a user
    await page.goto('http://localhost:4000/register');
    const uniqueEmail = `test${Date.now()}@example.com`;
    const uniqueNickname = `test${Date.now()}`;

    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="nickname"]', uniqueNickname);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.check('input[data-testid="terms-checkbox"]');
    await page.click('button[type="submit"]');

    // Wait for redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Now login with the registered user
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to prompts page
    await page.waitForURL(/\/prompts/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/prompts/);
  });

  test('Duplicate email shows error message', async ({ page }) => {
    // Register first user
    await page.goto('http://localhost:4000/register');
    const duplicateEmail = `duplicate${Date.now()}@example.com`;

    await page.fill('input[name="email"]', duplicateEmail);
    await page.fill('input[name="nickname"]', `first${Date.now()}`);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.check('input[data-testid="terms-checkbox"]');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Try to register with same email
    await page.goto('http://localhost:4000/register');
    await page.fill('input[name="email"]', duplicateEmail);
    await page.fill('input[name="nickname"]', `second${Date.now()}`);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.check('input[data-testid="terms-checkbox"]');
    await page.click('button[type="submit"]');

    // Should show error message - check for the alert or error text
    await page.waitForTimeout(1000); // Wait for error to appear
    const errorAlert = page.locator('[role="alert"]').first();
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });

  test('Invalid login shows error message', async ({ page }) => {
    await page.goto('http://localhost:4000/login');

    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    // Should show error message - check for the alert or error text
    await page.waitForTimeout(1000); // Wait for error to appear
    const errorAlert = page.locator('[role="alert"]').first();
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });

  test('Protected route redirects to login when not authenticated', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Try to access protected route
    await page.goto('http://localhost:4000/prompts/new');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});