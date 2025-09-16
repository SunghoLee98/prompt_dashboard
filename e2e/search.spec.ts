import { test, expect } from '@playwright/test';

test.describe('Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prompts');
  });

  test('01. Search by keyword', async ({ page }) => {
    // Enter search term
    await page.fill('input[placeholder*="Search"]', 'AI assistant');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Verify search results
    await expect(page.locator('.search-results')).toBeVisible();
    
    // Verify all results contain the search term
    const results = await page.locator('.prompt-card').all();
    for (const result of results) {
      const text = await result.textContent();
      expect(text?.toLowerCase()).toContain('ai');
    }
  });

  test('02. Filter by category', async ({ page }) => {
    // Select category filter
    await page.selectOption('select[name="category"]', 'CODING');
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    
    // Verify all results are in CODING category
    const categoryTags = await page.locator('.category-tag').allTextContents();
    for (const tag of categoryTags) {
      expect(tag).toBe('CODING');
    }
  });

  test('03. Sort by popularity', async ({ page }) => {
    // Select sort option
    await page.selectOption('select[name="sort"]', 'likes');
    
    // Wait for sorted results
    await page.waitForLoadState('networkidle');
    
    // Get like counts
    const likeCounts = await page.locator('.like-count').allTextContents();
    const counts = likeCounts.map(c => parseInt(c.replace(/[^0-9]/g, '')));
    
    // Verify descending order
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
    }
  });

  test('04. Sort by date', async ({ page }) => {
    // Select sort by newest
    await page.selectOption('select[name="sort"]', 'newest');
    
    // Wait for sorted results
    await page.waitForLoadState('networkidle');
    
    // Get dates
    const dates = await page.locator('.prompt-date').allTextContents();
    const timestamps = dates.map(d => new Date(d).getTime());
    
    // Verify descending order
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
    }
  });

  test('05. Filter by tags', async ({ page }) => {
    // Click on a tag
    const firstTag = page.locator('.tag-chip').first();
    const tagText = await firstTag.textContent();
    await firstTag.click();
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    
    // Verify all results have the selected tag
    const results = await page.locator('.prompt-card').all();
    for (const result of results) {
      const tags = await result.locator('.tag-chip').allTextContents();
      expect(tags).toContain(tagText);
    }
  });

  test('06. Pagination', async ({ page }) => {
    // Check if pagination exists
    const pagination = page.locator('.pagination');
    
    if (await pagination.isVisible()) {
      // Get first page content
      const firstPageTitle = await page.locator('.prompt-card').first().locator('.title').textContent();
      
      // Go to next page
      await page.click('button[aria-label="Next page"]');
      await page.waitForLoadState('networkidle');
      
      // Get second page content
      const secondPageTitle = await page.locator('.prompt-card').first().locator('.title').textContent();
      
      // Verify different content
      expect(firstPageTitle).not.toBe(secondPageTitle);
      
      // Go back to first page
      await page.click('button[aria-label="Previous page"]');
      await page.waitForLoadState('networkidle');
      
      // Verify back on first page
      const backToFirstTitle = await page.locator('.prompt-card').first().locator('.title').textContent();
      expect(backToFirstTitle).toBe(firstPageTitle);
    }
  });

  test('07. Combined filters', async ({ page }) => {
    // Apply multiple filters
    await page.selectOption('select[name="category"]', 'WRITING');
    await page.selectOption('select[name="sort"]', 'rating');
    await page.fill('input[placeholder*="Search"]', 'creative');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Wait for results
    await page.waitForLoadState('networkidle');
    
    // Verify filters are applied
    const results = await page.locator('.prompt-card').all();
    
    if (results.length > 0) {
      // Check category
      const categories = await page.locator('.category-tag').allTextContents();
      for (const cat of categories) {
        expect(cat).toBe('WRITING');
      }
      
      // Check search term
      for (const result of results) {
        const text = await result.textContent();
        expect(text?.toLowerCase()).toContain('creative');
      }
    }
  });
});