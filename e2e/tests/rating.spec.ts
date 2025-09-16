import { test, expect } from '@playwright/test';
import { PromptPage } from './pages/PromptPage';
import { RatingPage } from './pages/RatingPage';
import { LoginPage } from './pages/LoginPage';
import { testUsers, generateRandomPrompt, ratingTestData } from './utils/testData';
import { TestHelpers } from './utils/helpers';

test.describe('Prompt Rating Tests', () => {
  let promptPage: PromptPage;
  let ratingPage: RatingPage;
  let loginPage: LoginPage;
  let createdPromptId: string;

  test.beforeAll(async ({ browser }) => {
    // Create a prompt by another user for rating tests
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const tempPromptPage = new PromptPage(page);
    const tempLoginPage = new LoginPage(page);
    
    // Login as admin to create a prompt
    await TestHelpers.login(page, testUsers.adminUser.email, testUsers.adminUser.password);
    
    // Create a prompt that other users can rate
    await tempPromptPage.navigateToPrompts();
    const testPrompt = generateRandomPrompt();
    await tempPromptPage.createPrompt(testPrompt);
    
    // Store prompt ID for later use (extract from URL or response)
    await TestHelpers.waitForNetworkIdle(page);
    const firstPrompt = await tempPromptPage.getPromptByIndex(0);
    createdPromptId = await firstPrompt.getAttribute('data-prompt-id') || 'test-prompt';
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    promptPage = new PromptPage(page);
    ratingPage = new RatingPage(page);
    loginPage = new LoginPage(page);
  });

  test.describe('Rating Creation Tests', () => {
    test('should allow logged-in user to rate another user\'s prompt', async ({ page }) => {
      // Login as a regular user
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Navigate to prompts and open the first prompt
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Wait for prompt detail page to load
      await page.waitForLoadState('networkidle');
      
      // Rate the prompt with 5 stars
      await ratingPage.ratePrompt(5);
      
      // Verify rating was submitted
      await expect(ratingPage.ratingSuccessMessage).toBeVisible({ timeout: 5000 });
      
      // Verify the rating is displayed
      const displayedRating = await ratingPage.getUserRating();
      expect(displayedRating).toBe(5);
      
      // Verify average rating is updated
      const averageRating = await ratingPage.getAverageRating();
      expect(averageRating).toBeGreaterThanOrEqual(1);
      expect(averageRating).toBeLessThanOrEqual(5);
      
      // Verify rating count is updated
      const ratingCount = await ratingPage.getRatingCount();
      expect(ratingCount).toBeGreaterThan(0);
    });

    test('should update UI immediately after rating', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      await promptPage.navigateToPrompts();
      
      // Find a prompt without user's rating
      const unratedPrompt = await ratingPage.findUnratedPrompt();
      await unratedPrompt.click();
      
      await page.waitForLoadState('networkidle');
      
      // Get initial rating count
      const initialCount = await ratingPage.getRatingCount();
      
      // Rate the prompt
      await ratingPage.ratePrompt(4);
      
      // Verify UI updates immediately
      await expect(ratingPage.ratingStars.nth(3)).toHaveClass(/active|filled|selected/);
      
      // Verify rating count increased
      const newCount = await ratingPage.getRatingCount();
      expect(newCount).toBe(initialCount + 1);
    });

    test('should calculate correct average rating', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      await page.waitForLoadState('networkidle');
      
      // Get initial average
      const initialAverage = await ratingPage.getAverageRating();
      const initialCount = await ratingPage.getRatingCount();
      
      // Add a new rating
      const newRating = 3;
      await ratingPage.ratePrompt(newRating);
      
      // Wait for update
      await TestHelpers.waitForNetworkIdle(page);
      
      // Verify average is recalculated correctly
      const newAverage = await ratingPage.getAverageRating();
      const expectedAverage = ((initialAverage * initialCount) + newRating) / (initialCount + 1);
      
      // Allow for small floating point differences
      expect(Math.abs(newAverage - expectedAverage)).toBeLessThan(0.1);
    });
  });

  test.describe('Rating Modification Tests', () => {
    test('should allow user to update their existing rating', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      await promptPage.navigateToPrompts();
      
      // Create and rate a prompt first
      const newPrompt = generateRandomPrompt();
      await promptPage.createPrompt(newPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Initial rating
      await ratingPage.ratePrompt(3);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Update rating
      await ratingPage.ratePrompt(5);
      
      // Verify update message
      await expect(ratingPage.ratingUpdateMessage).toBeVisible({ timeout: 5000 });
      
      // Verify new rating is displayed
      const updatedRating = await ratingPage.getUserRating();
      expect(updatedRating).toBe(5);
    });

    test('should correctly update average when rating is modified', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Get initial state
      const initialAverage = await ratingPage.getAverageRating();
      const ratingCount = await ratingPage.getRatingCount();
      
      // First rating
      await ratingPage.ratePrompt(2);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Update rating
      await ratingPage.ratePrompt(5);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Verify average is updated correctly (count should remain same)
      const newAverage = await ratingPage.getAverageRating();
      const newCount = await ratingPage.getRatingCount();
      
      expect(newCount).toBe(ratingCount); // Count shouldn't change on update
      expect(newAverage).not.toBe(initialAverage); // Average should change
    });
  });

  test.describe('Rating Deletion Tests', () => {
    test('should allow user to delete their own rating', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      await promptPage.navigateToPrompts();
      
      // Create a new prompt to ensure clean state
      const newPrompt = generateRandomPrompt();
      await promptPage.createPrompt(newPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Add rating
      await ratingPage.ratePrompt(4);
      await TestHelpers.waitForNetworkIdle(page);
      
      const initialCount = await ratingPage.getRatingCount();
      
      // Delete rating
      await ratingPage.deleteRating();
      
      // Confirm deletion
      await page.click('button:has-text("확인"), button:has-text("Confirm")');
      
      // Verify deletion message
      await expect(ratingPage.ratingDeleteMessage).toBeVisible({ timeout: 5000 });
      
      // Verify rating is removed
      const userRating = await ratingPage.getUserRating();
      expect(userRating).toBe(0);
      
      // Verify count is decreased
      const newCount = await ratingPage.getRatingCount();
      expect(newCount).toBe(initialCount - 1);
    });

    test('should update average rating after deletion', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Add rating
      await ratingPage.ratePrompt(1); // Low rating to affect average
      await TestHelpers.waitForNetworkIdle(page);
      
      const averageWithRating = await ratingPage.getAverageRating();
      
      // Delete rating
      await ratingPage.deleteRating();
      await page.click('button:has-text("확인"), button:has-text("Confirm")');
      await TestHelpers.waitForNetworkIdle(page);
      
      // Verify average is recalculated
      const averageAfterDeletion = await ratingPage.getAverageRating();
      expect(averageAfterDeletion).toBeGreaterThan(averageWithRating);
    });
  });

  test.describe('Permission Tests', () => {
    test('should not allow non-logged-in users to rate', async ({ page }) => {
      // Navigate without login
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Try to rate
      const starButton = ratingPage.ratingStars.first();
      await starButton.click();
      
      // Should redirect to login or show error
      const loginRedirect = page.url().includes('/login');
      const errorMessage = await page.locator('text=/로그인.*필요|Login.*required/i').isVisible();
      
      expect(loginRedirect || errorMessage).toBeTruthy();
    });

    test('should not allow users to rate their own prompts', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Create own prompt
      await promptPage.navigateToPrompts();
      const ownPrompt = generateRandomPrompt();
      await promptPage.createPrompt(ownPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Open own prompt
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Rating should be disabled or hidden
      const ratingDisabled = await ratingPage.ratingStars.first().isDisabled();
      const ratingHidden = await ratingPage.ratingContainer.isHidden();
      const errorOnClick = async () => {
        await ratingPage.ratingStars.first().click();
        return await page.locator('text=/본인.*평가.*불가|Cannot.*rate.*own/i').isVisible();
      };
      
      expect(ratingDisabled || ratingHidden || await errorOnClick()).toBeTruthy();
    });

    test('should not allow users to modify or delete other users\' ratings', async ({ page }) => {
      // First user rates
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      await promptPage.navigateToPrompts();
      
      // Find admin's prompt
      const prompts = await promptPage.getAllPrompts();
      let adminPrompt = null;
      for (const prompt of prompts) {
        const author = await prompt.locator('.author, [data-testid="author"]').textContent();
        if (author?.includes('admin')) {
          adminPrompt = prompt;
          break;
        }
      }
      
      if (adminPrompt) {
        await adminPrompt.click();
        await ratingPage.ratePrompt(5);
        await TestHelpers.logout(page);
      }
      
      // Login as different user
      await TestHelpers.login(page, testUsers.validUser.email, testUsers.validUser.password);
      await promptPage.navigateToPrompts();
      
      if (adminPrompt) {
        await adminPrompt.click();
        
        // Should not see edit/delete buttons for other's rating
        const otherUserRatingActions = page.locator('.other-user-rating-actions');
        await expect(otherUserRatingActions).not.toBeVisible();
      }
    });
  });

  test.describe('UI/UX Tests', () => {
    test('should handle star rating click interaction', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Test clicking different stars
      for (let i = 0; i < 5; i++) {
        await ratingPage.ratingStars.nth(i).click();
        
        // Verify visual feedback
        for (let j = 0; j <= i; j++) {
          await expect(ratingPage.ratingStars.nth(j)).toHaveClass(/active|filled|selected/);
        }
        
        // Verify unfilled stars
        for (let k = i + 1; k < 5; k++) {
          await expect(ratingPage.ratingStars.nth(k)).not.toHaveClass(/active|filled|selected/);
        }
      }
    });

    test('should support keyboard navigation for rating', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Focus on rating component
      await ratingPage.ratingContainer.focus();
      
      // Test Tab navigation
      await page.keyboard.press('Tab');
      await expect(ratingPage.ratingStars.first()).toBeFocused();
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowRight');
      await expect(ratingPage.ratingStars.nth(1)).toBeFocused();
      
      await page.keyboard.press('ArrowLeft');
      await expect(ratingPage.ratingStars.first()).toBeFocused();
      
      // Test Enter key to select
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      
      // Verify rating was set to 3 stars
      const userRating = await ratingPage.getUserRating();
      expect(userRating).toBe(3);
    });

    test('should show loading state during rating submission', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Intercept rating API to delay response
      await page.route('**/api/prompts/*/ratings', async route => {
        await page.waitForTimeout(1000); // Simulate delay
        await route.continue();
      });
      
      // Click rating
      const ratingPromise = ratingPage.ratePrompt(4);
      
      // Check loading state appears
      await expect(ratingPage.loadingIndicator).toBeVisible({ timeout: 500 });
      
      await ratingPromise;
      
      // Loading should disappear
      await expect(ratingPage.loadingIndicator).not.toBeVisible();
    });

    test('should display error messages appropriately', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Simulate network error
      await page.route('**/api/prompts/*/ratings', route => {
        route.abort();
      });
      
      // Try to rate
      await ratingPage.ratePrompt(5);
      
      // Error message should appear
      await expect(ratingPage.errorMessage).toBeVisible({ timeout: 5000 });
      await expect(ratingPage.errorMessage).toContainText(/오류|실패|Error|Failed/i);
    });
  });

  test.describe('Data Integrity Tests', () => {
    test('should prevent duplicate ratings from same user', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      await promptPage.navigateToPrompts();
      
      // Create fresh prompt
      const newPrompt = generateRandomPrompt();
      await promptPage.createPrompt(newPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // First rating
      await ratingPage.ratePrompt(4);
      await TestHelpers.waitForNetworkIdle(page);
      
      const countAfterFirst = await ratingPage.getRatingCount();
      
      // Try to create another rating (should update, not duplicate)
      await ratingPage.ratePrompt(5);
      await TestHelpers.waitForNetworkIdle(page);
      
      const countAfterSecond = await ratingPage.getRatingCount();
      
      // Count should remain the same
      expect(countAfterSecond).toBe(countAfterFirst);
    });

    test('should reject invalid rating scores', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.click();
      
      // Try to submit invalid ratings via API manipulation
      const invalidRatings = [0, -1, 6, 10, 0.5, 'abc', null];
      
      for (const invalidRating of invalidRatings) {
        const response = await page.evaluate(async (rating) => {
          try {
            const res = await fetch('/api/prompts/1/ratings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ score: rating })
            });
            return { status: res.status, ok: res.ok };
          } catch (error) {
            return { error: true };
          }
        }, invalidRating);
        
        // Should reject invalid ratings
        expect(response.ok).toBeFalsy();
      }
    });

    test('should handle rating on non-existent prompt gracefully', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Try to access non-existent prompt
      await page.goto('/prompts/99999999');
      
      // Should show error or redirect
      const errorShown = await page.locator('text=/찾을.*없|Not.*found/i').isVisible({ timeout: 5000 });
      const redirected = !page.url().includes('/99999999');
      
      expect(errorShown || redirected).toBeTruthy();
    });
  });

  test.describe('Prompt List Rating Display', () => {
    test('should display average rating in prompt list', async ({ page }) => {
      await promptPage.navigateToPrompts();
      
      // Check that prompts in list show ratings
      const prompts = await promptPage.getAllPrompts();
      
      for (let i = 0; i < Math.min(3, prompts.length); i++) {
        const prompt = prompts[i];
        const ratingDisplay = prompt.locator('.rating-display, [data-testid="rating"]');
        
        if (await ratingDisplay.isVisible()) {
          // Check rating value is valid
          const ratingText = await ratingDisplay.textContent();
          const ratingMatch = ratingText?.match(/[\d.]+/);
          
          if (ratingMatch) {
            const rating = parseFloat(ratingMatch[0]);
            expect(rating).toBeGreaterThanOrEqual(0);
            expect(rating).toBeLessThanOrEqual(5);
          }
        }
      }
    });

    test('should handle prompts without ratings correctly', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Create new prompt (will have no ratings)
      await promptPage.navigateToPrompts();
      const newPrompt = generateRandomPrompt();
      await promptPage.createPrompt(newPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Check the new prompt's rating display
      const firstPrompt = await promptPage.getPromptByIndex(0);
      const ratingDisplay = firstPrompt.locator('.rating-display, [data-testid="rating"]');
      
      if (await ratingDisplay.isVisible()) {
        const ratingText = await ratingDisplay.textContent();
        
        // Should show "No ratings" or 0 or be empty
        const validNoRatingDisplay = 
          ratingText?.includes('평가 없음') ||
          ratingText?.includes('No ratings') ||
          ratingText?.includes('0') ||
          ratingText?.trim() === '';
        
        expect(validNoRatingDisplay).toBeTruthy();
      }
    });

    test('should update list rating display after new rating', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      await promptPage.navigateToPrompts();
      
      // Get initial rating from list
      const firstPromptInList = await promptPage.getPromptByIndex(0);
      const initialRatingElement = firstPromptInList.locator('.rating-display, [data-testid="rating"]');
      const initialRatingText = await initialRatingElement.textContent();
      
      // Open and rate the prompt
      await firstPromptInList.click();
      await ratingPage.ratePrompt(5);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Go back to list
      await page.goBack();
      await TestHelpers.waitForNetworkIdle(page);
      
      // Check updated rating
      const updatedPromptInList = await promptPage.getPromptByIndex(0);
      const updatedRatingElement = updatedPromptInList.locator('.rating-display, [data-testid="rating"]');
      const updatedRatingText = await updatedRatingElement.textContent();
      
      // Rating should have changed
      expect(updatedRatingText).not.toBe(initialRatingText);
    });
  });

  test.afterAll(async ({ browser }) => {
    // Clean up: Delete the test prompt created in beforeAll
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await TestHelpers.login(page, testUsers.adminUser.email, testUsers.adminUser.password);
    
    // Navigate and delete test prompts if needed
    // This is optional cleanup
    
    await context.close();
  });
});