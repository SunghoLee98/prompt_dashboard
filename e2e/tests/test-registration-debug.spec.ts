import { test, expect } from '@playwright/test';

test('Debug registration flow', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });
  
  // Listen for network failures
  page.on('requestfailed', request => {
    console.log('Request failed:', request.url(), request.failure()?.errorText);
  });
  
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testNickname = `test${timestamp}`;
  const testPassword = 'Test1234';
  
  await page.goto('http://localhost:4000/register');
  
  // Fill registration form
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="nickname"]', testNickname);
  await page.fill('input[name="password"]', testPassword);
  await page.fill('input[name="confirmPassword"]', testPassword);
  
  // Check terms checkbox
  await page.check('input[data-testid="terms-checkbox"]');
  
  // Take screenshot before submit
  await page.screenshot({ path: 'before-submit.png' });
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait a bit for any response
  await page.waitForTimeout(3000);
  
  // Take screenshot after submit
  await page.screenshot({ path: 'after-submit.png' });
  
  // Check current URL
  const currentUrl = page.url();
  console.log('Current URL after submit:', currentUrl);
  
  // Check for any error messages on the page
  const errorElements = await page.locator('text=/error/i').count();
  console.log('Error elements found:', errorElements);
  
  // Should redirect to login page
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
});
