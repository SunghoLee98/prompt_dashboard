import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('Homepage loads', async ({ page }) => {
    await page.goto('/');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'homepage.png' });
    
    // Log page content
    const content = await page.content();
    console.log('Page URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check if we're redirected
    const finalUrl = page.url();
    console.log('Final URL after navigation:', finalUrl);
    
    // Look for any authentication elements
    const hasLogin = await page.locator('text=/login/i').count();
    const hasSignup = await page.locator('text=/sign.*up/i').count();
    const hasEmail = await page.locator('input[type="email"]').count();
    const hasPassword = await page.locator('input[type="password"]').count();
    
    console.log('Login elements found:', hasLogin);
    console.log('Signup elements found:', hasSignup);
    console.log('Email inputs found:', hasEmail);
    console.log('Password inputs found:', hasPassword);
    
    // List all buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('Buttons found:', buttons);
    
    // List all links
    const links = await page.locator('a').allTextContents();
    console.log('Links found:', links);
  });
});