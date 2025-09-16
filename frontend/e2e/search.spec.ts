import { test, expect, Page } from '@playwright/test';

// Helper function to login
async function loginUser(page: Page) {
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
  
  await expect(page).toHaveURL('/prompts');
  
  return { email, nickname, password };
}

// Helper to create test prompts
async function createTestPrompt(page: Page, title: string, category: string, tags: string) {
  await page.goto('/prompts/create');
  await page.fill('input[name="title"]', title);
  await page.fill('textarea[name="description"]', `Description for ${title}`);
  await page.fill('textarea[name="content"]', `Content for ${title}`);
  await page.selectOption('select[name="category"]', category);
  await page.fill('input[name="tags"]', tags);
  await page.check('input[name="isPublic"]');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/prompts\/\d+/);
}

test.describe('Search and Filter Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('TC019: Search by Title', async ({ page }) => {
    const uniqueTitle = `Unique Title ${Date.now()}`;
    
    // Create a prompt with unique title
    await createTestPrompt(page, uniqueTitle, 'WRITING', 'test, search');
    
    // Go to prompts list
    await page.goto('/prompts');
    
    // Search for the prompt
    await page.fill('input[placeholder*="Search"]', uniqueTitle);
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Verify search results
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
    
    // Verify other prompts are filtered out
    const promptCount = await page.locator('[data-testid="prompt-card"]').count();
    expect(promptCount).toBe(1);
  });

  test('TC020: Filter by Category', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create prompts in different categories
    await createTestPrompt(page, `Writing Prompt ${timestamp}`, 'WRITING', 'writing');
    await createTestPrompt(page, `Code Prompt ${timestamp}`, 'CODING', 'coding');
    await createTestPrompt(page, `Marketing Prompt ${timestamp}`, 'MARKETING', 'marketing');
    
    // Go to prompts list
    await page.goto('/prompts');
    
    // Filter by CODING category
    await page.selectOption('select[name="category"]', 'CODING');
    
    // Verify only coding prompts are shown
    await expect(page.locator(`text=Code Prompt ${timestamp}`)).toBeVisible();
    await expect(page.locator(`text=Writing Prompt ${timestamp}`)).not.toBeVisible();
    await expect(page.locator(`text=Marketing Prompt ${timestamp}`)).not.toBeVisible();
  });

  test('TC021: Sort by Date', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create prompts with delays
    await createTestPrompt(page, `First Prompt ${timestamp}`, 'WRITING', 'first');
    await page.waitForTimeout(1000);
    await createTestPrompt(page, `Second Prompt ${timestamp}`, 'WRITING', 'second');
    await page.waitForTimeout(1000);
    await createTestPrompt(page, `Third Prompt ${timestamp}`, 'WRITING', 'third');
    
    // Go to prompts list
    await page.goto('/prompts');
    
    // Sort by date (newest first)
    await page.selectOption('select[name="sort"]', 'date_desc');
    
    // Get all prompt titles
    const prompts = await page.locator('[data-testid="prompt-title"]').allTextContents();
    
    // Verify order (newest first)
    expect(prompts[0]).toContain('Third Prompt');
    expect(prompts[1]).toContain('Second Prompt');
    expect(prompts[2]).toContain('First Prompt');
  });

  test('TC022: Filter by Tags', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create prompts with different tags
    await createTestPrompt(page, `Python Prompt ${timestamp}`, 'CODING', 'python, programming');
    await createTestPrompt(page, `JavaScript Prompt ${timestamp}`, 'CODING', 'javascript, web');
    await createTestPrompt(page, `Java Prompt ${timestamp}`, 'CODING', 'java, backend');
    
    // Go to prompts list
    await page.goto('/prompts');
    
    // Click on python tag
    await page.click('text=python');
    
    // Verify only python prompts are shown
    await expect(page.locator(`text=Python Prompt ${timestamp}`)).toBeVisible();
    await expect(page.locator(`text=JavaScript Prompt ${timestamp}`)).not.toBeVisible();
    await expect(page.locator(`text=Java Prompt ${timestamp}`)).not.toBeVisible();
  });

  test('TC023: Pagination', async ({ page }) => {
    // This test assumes there are enough prompts to paginate
    await page.goto('/prompts');
    
    // Check if pagination controls exist
    const pagination = page.locator('[aria-label="pagination"]');
    
    if (await pagination.isVisible()) {
      // Click next page
      await page.click('button[aria-label="Next page"]');
      
      // Verify URL changed
      await expect(page).toHaveURL(/page=2/);
      
      // Click previous page
      await page.click('button[aria-label="Previous page"]');
      
      // Verify URL changed back
      await expect(page).toHaveURL(/page=1|prompts$/);
    }
  });

  test('TC024: Combined Filters', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create various prompts
    await createTestPrompt(page, `Python Tutorial ${timestamp}`, 'CODING', 'python, tutorial');
    await createTestPrompt(page, `Python Script ${timestamp}`, 'CODING', 'python, automation');
    await createTestPrompt(page, `JavaScript Tutorial ${timestamp}`, 'CODING', 'javascript, tutorial');
    await createTestPrompt(page, `Writing Guide ${timestamp}`, 'WRITING', 'guide, tutorial');
    
    // Go to prompts list
    await page.goto('/prompts');
    
    // Apply multiple filters
    await page.selectOption('select[name="category"]', 'CODING');
    await page.fill('input[placeholder*="Search"]', 'Python');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Verify results
    await expect(page.locator(`text=Python Tutorial ${timestamp}`)).toBeVisible();
    await expect(page.locator(`text=Python Script ${timestamp}`)).toBeVisible();
    await expect(page.locator(`text=JavaScript Tutorial ${timestamp}`)).not.toBeVisible();
    await expect(page.locator(`text=Writing Guide ${timestamp}`)).not.toBeVisible();
  });

  test('TC025: Clear Filters', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create test prompts
    await createTestPrompt(page, `Test Prompt 1 ${timestamp}`, 'CODING', 'test1');
    await createTestPrompt(page, `Test Prompt 2 ${timestamp}`, 'WRITING', 'test2');
    
    // Go to prompts list and apply filters
    await page.goto('/prompts');
    await page.selectOption('select[name="category"]', 'CODING');
    
    // Clear filters
    await page.click('button:has-text("Clear Filters")');
    
    // Verify all prompts are visible
    await expect(page.locator(`text=Test Prompt 1 ${timestamp}`)).toBeVisible();
    await expect(page.locator(`text=Test Prompt 2 ${timestamp}`)).toBeVisible();
  });
});