import { test, expect } from '@playwright/test';

test.describe('User Experience and Error Handling', () => {
  test('01. Loading states', async ({ page }) => {
    // Slow down network to see loading states
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    await page.goto('/prompts');
    
    // Verify loading indicator appears
    await expect(page.locator('.loading-spinner, .skeleton')).toBeVisible();
    
    // Wait for content
    await expect(page.locator('.prompt-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('02. Form validation - Real-time feedback', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Test email validation
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('invalid');
    await emailInput.blur();
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    
    // Fix email
    await emailInput.fill('valid@email.com');
    await emailInput.blur();
    await expect(page.locator('text=Please enter a valid email')).not.toBeVisible();
    
    // Test password strength
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill('weak');
    await passwordInput.blur();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    
    // Test password match
    await passwordInput.fill('StrongPassword123!');
    const confirmInput = page.locator('input[name="confirmPassword"]');
    await confirmInput.fill('Different123!');
    await confirmInput.blur();
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('03. Error recovery - Network failure', async ({ page, context }) => {
    await page.goto('/auth/login');
    
    // Block API calls to simulate network failure
    await context.route('**/api/**', route => route.abort());
    
    // Try to login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=Network error. Please try again.')).toBeVisible();
    
    // Unblock API calls
    await context.unroute('**/api/**');
    
    // Retry should work
    await page.click('button:has-text("Retry")');
    // Should either succeed or show proper error
    await expect(page.locator('text=Network error')).not.toBeVisible({ timeout: 5000 });
  });

  test('04. Responsive design', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Check desktop layout
    const desktopNav = page.locator('.desktop-nav');
    await expect(desktopNav).toBeVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    const mobileMenuButton = page.locator('.mobile-menu-button, button[aria-label*="Menu"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Test mobile menu
    await mobileMenuButton.click();
    await expect(page.locator('.mobile-menu')).toBeVisible();
  });

  test('05. Accessibility - Keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check focus indicator
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Navigate with keyboard
    await page.keyboard.press('Enter');
    
    // Verify navigation worked
    await expect(page).not.toHaveURL('/');
  });

  test('06. Success feedback', async ({ page }) => {
    const timestamp = Date.now();
    
    // Register new user
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', `success${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.fill('input[name="nickname"]', `success${timestamp}`);
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=Registration successful')).toBeVisible();
    
    // Login
    await page.fill('input[name="email"]', `success${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Verify login success
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('07. Empty states', async ({ page }) => {
    const timestamp = Date.now();
    
    // Login as new user with no prompts
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', `empty${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.fill('input[name="nickname"]', `empty${timestamp}`);
    await page.click('button[type="submit"]');
    
    // Login
    await page.fill('input[name="email"]', `empty${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Go to My Prompts
    await page.click('text=My Prompts');
    
    // Verify empty state message
    await expect(page.locator('text=No prompts yet')).toBeVisible();
    await expect(page.locator('text=Create your first prompt')).toBeVisible();
  });

  test('08. Confirmation dialogs', async ({ page }) => {
    // Create a prompt first
    const timestamp = Date.now();
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', `dialog${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.fill('input[name="nickname"]', `dialog${timestamp}`);
    await page.click('button[type="submit"]');
    
    await page.fill('input[name="email"]', `dialog${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Create prompt
    await page.goto('/prompts/create');
    await page.fill('input[name="title"]', 'Test Delete Confirmation');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.fill('textarea[name="content"]', 'Test content');
    await page.selectOption('select[name="category"]', 'OTHER');
    await page.click('button[type="submit"]');
    
    // Try to delete
    await page.click('button:has-text("Delete")');
    
    // Verify confirmation dialog
    await expect(page.locator('text=Are you sure you want to delete')).toBeVisible();
    
    // Cancel first
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h1:has-text("Test Delete Confirmation")')).toBeVisible();
    
    // Delete with confirmation
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('text=deleted successfully')).toBeVisible();
  });
});