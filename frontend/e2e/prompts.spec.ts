import { test, expect, Page } from '@playwright/test';

const API_URL = 'http://localhost:9090';

// Helper function to login
async function loginUser(page: Page) {
  const email = `test${Date.now()}@example.com`;
  const nickname = `user${Date.now()}`;
  const password = 'TestPassword123!';
  
  // Register
  await page.goto('/register');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.fill('input[name="nickname"]', nickname);
  await page.click('button[type="submit"]');
  
  // Login
  await page.waitForURL('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/prompts');
  
  return { email, nickname, password };
}

test.describe('Prompt Management Tests', () => {
  test('TC011: Create Prompt - Happy Path', async ({ page }) => {
    await loginUser(page);
    
    // Navigate to create prompt
    await page.click('text=/프롬프트.*작성|새.*프롬프트|Create Prompt/i');
    await expect(page).toHaveURL('/prompts/create');
    
    // Fill prompt form
    const promptTitle = `Test Prompt ${Date.now()}`;
    await page.fill('input[name="title"]', promptTitle);
    await page.fill('textarea[name="description"]', 'This is a test description for the prompt');
    await page.fill('textarea[name="content"]', 'This is the detailed content of the test prompt with instructions');
    
    // Select category
    await page.selectOption('select[name="category"]', 'WRITING');
    
    // Add tags
    await page.fill('input[name="tags"]', 'test, automation, playwright');
    
    // Set as public
    await page.check('input[name="isPublic"]');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify creation
    await expect(page).toHaveURL(/\/prompts\/\d+/);
    await expect(page.locator(`h1:has-text("${promptTitle}")`)).toBeVisible();
  });

  test('TC012: Create Prompt - Missing Required Fields', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/prompts/create');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=/제목.*필수|title.*required/i')).toBeVisible();
    await expect(page.locator('text=/설명.*필수|description.*required/i')).toBeVisible();
    await expect(page.locator('text=/내용.*필수|content.*required/i')).toBeVisible();
  });

  test('TC013: View Prompt List', async ({ page }) => {
    await loginUser(page);
    
    // Create a prompt first
    await page.goto('/prompts/create');
    const promptTitle = `List Test ${Date.now()}`;
    await page.fill('input[name="title"]', promptTitle);
    await page.fill('textarea[name="description"]', 'Description for list test');
    await page.fill('textarea[name="content"]', 'Content for list test');
    await page.selectOption('select[name="category"]', 'WRITING');
    await page.check('input[name="isPublic"]');
    await page.click('button[type="submit"]');
    
    // Go to prompts list
    await page.goto('/prompts');
    
    // Check if prompt appears in list
    await expect(page.locator(`text=${promptTitle}`)).toBeVisible({ timeout: 10000 });
  });

  test('TC014: Edit Prompt', async ({ page }) => {
    const user = await loginUser(page);
    
    // Create a prompt
    await page.goto('/prompts/create');
    const originalTitle = `Original ${Date.now()}`;
    await page.fill('input[name="title"]', originalTitle);
    await page.fill('textarea[name="description"]', 'Original description');
    await page.fill('textarea[name="content"]', 'Original content');
    await page.selectOption('select[name="category"]', 'WRITING');
    await page.check('input[name="isPublic"]');
    await page.click('button[type="submit"]');
    
    // Wait for prompt page
    await page.waitForURL(/\/prompts\/\d+/);
    
    // Click edit button
    await page.click('text=Edit');
    
    // Update prompt
    const updatedTitle = `Updated ${Date.now()}`;
    await page.fill('input[name="title"]', updatedTitle);
    await page.fill('textarea[name="description"]', 'Updated description');
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator(`h1:has-text("${updatedTitle}")`)).toBeVisible();
  });

  test('TC015: Delete Prompt', async ({ page }) => {
    await loginUser(page);
    
    // Create a prompt
    await page.goto('/prompts/create');
    const promptTitle = `Delete Test ${Date.now()}`;
    await page.fill('input[name="title"]', promptTitle);
    await page.fill('textarea[name="description"]', 'To be deleted');
    await page.fill('textarea[name="content"]', 'This will be deleted');
    await page.selectOption('select[name="category"]', 'WRITING');
    await page.check('input[name="isPublic"]');
    await page.click('button[type="submit"]');
    
    // Wait for prompt page
    await page.waitForURL(/\/prompts\/\d+/);
    
    // Delete prompt
    page.on('dialog', dialog => dialog.accept());
    await page.click('text=Delete');
    
    // Verify deletion
    await expect(page).toHaveURL('/prompts');
    await expect(page.locator(`text=${promptTitle}`)).not.toBeVisible();
  });

  test('TC016: Like/Unlike Prompt', async ({ page }) => {
    // Create two users
    const user1 = await loginUser(page);
    
    // User 1 creates a prompt
    await page.goto('/prompts/create');
    const promptTitle = `Like Test ${Date.now()}`;
    await page.fill('input[name="title"]', promptTitle);
    await page.fill('textarea[name="description"]', 'Test for likes');
    await page.fill('textarea[name="content"]', 'Content for like test');
    await page.selectOption('select[name="category"]', 'WRITING');
    await page.check('input[name="isPublic"]');
    await page.click('button[type="submit"]');
    
    const promptUrl = page.url();
    
    // Logout
    await page.click(`text=${user1.nickname}`);
    await page.click('text=Logout');
    
    // Login as different user
    const user2 = await loginUser(page);
    
    // Navigate to the prompt
    await page.goto(promptUrl);
    
    // Like the prompt
    const likeButton = page.locator('button:has-text("Like")').first();
    await likeButton.click();
    
    // Verify like count increased
    await expect(page.locator('text=/1.*like/i')).toBeVisible();
    
    // Unlike
    await likeButton.click();
    
    // Verify like count decreased
    await expect(page.locator('text=/0.*likes/i')).toBeVisible();
  });

  test('TC017: Rate Prompt', async ({ page }) => {
    // Create two users
    const user1 = await loginUser(page);
    
    // User 1 creates a prompt
    await page.goto('/prompts/create');
    const promptTitle = `Rating Test ${Date.now()}`;
    await page.fill('input[name="title"]', promptTitle);
    await page.fill('textarea[name="description"]', 'Test for ratings');
    await page.fill('textarea[name="content"]', 'Content for rating test');
    await page.selectOption('select[name="category"]', 'WRITING');
    await page.check('input[name="isPublic"]');
    await page.click('button[type="submit"]');
    
    const promptUrl = page.url();
    
    // Logout
    await page.click(`text=${user1.nickname}`);
    await page.click('text=Logout');
    
    // Login as different user
    const user2 = await loginUser(page);
    
    // Navigate to the prompt
    await page.goto(promptUrl);
    
    // Rate the prompt (5 stars)
    const star5 = page.locator('[aria-label="5 stars"]');
    await star5.click();
    
    // Verify rating
    await expect(page.locator('text=/5.*stars/i')).toBeVisible();
    await expect(page.locator('text=/average.*5/i')).toBeVisible();
  });

  test('TC018: Cannot Rate Own Prompt', async ({ page }) => {
    const user = await loginUser(page);
    
    // Create a prompt
    await page.goto('/prompts/create');
    const promptTitle = `Own Rating Test ${Date.now()}`;
    await page.fill('input[name="title"]', promptTitle);
    await page.fill('textarea[name="description"]', 'Test for own rating');
    await page.fill('textarea[name="content"]', 'Content for own rating test');
    await page.selectOption('select[name="category"]', 'WRITING');
    await page.check('input[name="isPublic"]');
    await page.click('button[type="submit"]');
    
    // Try to rate own prompt
    const ratingSection = page.locator('[aria-label="Rating section"]');
    
    // Rating should be disabled or show message
    const disabledMessage = page.locator('text=/cannot.*rate.*own/i');
    const isDisabled = await ratingSection.locator('button').isDisabled().catch(() => false);
    
    if (!isDisabled) {
      await expect(disabledMessage).toBeVisible();
    }
  });
});