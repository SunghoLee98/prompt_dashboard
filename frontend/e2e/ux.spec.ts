import { test, expect, Page } from '@playwright/test';

test.describe('User Experience Tests', () => {
  test('TC026: Responsive Design - Mobile View', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check if mobile menu exists
    const mobileMenu = page.locator('[aria-label="Mobile menu"]');
    await expect(mobileMenu).toBeVisible();
    
    // Click mobile menu
    await mobileMenu.click();
    
    // Check if navigation items are visible
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('text=Sign Up')).toBeVisible();
  });

  test('TC027: Loading States', async ({ page }) => {
    await page.goto('/prompts');
    
    // Check for loading indicator
    const loadingIndicator = page.locator('[aria-label="Loading"]');
    
    // Loading should appear and disappear
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('TC028: Error Handling - Network Error', async ({ page, context }) => {
    // Block API calls to simulate network error
    await context.route('**/api/**', route => route.abort());
    
    await page.goto('/prompts');
    
    // Check for error message
    const errorMessage = page.locator('text=/error|failed|unable/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('TC029: Form Validation - Real-time', async ({ page }) => {
    await page.goto('/register');
    
    // Type invalid email
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('invalid');
    await emailInput.blur();
    
    // Check for immediate validation error
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible();
    
    // Fix the email
    await emailInput.fill('valid@example.com');
    await emailInput.blur();
    
    // Error should disappear
    await expect(page.locator('text=/invalid.*email/i')).not.toBeVisible();
  });

  test('TC030: Accessibility - Keyboard Navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if elements can be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    
    // Press Enter on focused element
    await page.keyboard.press('Enter');
    
    // Should navigate or trigger action
    await page.waitForTimeout(1000);
  });

  test('TC031: Empty States', async ({ page }) => {
    // Login first
    const email = `test${Date.now()}@example.com`;
    const nickname = `user${Date.now()}`;
    const password = 'TestPassword123!';
    
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.fill('input[name="nickname"]', nickname);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Search for non-existent content
    await page.goto('/prompts');
    await page.fill('input[placeholder*="Search"]', 'NonExistentPrompt12345');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Check for empty state message
    await expect(page.locator('text=/no.*prompts.*found/i')).toBeVisible();
  });

  test('TC032: Browser Back/Forward Navigation', async ({ page }) => {
    await page.goto('/');
    await page.click('text=회원가입');
    await expect(page).toHaveURL('/register');
    
    await page.click('text=로그인');
    await expect(page).toHaveURL('/login');
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/register');
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/login');
  });

  test('TC033: Session Timeout Handling', async ({ page }) => {
    // This test simulates token expiration
    const email = `test${Date.now()}@example.com`;
    const nickname = `user${Date.now()}`;
    const password = 'TestPassword123!';
    
    // Register and login
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.fill('input[name="nickname"]', nickname);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/prompts');
    
    // Clear token to simulate expiration
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });
    
    // Try to perform authenticated action
    await page.goto('/prompts/create');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('TC034: Confirmation Dialogs', async ({ page }) => {
    // Login
    const email = `test${Date.now()}@example.com`;
    const nickname = `user${Date.now()}`;
    const password = 'TestPassword123!';
    
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.fill('input[name="nickname"]', nickname);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Create a prompt
    await page.goto('/prompts/create');
    await page.fill('input[name="title"]', 'Test Prompt');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.fill('textarea[name="content"]', 'Test content');
    await page.selectOption('select[name="category"]', 'WRITING');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/prompts\/\d+/);
    
    // Set up dialog handler
    let dialogShown = false;
    page.on('dialog', async dialog => {
      dialogShown = true;
      expect(dialog.message()).toContain('delete');
      await dialog.dismiss(); // Cancel deletion
    });
    
    // Try to delete
    await page.click('text=Delete');
    
    // Verify dialog was shown
    expect(dialogShown).toBe(true);
    
    // Prompt should still exist
    await expect(page.locator('h1:has-text("Test Prompt")')).toBeVisible();
  });

  test('TC035: Input Character Limits', async ({ page }) => {
    // Login
    const email = `test${Date.now()}@example.com`;
    const nickname = `user${Date.now()}`;
    const password = 'TestPassword123!';
    
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.fill('input[name="nickname"]', nickname);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Go to create prompt
    await page.goto('/prompts/create');
    
    // Test title character limit (255 chars)
    const longTitle = 'a'.repeat(300);
    await page.fill('input[name="title"]', longTitle);
    
    // Check if input is truncated or error shown
    const titleValue = await page.inputValue('input[name="title"]');
    expect(titleValue.length).toBeLessThanOrEqual(255);
    
    // Test content character limit (10000 chars)
    const longContent = 'a'.repeat(10001);
    await page.fill('textarea[name="content"]', longContent);
    
    // Check if character count warning is shown
    const charCount = page.locator('text=/10000.*characters/i');
    if (await charCount.isVisible()) {
      await expect(charCount).toBeVisible();
    }
  });
});