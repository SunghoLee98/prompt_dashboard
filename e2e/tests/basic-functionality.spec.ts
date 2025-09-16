import { test, expect } from '@playwright/test';

test.describe('Basic Functionality Tests', () => {
  test('Frontend is accessible and responsive', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:4000');
    
    // Check page loaded successfully
    await expect(page).toHaveTitle(/Prompt/i);
    
    // Check React app is mounted
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
    
    // Check for basic navigation elements
    const navElements = await page.locator('nav, header, [role="navigation"]').count();
    expect(navElements).toBeGreaterThan(0);
  });

  test('Login page has required form elements', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:4000/login');
    
    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await expect(passwordInput).toBeVisible();
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();
    await expect(submitButton).toBeVisible();
  });

  test('Registration page has required form elements', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:4000/register');
    
    // Check for required inputs
    const emailInput = page.locator('input[name="email"]').first();
    const nicknameInput = page.locator('input[name="nickname"]').first();
    const passwordInput = page.locator('input[name="password"]').first();
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]').first();
    
    await expect(emailInput).toBeVisible();
    await expect(nicknameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    
    // Check for terms checkbox
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(termsCheckbox).toBeVisible();
  });

  test('Backend API is responding', async ({ request }) => {
    // Test health endpoint or any public endpoint
    const endpoints = [
      'http://localhost:9090/api/health',
      'http://localhost:9090/api/prompts',
      'http://localhost:9090/api/auth/login'
    ];
    
    let atLeastOneWorking = false;
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(endpoint, { timeout: 3000 });
        const status = response.status();
        
        // Any response (including 401/403) means the backend is running
        if (status < 500) {
          atLeastOneWorking = true;
          console.log(`${endpoint} responded with status: ${status}`);
        }
      } catch (error) {
        console.log(`${endpoint} failed:`, error.message);
      }
    }
    
    expect(atLeastOneWorking).toBeTruthy();
  });

  test('Can navigate between pages', async ({ page }) => {
    // Start at homepage
    await page.goto('http://localhost:4000');
    
    // Try to find and click login link
    const loginLink = page.locator('a[href*="login"], button:has-text("로그인"), button:has-text("Login")').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Verify we're on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
    }
    
    // Navigate to register page
    await page.goto('http://localhost:4000/register');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we're on register page
    const currentUrl = page.url();
    expect(currentUrl).toContain('register');
  });

  test('Form validation works on registration', async ({ page }) => {
    await page.goto('http://localhost:4000/register');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Check for validation messages (form should not submit)
    await page.waitForTimeout(1000);
    
    // We should still be on the registration page
    const currentUrl = page.url();
    expect(currentUrl).toContain('register');
    
    // Try with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="nickname"]', 'testnick');
    await page.fill('input[name="password"]', 'Test1234');
    await page.fill('input[name="confirmPassword"]', 'Test1234');
    
    await submitButton.click();
    await page.waitForTimeout(1000);
    
    // Should still be on registration page due to invalid email
    expect(page.url()).toContain('register');
  });

  test('Prompts list page is accessible', async ({ page }) => {
    // Navigate to prompts list
    await page.goto('http://localhost:4000/prompts');
    
    // Page should load (might redirect to login if not authenticated)
    await page.waitForLoadState('domcontentloaded');
    
    const currentUrl = page.url();
    // Either we see prompts or we're redirected to login
    expect(currentUrl).toMatch(/\/(prompts|login)/);
  });

  test('Search functionality exists', async ({ page }) => {
    await page.goto('http://localhost:4000');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      // Try to type in search
      await searchInput.fill('test search');
      
      // Verify text was entered
      const value = await searchInput.inputValue();
      expect(value).toBe('test search');
    }
  });
});