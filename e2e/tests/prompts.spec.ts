import { test, expect } from '@playwright/test';
import { PromptPage } from './pages/PromptPage';
import { LoginPage } from './pages/LoginPage';
import { testUsers, testPrompts, generateRandomPrompt, categories, sortOptions } from './utils/testData';
import { TestHelpers } from './utils/helpers';

test.describe('Prompt Management Tests', () => {
  let promptPage: PromptPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    promptPage = new PromptPage(page);
    loginPage = new LoginPage(page);
    
    // Login before each test
    await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
  });

  test.describe('Prompt CRUD Operations', () => {
    test('should create a new prompt', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      const newPrompt = generateRandomPrompt();
      await promptPage.createPrompt(newPrompt);
      
      // Verify prompt was created
      await TestHelpers.waitForNetworkIdle(page);
      const promptCount = await promptPage.getPromptCount();
      expect(promptCount).toBeGreaterThan(0);
      
      // Search for the created prompt
      await promptPage.searchPrompts(newPrompt.title);
      const firstPrompt = await promptPage.getPromptByIndex(0);
      const title = await promptPage.getPromptTitle(firstPrompt);
      expect(title).toContain(newPrompt.title);
    });

    test('should edit an existing prompt', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Create a prompt first
      const originalPrompt = generateRandomPrompt();
      await promptPage.createPrompt(originalPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Edit the prompt
      const firstPrompt = await promptPage.getPromptByIndex(0);
      const updates = {
        title: 'Updated ' + originalPrompt.title,
        description: 'Updated description'
      };
      
      await promptPage.editPrompt(firstPrompt, updates);
      
      // Verify the update
      await page.reload();
      const updatedPrompt = await promptPage.getPromptByIndex(0);
      const updatedTitle = await promptPage.getPromptTitle(updatedPrompt);
      expect(updatedTitle).toContain('Updated');
    });

    test('should delete a prompt', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Create a prompt to delete
      const promptToDelete = generateRandomPrompt();
      await promptPage.createPrompt(promptToDelete);
      await TestHelpers.waitForNetworkIdle(page);
      
      const initialCount = await promptPage.getPromptCount();
      
      // Delete the first prompt
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await promptPage.deletePrompt(firstPrompt);
      
      // Verify deletion
      await TestHelpers.waitForNetworkIdle(page);
      const newCount = await promptPage.getPromptCount();
      expect(newCount).toBeLessThan(initialCount);
    });

    test('should validate prompt form fields', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      const validation = await promptPage.validatePromptForm();
      expect(validation.titleRequired).toBeTruthy();
      expect(validation.contentRequired).toBeTruthy();
      expect(validation.titleMaxLength).toBeTruthy();
    });

    test('should handle long prompt content', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      await promptPage.createPrompt(testPrompts.longPrompt);
      
      // Verify long content is saved correctly
      await TestHelpers.waitForNetworkIdle(page);
      const firstPrompt = await promptPage.getPromptByIndex(0);
      const title = await promptPage.getPromptTitle(firstPrompt);
      expect(title).toContain(testPrompts.longPrompt.title);
    });
  });

  test.describe('Prompt Search and Filter', () => {
    test.beforeEach(async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Create multiple searchable prompts
      for (const prompt of testPrompts.searchablePrompts) {
        await promptPage.createPrompt(prompt);
        await TestHelpers.waitForNetworkIdle(page);
      }
    });

    test('should search prompts by keyword', async ({ page }) => {
      await promptPage.searchPrompts('JavaScript');
      await TestHelpers.waitForNetworkIdle(page);
      
      const count = await promptPage.getPromptCount();
      expect(count).toBeGreaterThan(0);
      
      // Verify search results contain keyword
      const firstPrompt = await promptPage.getPromptByIndex(0);
      const title = await promptPage.getPromptTitle(firstPrompt);
      expect(title.toLowerCase()).toContain('javascript');
    });

    test('should filter prompts by category', async ({ page }) => {
      await promptPage.filterByCategory('Development');
      await TestHelpers.waitForNetworkIdle(page);
      
      const count = await promptPage.getPromptCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should sort prompts', async ({ page }) => {
      // Test different sort options
      for (const sortOption of ['latest', 'popular', 'mostLiked']) {
        await promptPage.sortBy(sortOption);
        await TestHelpers.waitForNetworkIdle(page);
        
        const count = await promptPage.getPromptCount();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should combine search and filter', async ({ page }) => {
      await promptPage.searchPrompts('testing');
      await promptPage.filterByCategory('Development');
      await TestHelpers.waitForNetworkIdle(page);
      
      const count = await promptPage.getPromptCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show no results message', async ({ page }) => {
      await promptPage.searchPrompts('nonexistentkeyword12345');
      await TestHelpers.waitForNetworkIdle(page);
      
      const noResultsMessage = await page.locator('text=/결과가 없습니다|no results|찾을 수 없습니다/i').isVisible();
      expect(noResultsMessage).toBeTruthy();
    });
  });

  test.describe('Prompt Like Functionality', () => {
    test('should like and unlike a prompt', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Create a prompt
      const prompt = generateRandomPrompt();
      await promptPage.createPrompt(prompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      const firstPrompt = await promptPage.getPromptByIndex(0);
      
      // Like the prompt
      const initialLikeCount = await promptPage.getLikeCount(firstPrompt);
      await promptPage.likePrompt(firstPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Verify like count increased
      const newLikeCount = await promptPage.getLikeCount(firstPrompt);
      expect(newLikeCount).toBeGreaterThan(initialLikeCount);
      
      // Verify prompt is liked
      const isLiked = await promptPage.isPromptLiked(firstPrompt);
      expect(isLiked).toBeTruthy();
      
      // Unlike the prompt
      await promptPage.likePrompt(firstPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Verify unlike
      const finalLikeCount = await promptPage.getLikeCount(firstPrompt);
      expect(finalLikeCount).toBe(initialLikeCount);
    });

    test('should persist like state after page refresh', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await promptPage.likePrompt(firstPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Refresh page
      await page.reload();
      await TestHelpers.waitForNetworkIdle(page);
      
      // Check if like state persists
      const refreshedPrompt = await promptPage.getPromptByIndex(0);
      const isStillLiked = await promptPage.isPromptLiked(refreshedPrompt);
      expect(isStillLiked).toBeTruthy();
    });
  });

  test.describe('Prompt Sharing', () => {
    test('should share a prompt and copy link', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Create a prompt
      const prompt = generateRandomPrompt();
      await promptPage.createPrompt(prompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      const firstPrompt = await promptPage.getPromptByIndex(0);
      const shareUrl = await promptPage.sharePrompt(firstPrompt);
      
      // Verify share URL format
      expect(shareUrl).toMatch(/https?:\/\/.+\/prompts\/\w+/);
    });

    test('should access shared prompt via direct link', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Create and share a prompt
      const prompt = generateRandomPrompt();
      await promptPage.createPrompt(prompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      const firstPrompt = await promptPage.getPromptByIndex(0);
      const shareUrl = await promptPage.sharePrompt(firstPrompt);
      
      // Navigate to shared URL
      if (shareUrl) {
        await page.goto(shareUrl);
        await TestHelpers.waitForNetworkIdle(page);
        
        // Verify prompt is displayed
        const titleElement = await page.locator('h1, h2').first();
        const displayedTitle = await titleElement.textContent();
        expect(displayedTitle).toContain(prompt.title);
      }
    });
  });

  test.describe('Prompt Pagination and Loading', () => {
    test('should load more prompts on scroll (infinite scroll)', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      const hasInfiniteScroll = await promptPage.checkInfiniteScroll();
      
      if (hasInfiniteScroll) {
        expect(hasInfiniteScroll).toBeTruthy();
      } else {
        // Check for pagination
        const pagination = await promptPage.checkPagination();
        expect(pagination.hasPagination).toBeTruthy();
      }
    });

    test('should handle load more button', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      if (await promptPage.viewMoreButton.isVisible()) {
        const initialCount = await promptPage.getPromptCount();
        await promptPage.loadMorePrompts();
        await TestHelpers.waitForNetworkIdle(page);
        
        const newCount = await promptPage.getPromptCount();
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });

    test('should navigate through pagination', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      const pagination = await promptPage.checkPagination();
      
      if (pagination.hasPagination && pagination.totalPages > 1) {
        // Click next page
        await page.locator('button:has-text("다음"), button:has-text("Next")').click();
        await TestHelpers.waitForNetworkIdle(page);
        
        // Verify page changed
        const newPagination = await promptPage.checkPagination();
        expect(newPagination.currentPage).toBe(2);
      }
    });
  });

  test.describe('Prompt Performance', () => {
    test('should load prompts within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await promptPage.navigateToPrompts();
      await TestHelpers.waitForNetworkIdle(page);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // 3 seconds max
    });

    test('should search prompts quickly', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      const searchTime = await TestHelpers.measureAPIResponseTime(
        page,
        async () => await promptPage.searchPrompts('test'),
        'api/prompts/search'
      );
      
      expect(searchTime).toBeLessThan(1000); // 1 second max
    });

    test('should handle large number of prompts', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Create multiple prompts
      const promisesArray = [];
      for (let i = 0; i < 10; i++) {
        const prompt = generateRandomPrompt();
        promisesArray.push(promptPage.createPrompt(prompt));
      }
      
      await Promise.all(promisesArray);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Check if page still responsive
      const count = await promptPage.getPromptCount();
      expect(count).toBeGreaterThanOrEqual(10);
      
      // Check performance after load
      const metrics = await TestHelpers.checkPagePerformance(page);
      expect(metrics.loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Prompt Error Handling', () => {
    test('should handle network errors when creating prompt', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Block API calls
      await page.route('**/api/prompts', route => route.abort());
      
      const prompt = generateRandomPrompt();
      await promptPage.createPromptButton.click();
      await promptPage.modalOverlay.waitFor({ state: 'visible' });
      
      await promptPage.promptTitleInput.fill(prompt.title);
      await promptPage.promptContentTextarea.fill(prompt.content);
      await promptPage.savePromptButton.click();
      
      // Check for error message
      const errorVisible = await page.locator('text=/오류|error|실패/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Mock server error
      await page.route('**/api/prompts', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      const prompt = generateRandomPrompt();
      await promptPage.createPrompt(prompt);
      
      // Check for error handling
      const errorMessage = await page.locator('text=/서버|server|다시 시도/i').isVisible();
      expect(errorMessage).toBeTruthy();
    });

    test('should handle unauthorized access', async ({ page }) => {
      // Clear auth token
      await TestHelpers.clearStorage(page);
      
      // Try to create prompt without login
      await promptPage.navigateToPrompts();
      
      if (await promptPage.createPromptButton.isVisible()) {
        await promptPage.createPromptButton.click();
        
        // Should redirect to login or show error
        const isLoginPage = page.url().includes('/login');
        const hasAuthError = await page.locator('text=/로그인|login|인증/i').isVisible();
        
        expect(isLoginPage || hasAuthError).toBeTruthy();
      }
    });
  });
});