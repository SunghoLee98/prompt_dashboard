import { test, expect, Page } from '@playwright/test';

const API_URL = 'http://localhost:9090';
const generateUniqueEmail = () => `test${Date.now()}@example.com`;
const generateUniqueNickname = () => `testuser${Date.now()}`;

test.describe('Authentication System Tests', () => {
  let testEmail: string;
  let testNickname: string;
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    testEmail = generateUniqueEmail();
    testNickname = generateUniqueNickname();
  });

  test('TC001: User Registration - Happy Path', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to signup
    await page.click('text=회원가입');
    await expect(page).toHaveURL('/register');
    
    // Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="nickname"]', testNickname);
    
    // Check terms checkbox
    await page.check('input[name="terms"]');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page).toHaveURL('/login');
    const successMessage = page.locator('text=/회원가입.*성공|가입.*완료/i');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test('TC002: User Registration - Duplicate Email', async ({ page }) => {
    // First registration
    await page.goto('/register');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="nickname"]', testNickname);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    // Wait for first registration to complete
    await page.waitForTimeout(2000);
    
    // Try duplicate registration
    await page.goto('/register');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="nickname"]', generateUniqueNickname());
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    // Check for error
    const errorMessage = page.locator('text=/이미.*사용|중복|exists/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('TC003: User Registration - Password Mismatch', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.fill('input[name="nickname"]', testNickname);
    await page.check('input[name="terms"]');
    
    // Check for validation error
    const errorMessage = page.locator('text=/비밀번호.*일치|match/i');
    await expect(errorMessage).toBeVisible();
  });

  test('TC004: User Registration - Invalid Email Format', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="nickname"]', testNickname);
    await page.check('input[name="terms"]');
    
    // Check for validation error
    const errorMessage = page.locator('text=/올바른.*이메일|유효.*이메일|invalid.*email/i');
    await expect(errorMessage).toBeVisible();
  });

  test('TC005: User Registration - Weak Password', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    await page.fill('input[name="nickname"]', testNickname);
    await page.check('input[name="terms"]');
    
    // Check for validation error
    const errorMessage = page.locator('text=/비밀번호.*8자|password.*8/i');
    await expect(errorMessage).toBeVisible();
  });

  test('TC006: User Login - Success', async ({ page }) => {
    // First register a user
    const registrationEmail = generateUniqueEmail();
    const registrationNickname = generateUniqueNickname();
    
    await page.goto('/register');
    await page.fill('input[name="email"]', registrationEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="nickname"]', registrationNickname);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    // Wait for registration
    await page.waitForURL('/login');
    
    // Login
    await page.fill('input[name="email"]', registrationEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Verify successful login
    await expect(page).toHaveURL('/prompts');
    const userMenu = page.locator(`text=${registrationNickname}`);
    await expect(userMenu).toBeVisible({ timeout: 10000 });
  });

  test('TC007: User Login - Invalid Credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Check for error
    const errorMessage = page.locator('text=/잘못된.*인증|로그인.*실패|invalid.*credentials/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('TC008: User Logout', async ({ page }) => {
    // First login
    const registrationEmail = generateUniqueEmail();
    const registrationNickname = generateUniqueNickname();
    
    await page.goto('/register');
    await page.fill('input[name="email"]', registrationEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="nickname"]', registrationNickname);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/login');
    await page.fill('input[name="email"]', registrationEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/prompts');
    
    // Logout
    await page.click(`text=${registrationNickname}`);
    await page.click('text=/로그아웃|Logout/i');
    
    // Verify logout
    await expect(page).toHaveURL('/');
    const loginButton = page.locator('text=로그인');
    await expect(loginButton).toBeVisible();
  });

  test('TC009: Protected Route Access Without Authentication', async ({ page }) => {
    // Try to access protected route
    await page.goto('/prompts/create');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('TC010: Session Persistence', async ({ page, context }) => {
    // Login
    const registrationEmail = generateUniqueEmail();
    const registrationNickname = generateUniqueNickname();
    
    await page.goto('/register');
    await page.fill('input[name="email"]', registrationEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="nickname"]', registrationNickname);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/login');
    await page.fill('input[name="email"]', registrationEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/prompts');
    
    // Close and reopen page
    await page.close();
    const newPage = await context.newPage();
    await newPage.goto('/prompts');
    
    // Should still be logged in
    const userMenu = newPage.locator(`text=${registrationNickname}`);
    await expect(userMenu).toBeVisible({ timeout: 10000 });
  });
});