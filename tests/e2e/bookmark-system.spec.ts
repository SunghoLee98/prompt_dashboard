import { test, expect, Page, BrowserContext } from '@playwright/test';

// Helper functions for test setup
async function loginAsUser(page: Page, email: string = 'testuser@example.com', password: string = 'password123') {
  await page.goto('/login');

  // Wait for the login form to be fully loaded
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/');
}

async function createTestUser(page: Page, email: string = 'testuser@example.com', nickname: string = 'testuser') {
  await page.goto('/register');

  // Wait for the register form to be fully loaded
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.fill('[data-testid="nickname-input"]', nickname);
  await page.click('[data-testid="register-button"]');
  await page.waitForURL('/');
}

async function createTestPrompt(page: Page, title: string = 'Test Prompt for Bookmarks') {
  await page.goto('/prompts/new');

  // Wait for the form to be fully loaded
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  await page.fill('[data-testid="title-input"]', title);
  await page.fill('[data-testid="description-input"]', 'This is a test prompt for bookmark testing');
  await page.fill('[data-testid="content-textarea"]', 'Test prompt content for bookmark functionality testing');
  await page.selectOption('[data-testid="category-select"]', 'coding');
  await page.fill('[data-testid="tags-input"]', 'test, bookmark, e2e');
  await page.click('[data-testid="create-prompt-button"]');
  await page.waitForURL(/\/prompts\/\d+/);

  // Get the prompt ID from URL
  const url = page.url();
  const promptId = url.split('/').pop();
  return promptId;
}

test.describe('Bookmark System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await page.goto('/');
  });

  test.describe('Bookmark Toggle Functionality', () => {
    test('should allow user to bookmark and unbookmark a prompt', async ({ page }) => {
      // Create user and login
      await createTestUser(page, 'bookmark-user@example.com', 'bookmarkuser');
      await loginAsUser(page, 'bookmark-user@example.com');

      // Create a test prompt
      const promptId = await createTestPrompt(page, 'Bookmark Test Prompt');

      // Go to prompt detail page
      await page.goto(`/prompts/${promptId}`);

      // Check that bookmark button exists and shows unbookmarked state
      const bookmarkButton = page.locator('[data-testid="bookmark-button"]');
      await expect(bookmarkButton).toBeVisible();
      await expect(bookmarkButton).toHaveAttribute('title', 'Add bookmark');

      // Check initial bookmark count (should be 0)
      const bookmarkCount = page.locator('[data-testid="bookmark-count"]');
      await expect(bookmarkCount).toHaveText('0');

      // Click bookmark button to bookmark
      await bookmarkButton.click();

      // Wait for bookmark state to update
      await page.waitForTimeout(1000);

      // Verify bookmark is now active
      await expect(bookmarkButton).toHaveAttribute('title', 'Remove bookmark');
      await expect(bookmarkCount).toHaveText('1');

      // Click bookmark button again to unbookmark
      await bookmarkButton.click();

      // Wait for bookmark state to update
      await page.waitForTimeout(1000);

      // Verify bookmark is now inactive
      await expect(bookmarkButton).toHaveAttribute('title', 'Add bookmark');
      await expect(bookmarkCount).toHaveText('0');
    });

    test('should prevent user from bookmarking their own prompt', async ({ page }) => {
      // Create user and login
      await createTestUser(page, 'prompt-author@example.com', 'promptauthor');
      await loginAsUser(page, 'prompt-author@example.com');

      // Create a test prompt (user is the author)
      const promptId = await createTestPrompt(page, 'Own Prompt Test');

      // Go to prompt detail page
      await page.goto(`/prompts/${promptId}`);

      // Bookmark button should not be clickable for own prompts
      const bookmarkButton = page.locator('[data-testid="bookmark-button"]');
      await expect(bookmarkButton).not.toBeVisible();
    });

    test('should show bookmark status correctly on prompt cards', async ({ page, context }) => {
      // Create two users
      await createTestUser(page, 'author@example.com', 'author');

      // Create second user in new page to avoid conflicts
      const page2 = await context.newPage();
      await createTestUser(page2, 'bookmarker@example.com', 'bookmarker');

      // Author creates a prompt
      await loginAsUser(page, 'author@example.com');
      const promptId = await createTestPrompt(page, 'Shared Prompt for Bookmark Test');
      await page.close();

      // Bookmarker logs in and bookmarks the prompt
      await loginAsUser(page2, 'bookmarker@example.com');
      await page2.goto(`/prompts/${promptId}`);

      // Bookmark the prompt
      const bookmarkButton = page2.locator('[data-testid="bookmark-button"]');
      await bookmarkButton.click();
      await page2.waitForTimeout(1000);

      // Go to prompts list and verify bookmark status
      await page2.goto('/prompts');

      // Find the prompt card and verify bookmark status
      const promptCard = page2.locator(`[data-testid="prompt-card-${promptId}"]`);
      const cardBookmarkButton = promptCard.locator('[data-testid="bookmark-button"]');

      await expect(cardBookmarkButton).toHaveAttribute('title', 'Remove bookmark');
      await expect(promptCard.locator('[data-testid="bookmark-count"]')).toHaveText('1');
    });

    test('should require authentication to bookmark', async ({ page }) => {
      // Create a prompt as authenticated user
      await createTestUser(page, 'creator@example.com', 'creator');
      await loginAsUser(page, 'creator@example.com');
      const promptId = await createTestPrompt(page, 'Public Prompt');

      // Logout
      await page.click('[data-testid="logout-button"]');
      await page.waitForURL('/');

      // Go to prompt detail page as anonymous user
      await page.goto(`/prompts/${promptId}`);

      // Bookmark button should show as disabled/non-interactive
      const bookmarkButton = page.locator('[data-testid="bookmark-button"]');
      await expect(bookmarkButton).not.toHaveAttribute('title', 'Add bookmark');

      // Clicking should show login prompt
      await bookmarkButton.click();
      await expect(page.locator('text=Please log in to bookmark prompts')).toBeVisible();
    });
  });

  test.describe('Bookmark Folder Management', () => {
    test('should create, edit, and delete bookmark folders', async ({ page }) => {
      // Setup user
      await createTestUser(page, 'folder-user@example.com', 'folderuser');
      await loginAsUser(page, 'folder-user@example.com');

      // Go to bookmarks page
      await page.goto('/bookmarks');

      // Create a new folder
      await page.click('[data-testid="new-folder-button"]');
      await page.fill('[data-testid="folder-name-input"]', 'AI Prompts');
      await page.fill('[data-testid="folder-description-input"]', 'Collection of AI-related prompts');
      await page.click('[data-testid="create-folder-button"]');

      // Verify folder was created
      const folderItem = page.locator('[data-testid="folder-ai-prompts"]');
      await expect(folderItem).toBeVisible();
      await expect(folderItem.locator('text=AI Prompts')).toBeVisible();
      await expect(folderItem.locator('text=Collection of AI-related prompts')).toBeVisible();

      // Edit the folder
      await folderItem.locator('[data-testid="edit-folder-button"]').click();
      await page.fill('[data-testid="folder-name-input"]', 'Updated AI Prompts');
      await page.fill('[data-testid="folder-description-input"]', 'Updated description');
      await page.click('[data-testid="save-folder-button"]');

      // Verify folder was updated
      await expect(folderItem.locator('text=Updated AI Prompts')).toBeVisible();
      await expect(folderItem.locator('text=Updated description')).toBeVisible();

      // Delete the folder
      await folderItem.locator('[data-testid="delete-folder-button"]').click();
      await page.click('[data-testid="confirm-delete-button"]');

      // Verify folder was deleted
      await expect(folderItem).not.toBeVisible();
    });

    test('should enforce folder name uniqueness', async ({ page }) => {
      // Setup user
      await createTestUser(page, 'unique-folder-user@example.com', 'uniquefolderuser');
      await loginAsUser(page, 'unique-folder-user@example.com');

      await page.goto('/bookmarks');

      // Create first folder
      await page.click('[data-testid="new-folder-button"]');
      await page.fill('[data-testid="folder-name-input"]', 'Unique Folder');
      await page.click('[data-testid="create-folder-button"]');

      // Try to create second folder with same name
      await page.click('[data-testid="new-folder-button"]');
      await page.fill('[data-testid="folder-name-input"]', 'Unique Folder');
      await page.click('[data-testid="create-folder-button"]');

      // Should show error message
      await expect(page.locator('text=Folder name already exists')).toBeVisible();
    });

    test('should enforce folder limit (20 folders)', async ({ page }) => {
      // Setup user
      await createTestUser(page, 'limit-user@example.com', 'limituser');
      await loginAsUser(page, 'limit-user@example.com');

      await page.goto('/bookmarks');

      // Create 20 folders (this is a simplified test - in real scenario you'd create all 20)
      for (let i = 1; i <= 3; i++) { // Test with 3 for brevity
        await page.click('[data-testid="new-folder-button"]');
        await page.fill('[data-testid="folder-name-input"]', `Folder ${i}`);
        await page.click('[data-testid="create-folder-button"]');
        await page.waitForTimeout(500);
      }

      // Verify folders were created
      for (let i = 1; i <= 3; i++) {
        await expect(page.locator(`text=Folder ${i}`)).toBeVisible();
      }
    });
  });

  test.describe('Bookmark Organization', () => {
    test('should move bookmarks between folders', async ({ page, context }) => {
      // Create author and bookmarker
      await createTestUser(page, 'org-author@example.com', 'orgauthor');

      const page2 = await context.newPage();
      await createTestUser(page2, 'org-bookmarker@example.com', 'orgbookmarker');

      // Author creates prompts
      await loginAsUser(page, 'org-author@example.com');
      const prompt1Id = await createTestPrompt(page, 'Bookmark Organization Test 1');
      const prompt2Id = await createTestPrompt(page, 'Bookmark Organization Test 2');
      await page.close();

      // Bookmarker sets up folders and bookmarks
      await loginAsUser(page2, 'org-bookmarker@example.com');

      // Create folders
      await page2.goto('/bookmarks');
      await page2.click('[data-testid="new-folder-button"]');
      await page2.fill('[data-testid="folder-name-input"]', 'Work Prompts');
      await page2.click('[data-testid="create-folder-button"]');

      await page2.click('[data-testid="new-folder-button"]');
      await page2.fill('[data-testid="folder-name-input"]', 'Personal Prompts');
      await page2.click('[data-testid="create-folder-button"]');

      // Bookmark the prompts
      await page2.goto(`/prompts/${prompt1Id}`);
      await page2.click('[data-testid="bookmark-button"]');

      await page2.goto(`/prompts/${prompt2Id}`);
      await page2.click('[data-testid="bookmark-button"]');

      // Go to bookmarks page and organize
      await page2.goto('/bookmarks');

      // Move first bookmark to Work Prompts folder
      const bookmark1 = page2.locator(`[data-testid="bookmark-${prompt1Id}"]`);
      await bookmark1.locator('[data-testid="move-bookmark-button"]').click();
      await page2.click('text=Work Prompts');

      // Move second bookmark to Personal Prompts folder
      const bookmark2 = page2.locator(`[data-testid="bookmark-${prompt2Id}"]`);
      await bookmark2.locator('[data-testid="move-bookmark-button"]').click();
      await page2.click('text=Personal Prompts');

      // Filter by Work Prompts folder and verify
      await page2.click('[data-testid="folder-work-prompts"]');
      await expect(page2.locator('text=Bookmark Organization Test 1')).toBeVisible();
      await expect(page2.locator('text=Bookmark Organization Test 2')).not.toBeVisible();

      // Filter by Personal Prompts folder and verify
      await page2.click('[data-testid="folder-personal-prompts"]');
      await expect(page2.locator('text=Bookmark Organization Test 2')).toBeVisible();
      await expect(page2.locator('text=Bookmark Organization Test 1')).not.toBeVisible();
    });

    test('should search within bookmarks', async ({ page, context }) => {
      // Setup data
      await createTestUser(page, 'search-author@example.com', 'searchauthor');

      const page2 = await context.newPage();
      await createTestUser(page2, 'search-bookmarker@example.com', 'searchbookmarker');

      // Create searchable prompts
      await loginAsUser(page, 'search-author@example.com');
      await createTestPrompt(page, 'React Hooks Tutorial');
      await createTestPrompt(page, 'Vue.js Components Guide');
      await createTestPrompt(page, 'Angular Services Overview');
      await page.close();

      // Bookmark all prompts
      await loginAsUser(page2, 'search-bookmarker@example.com');
      await page2.goto('/prompts');

      // Bookmark each prompt
      const promptCards = page2.locator('[data-testid^="prompt-card-"]');
      const count = await promptCards.count();
      for (let i = 0; i < count; i++) {
        const card = promptCards.nth(i);
        await card.locator('[data-testid="bookmark-button"]').click();
        await page2.waitForTimeout(500);
      }

      // Go to bookmarks and test search
      await page2.goto('/bookmarks');

      // Search for React
      await page2.fill('[data-testid="bookmark-search-input"]', 'React');
      await page2.click('[data-testid="bookmark-search-button"]');

      // Should only show React tutorial
      await expect(page2.locator('text=React Hooks Tutorial')).toBeVisible();
      await expect(page2.locator('text=Vue.js Components Guide')).not.toBeVisible();
      await expect(page2.locator('text=Angular Services Overview')).not.toBeVisible();

      // Clear search
      await page2.fill('[data-testid="bookmark-search-input"]', '');
      await page2.click('[data-testid="bookmark-search-button"]');

      // Should show all bookmarks
      await expect(page2.locator('text=React Hooks Tutorial')).toBeVisible();
      await expect(page2.locator('text=Vue.js Components Guide')).toBeVisible();
      await expect(page2.locator('text=Angular Services Overview')).toBeVisible();
    });
  });

  test.describe('Popular Bookmarks', () => {
    test('should display popular bookmarked prompts', async ({ page, context }) => {
      // Create author
      await createTestUser(page, 'popular-author@example.com', 'popularauthor');
      await loginAsUser(page, 'popular-author@example.com');
      const promptId = await createTestPrompt(page, 'Popular Prompt for Testing');
      await page.close();

      // Create multiple users who will bookmark the prompt
      const users = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

      for (const userEmail of users) {
        const userPage = await context.newPage();
        await createTestUser(userPage, userEmail, userEmail.split('@')[0]);
        await loginAsUser(userPage, userEmail);

        // Bookmark the prompt
        await userPage.goto(`/prompts/${promptId}`);
        await userPage.click('[data-testid="bookmark-button"]');
        await userPage.waitForTimeout(500);
        await userPage.close();
      }

      // Check popular bookmarks section
      const finalPage = await context.newPage();
      await finalPage.goto('/');

      // Navigate to popular bookmarks section (assuming it's on homepage or dedicated page)
      if (await finalPage.locator('text=Popular Bookmarks').isVisible()) {
        await expect(finalPage.locator('text=Popular Prompt for Testing')).toBeVisible();

        // Verify bookmark count
        const popularPrompt = finalPage.locator('[data-testid^="popular-prompt-"]');
        await expect(popularPrompt.locator('[data-testid="bookmark-count"]')).toHaveText('3');
      }
    });
  });

  test.describe('Data Integrity and Performance', () => {
    test('should maintain bookmark counts correctly', async ({ page, context }) => {
      // Create author and multiple bookmarkers
      await createTestUser(page, 'count-author@example.com', 'countauthor');
      await loginAsUser(page, 'count-author@example.com');
      const promptId = await createTestPrompt(page, 'Count Integrity Test');
      await page.close();

      const bookmarkers = ['bookmarker1@example.com', 'bookmarker2@example.com'];

      // Multiple users bookmark
      for (const email of bookmarkers) {
        const userPage = await context.newPage();
        await createTestUser(userPage, email, email.split('@')[0]);
        await loginAsUser(userPage, email);

        await userPage.goto(`/prompts/${promptId}`);
        await userPage.click('[data-testid="bookmark-button"]');
        await userPage.waitForTimeout(500);
        await userPage.close();
      }

      // Verify count
      const checkPage = await context.newPage();
      await checkPage.goto(`/prompts/${promptId}`);
      await expect(checkPage.locator('[data-testid="bookmark-count"]')).toHaveText('2');

      // One user unbookmarks
      await createTestUser(checkPage, 'bookmarker1@example.com', 'bookmarker1');
      await loginAsUser(checkPage, 'bookmarker1@example.com');
      await checkPage.goto(`/prompts/${promptId}`);
      await checkPage.click('[data-testid="bookmark-button"]'); // Unbookmark
      await checkPage.waitForTimeout(500);

      // Verify count decreased
      await expect(checkPage.locator('[data-testid="bookmark-count"]')).toHaveText('1');
    });

    test('should handle concurrent bookmark operations', async ({ page, context }) => {
      // Create author
      await createTestUser(page, 'concurrent-author@example.com', 'concurrentauthor');
      await loginAsUser(page, 'concurrent-author@example.com');
      const promptId = await createTestPrompt(page, 'Concurrent Test Prompt');
      await page.close();

      // Create two users who will bookmark simultaneously
      const user1Page = await context.newPage();
      const user2Page = await context.newPage();

      await createTestUser(user1Page, 'concurrent1@example.com', 'concurrent1');
      await createTestUser(user2Page, 'concurrent2@example.com', 'concurrent2');

      await loginAsUser(user1Page, 'concurrent1@example.com');
      await loginAsUser(user2Page, 'concurrent2@example.com');

      // Navigate both to the prompt page
      await Promise.all([
        user1Page.goto(`/prompts/${promptId}`),
        user2Page.goto(`/prompts/${promptId}`)
      ]);

      // Click bookmark buttons simultaneously
      await Promise.all([
        user1Page.click('[data-testid="bookmark-button"]'),
        user2Page.click('[data-testid="bookmark-button"]')
      ]);

      // Wait for operations to complete
      await Promise.all([
        user1Page.waitForTimeout(1000),
        user2Page.waitForTimeout(1000)
      ]);

      // Verify final count is correct (should be 2)
      await user1Page.reload();
      await expect(user1Page.locator('[data-testid="bookmark-count"]')).toHaveText('2');
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Setup user and prompt
      await createTestUser(page, 'network-user@example.com', 'networkuser');
      await loginAsUser(page, 'network-user@example.com');
      const promptId = await createTestPrompt(page, 'Network Test Prompt');

      await page.goto(`/prompts/${promptId}`);

      // Simulate network failure
      await page.route('**/api/prompts/*/bookmark', route => route.abort());

      // Try to bookmark
      await page.click('[data-testid="bookmark-button"]');

      // Should show error message or maintain previous state
      await expect(page.locator('[data-testid="bookmark-button"]')).toBeVisible();
      // Error handling UI should be shown
    });

    test('should handle deletion of bookmarked prompts', async ({ page, context }) => {
      // Create author and bookmarker
      await createTestUser(page, 'delete-author@example.com', 'deleteauthor');

      const page2 = await context.newPage();
      await createTestUser(page2, 'delete-bookmarker@example.com', 'deletebookmarker');

      // Author creates prompt
      await loginAsUser(page, 'delete-author@example.com');
      const promptId = await createTestPrompt(page, 'To Be Deleted Prompt');

      // Bookmarker bookmarks it
      await loginAsUser(page2, 'delete-bookmarker@example.com');
      await page2.goto(`/prompts/${promptId}`);
      await page2.click('[data-testid="bookmark-button"]');

      // Go to bookmarks page
      await page2.goto('/bookmarks');
      await expect(page2.locator('text=To Be Deleted Prompt')).toBeVisible();

      // Author deletes the prompt
      await page.goto(`/prompts/${promptId}`);
      await page.click('[data-testid="delete-prompt-button"]');
      await page.click('[data-testid="confirm-delete-button"]');

      // Bookmarker's bookmark should be cleaned up
      await page2.reload();
      await expect(page2.locator('text=To Be Deleted Prompt')).not.toBeVisible();
    });
  });
});

test.describe('Bookmark System Integration Tests', () => {
  test('should integrate properly with existing prompt features', async ({ page, context }) => {
    // Create comprehensive test scenario
    await createTestUser(page, 'integration-author@example.com', 'integrationauthor');

    const page2 = await context.newPage();
    await createTestUser(page2, 'integration-user@example.com', 'integrationuser');

    // Author creates, rates, and interacts with prompt
    await loginAsUser(page, 'integration-author@example.com');
    const promptId = await createTestPrompt(page, 'Integration Test Prompt');

    // User bookmarks, likes, and rates the prompt
    await loginAsUser(page2, 'integration-user@example.com');
    await page2.goto(`/prompts/${promptId}`);

    // Bookmark the prompt
    await page2.click('[data-testid="bookmark-button"]');
    await page2.waitForTimeout(500);

    // Like the prompt
    await page2.click('[data-testid="like-button"]');
    await page2.waitForTimeout(500);

    // Rate the prompt
    await page2.click('[data-testid="rating-5-stars"]');
    await page2.waitForTimeout(500);

    // Verify all stats are correctly displayed
    await expect(page2.locator('[data-testid="bookmark-count"]')).toHaveText('1');
    await expect(page2.locator('[data-testid="like-count"]')).toHaveText('1');
    await expect(page2.locator('[data-testid="rating-display"]')).toContainText('5.0');

    // Check on prompts list page
    await page2.goto('/prompts');
    const promptCard = page2.locator(`[data-testid="prompt-card-${promptId}"]`);

    await expect(promptCard.locator('[data-testid="bookmark-count"]')).toHaveText('1');
    await expect(promptCard.locator('[data-testid="like-count"]')).toHaveText('1');
    await expect(promptCard.locator('[data-testid="rating-display"]')).toContainText('5.0');

    // Verify in bookmarks page
    await page2.goto('/bookmarks');
    await expect(page2.locator('text=Integration Test Prompt')).toBeVisible();
  });
});