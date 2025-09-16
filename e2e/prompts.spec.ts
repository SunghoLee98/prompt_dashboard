import { test, expect } from '@playwright/test';

test.describe('Prompt Management', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `promptuser${timestamp}@example.com`,
    password: 'TestPassword123!',
    nickname: `promptuser${timestamp}`
  };
  
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Register user via API
    await request.post('http://localhost:8080/api/auth/register', {
      data: testUser
    });
    
    // Login and get token
    const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.data.accessToken;
  });

  test.beforeEach(async ({ page }) => {
    // Set auth token in localStorage
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('accessToken', token);
    }, authToken);
  });

  test('01. Create new prompt', async ({ page }) => {
    await page.goto('/prompts/create');
    
    // Fill prompt form
    await page.fill('input[name="title"]', 'Test Prompt Title');
    await page.fill('textarea[name="description"]', 'This is a test prompt description');
    await page.fill('textarea[name="content"]', 'You are an AI assistant that helps with testing.');
    
    // Select category
    await page.selectOption('select[name="category"]', 'CODING');
    
    // Add tags
    await page.fill('input[name="tags"]', 'test, ai, assistant');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify redirect to prompt detail
    await expect(page).toHaveURL(/\/prompts\/\d+/);
    await expect(page.locator('h1:has-text("Test Prompt Title")')).toBeVisible();
  });

  test('02. View prompt list', async ({ page }) => {
    await page.goto('/prompts');
    
    // Verify prompts are loaded
    await expect(page.locator('.prompt-card').first()).toBeVisible();
    
    // Verify pagination
    const promptCards = await page.locator('.prompt-card').count();
    expect(promptCards).toBeGreaterThan(0);
    expect(promptCards).toBeLessThanOrEqual(20);
  });

  test('03. Edit prompt', async ({ page }) => {
    // Create a prompt first
    await page.goto('/prompts/create');
    await page.fill('input[name="title"]', 'Prompt to Edit');
    await page.fill('textarea[name="description"]', 'Original description');
    await page.fill('textarea[name="content"]', 'Original content');
    await page.selectOption('select[name="category"]', 'WRITING');
    await page.click('button[type="submit"]');
    
    // Click edit button
    await page.click('button:has-text("Edit")');
    
    // Update fields
    await page.fill('input[name="title"]', 'Updated Prompt Title');
    await page.fill('textarea[name="description"]', 'Updated description');
    
    // Save changes
    await page.click('button:has-text("Save")');
    
    // Verify updates
    await expect(page.locator('h1:has-text("Updated Prompt Title")')).toBeVisible();
    await expect(page.locator('text=Updated description')).toBeVisible();
  });

  test('04. Delete prompt', async ({ page }) => {
    // Create a prompt to delete
    await page.goto('/prompts/create');
    await page.fill('input[name="title"]', 'Prompt to Delete');
    await page.fill('textarea[name="description"]', 'This will be deleted');
    await page.fill('textarea[name="content"]', 'Delete me');
    await page.selectOption('select[name="category"]', 'OTHER');
    await page.click('button[type="submit"]');
    
    // Click delete button
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify redirect to list
    await expect(page).toHaveURL('/prompts');
    await expect(page.locator('text=Prompt deleted successfully')).toBeVisible();
  });

  test('05. Like and rate prompt', async ({ page }) => {
    await page.goto('/prompts');
    
    // Click on first prompt
    await page.locator('.prompt-card').first().click();
    
    // Like the prompt
    const likeButton = page.locator('button[aria-label="Like"]');
    await likeButton.click();
    await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
    
    // Rate the prompt
    await page.click('[aria-label="Rate 4 stars"]');
    await expect(page.locator('text=Rating submitted')).toBeVisible();
    
    // Verify rating is displayed
    await expect(page.locator('.rating-display')).toContainText('4');
  });

  test('06. View count tracking', async ({ page }) => {
    await page.goto('/prompts');
    
    // Get initial view count of first prompt
    const firstPrompt = page.locator('.prompt-card').first();
    const initialViews = await firstPrompt.locator('.view-count').textContent();
    
    // Click to view detail
    await firstPrompt.click();
    
    // Go back to list
    await page.goBack();
    
    // Check view count increased
    const updatedViews = await firstPrompt.locator('.view-count').textContent();
    expect(parseInt(updatedViews || '0')).toBeGreaterThan(parseInt(initialViews || '0'));
  });
});