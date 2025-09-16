import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `testuser${timestamp}@example.com`,
    password: 'TestPassword123!',
    nickname: `testuser${timestamp}`
  };

  test('01. Complete authentication flow - Registration, Login, Token Management', async ({ page }) => {
    // 1. Navigate to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Prompt Driver/);
    
    // 2. Navigate to registration
    await page.click('text=Sign Up');
    await expect(page).toHaveURL('/auth/register');
    
    // 3. Fill registration form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.fill('input[name="nickname"]', testUser.nickname);
    
    // 4. Submit registration
    await page.click('button[type="submit"]');
    
    // 5. Verify redirect to login
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('text=Registration successful')).toBeVisible();
    
    // 6. Login with new account
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // 7. Verify successful login and redirect
    await expect(page).toHaveURL('/');
    
    // 8. Verify user session (check for user menu or logout button)
    await expect(page.locator('text=' + testUser.nickname)).toBeVisible();
    
    // 9. Verify token storage
    const localStorage = await page.evaluate(() => {
      return {
        accessToken: window.localStorage.getItem('accessToken'),
        refreshToken: window.localStorage.getItem('refreshToken')
      };
    });
    expect(localStorage.accessToken).toBeTruthy();
    expect(localStorage.refreshToken).toBeTruthy();
    
    // 10. Test authenticated API call
    await page.click('text=My Prompts');
    await expect(page).toHaveURL('/prompts/my');
    
    // 11. Logout
    await page.click('text=Logout');
    await expect(page).toHaveURL('/');
    
    // 12. Verify tokens cleared
    const clearedStorage = await page.evaluate(() => {
      return {
        accessToken: window.localStorage.getItem('accessToken'),
        refreshToken: window.localStorage.getItem('refreshToken')
      };
    });
    expect(clearedStorage.accessToken).toBeNull();
    expect(clearedStorage.refreshToken).toBeNull();
  });

  test('02. Error handling - Invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Test invalid email format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    
    // Test wrong credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('03. Password validation', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Test weak password
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    
    // Test password mismatch
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('04. Session persistence', async ({ page, context }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    
    // Open new tab and verify session persists
    const newPage = await context.newPage();
    await newPage.goto('/');
    await expect(newPage.locator('text=' + testUser.nickname)).toBeVisible();
    await newPage.close();
  });
});