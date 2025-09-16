import { test, expect } from '@playwright/test';

test('Can view prompt detail page without authentication', async ({ page }) => {
  // Go directly to a prompt detail page
  await page.goto('http://localhost:4000/prompts/1');
  
  // Wait for content to load
  await page.waitForLoadState('networkidle');
  
  // Check if prompt title is visible
  const title = page.locator('h1, h2').first();
  await expect(title).toBeVisible({ timeout: 10000 });
  
  // Check for rating display
  const ratingSection = page.locator('[data-testid="rating-display"]').or(page.locator('.rating-display')).or(page.locator('text=/평점/'));
  const hasRating = await ratingSection.count() > 0;
  
  if (hasRating) {
    console.log('Rating section found');
  }
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'prompt-detail-test.png' });
  
  // Check that page doesn't show error
  const errorMessage = page.locator('text=/error/i').or(page.locator('text=/오류/'));
  const errorCount = await errorMessage.count();
  expect(errorCount).toBe(0);
});
