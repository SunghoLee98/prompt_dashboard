import { test, expect, Page } from '@playwright/test';

async function createTestUser(page: Page, email: string = 'testuser@example.com', nickname: string = 'testuser') {
  await page.goto('/register');

  // Wait for the register form to be fully loaded
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  // Fill in all required fields
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="nickname-input"]', nickname);
  await page.fill('[data-testid="password-input"]', 'Password123!');

  // Fill password confirmation field
  await page.fill('input[name="confirmPassword"]', 'Password123!');

  // Check terms and conditions
  await page.check('[data-testid="terms-checkbox"]');
  await page.check('[data-testid="privacy-checkbox"]');

  await page.click('[data-testid="register-button"]');
  await page.waitForURL('/login');
}

async function loginAsUser(page: Page, email: string = 'testuser@example.com', password: string = 'Password123!') {
  await page.goto('/login');

  // Wait for the login form to be fully loaded
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/prompts');
}

test.describe('Basic Authentication System Tests', () => {
  test('should allow user registration and login', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testNickname = `testuser${Date.now()}`;

    // Register a new user
    await createTestUser(page, testEmail, testNickname);

    // Check if redirected to login page after registration
    expect(page.url()).toContain('/login');

    // Check if success message is displayed
    await expect(page.locator('text=회원가입이 완료되었습니다')).toBeVisible();

    // Login with the same credentials
    await loginAsUser(page, testEmail, 'Password123!');

    // Check if logged in successfully and redirected to prompts page
    expect(page.url()).toContain('/prompts');

    // Check if user nickname is displayed in the navigation
    await expect(page.locator('text=' + testNickname)).toBeVisible();

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Verify logged out state
    await expect(page.locator('text=로그인')).toBeVisible();
  });

  test('should navigate to different pages when authenticated', async ({ page }) => {
    const testEmail = `nav-test-${Date.now()}@example.com`;
    const testNickname = `navuser${Date.now()}`;

    // Create user and login
    await createTestUser(page, testEmail, testNickname);
    await loginAsUser(page, testEmail, 'Password123!');

    // Verify user is logged in
    await expect(page.locator('text=' + testNickname)).toBeVisible();

    // Navigate to prompts page
    await page.click('text=프롬프트 목록');
    await expect(page).toHaveURL(/.*prompts/);

    // Navigate to create prompt page
    await page.click('text=Create');
    await expect(page).toHaveURL(/.*prompts\/new/);

    // Navigate back to home
    await page.click('text=Prompt Driver');
    await expect(page).toHaveURL(/.*\/$/);
  });
});