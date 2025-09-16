import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  generatePrompt,
  registerUser,
  loginUser,
  logoutUser,
  createPrompt,
  ratePrompt,
  waitForElement
} from './helpers/test-helpers';

test.describe('Rating Comment System - Core Functionality', () => {
  let user1: any;
  let user2: any;
  let promptId: string;

  test.beforeAll(async ({ browser }) => {
    // Setup test users and a prompt
    const page = await browser.newPage();

    // Register first user
    user1 = await registerUser(page, generateTestUser());

    // Create a prompt
    promptId = await createPrompt(page, generatePrompt()) || '';

    // Logout
    await logoutUser(page);

    // Register second user
    user2 = await registerUser(page, generateTestUser());

    await page.close();
  });

  test('User can rate a prompt with a comment', async ({ page }) => {
    // Login as user2
    await loginUser(page, user2);

    // Navigate to the prompt
    await page.goto(`/prompts/${promptId}`);

    // Wait for rating section to load
    await page.waitForSelector('.rating-section', { timeout: 10000 });

    // Click 5 stars
    await page.click('.star-rating button:nth-child(5)');

    // Add comment
    const comment = 'This is an excellent prompt! Very helpful and well-structured.';
    await page.fill('textarea[placeholder*="comment"]', comment);

    // Submit rating
    await page.click('button:has-text("Submit Rating")');

    // Verify success message
    await expect(page.locator('.success-message')).toContainText('Rating submitted successfully');

    // Verify comment appears in the list
    await expect(page.locator('.rating-comments')).toContainText(comment);
    await expect(page.locator('.rating-comments')).toContainText(user2.nickname);
    await expect(page.locator('.rating-comments .stars')).toContainText('★★★★★');
  });

  test('User cannot rate their own prompt', async ({ page }) => {
    // Login as user1 (prompt owner)
    await loginUser(page, user1);

    // Navigate to their own prompt
    await page.goto(`/prompts/${promptId}`);

    // Verify rating section is disabled or shows appropriate message
    const ratingSection = page.locator('.rating-section');
    await expect(ratingSection).toContainText(/You cannot rate your own prompt|Owner cannot rate/i);
  });

  test('User can edit their own comment', async ({ page }) => {
    // Login as user2
    await loginUser(page, user2);

    // Navigate to the prompt
    await page.goto(`/prompts/${promptId}`);

    // Find their comment and click edit
    await page.click('.rating-comment:has-text("' + user2.nickname + '") button:has-text("Edit")');

    // Update the comment
    const updatedComment = 'Updated: This prompt is absolutely fantastic! I learned a lot.';
    await page.fill('.edit-comment-form textarea', updatedComment);
    await page.click('.edit-comment-form button:has-text("Save")');

    // Verify the comment is updated
    await expect(page.locator('.rating-comments')).toContainText(updatedComment);
  });

  test('User can delete their own comment', async ({ page }) => {
    // Login as user2
    await loginUser(page, user2);

    // Navigate to the prompt
    await page.goto(`/prompts/${promptId}`);

    // Find their comment and click delete
    await page.click('.rating-comment:has-text("' + user2.nickname + '") button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify the comment is removed
    await expect(page.locator('.rating-comments')).not.toContainText(user2.nickname);
  });
});

test.describe('Rating Comment System - Validation & Edge Cases', () => {
  let user: any;
  let promptId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // Register user and create prompt
    user = await registerUser(page, generateTestUser());
    promptId = await createPrompt(page, generatePrompt()) || '';

    await page.close();
  });

  test('Comment length validation (max 1000 characters)', async ({ page }) => {
    await loginUser(page, user);

    // Create another user's prompt
    const promptData = generatePrompt();
    await page.goto('/prompts/new');
    await page.fill('input[name="title"]', promptData.title);
    await page.fill('textarea[name="description"]', promptData.description);
    await page.fill('textarea[name="content"]', promptData.content);
    await page.selectOption('select[name="category"]', promptData.category);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/prompts\/\d+/);

    // Logout and login as another user
    await page.click('button:has-text("Logout")');
    const anotherUser = await registerUser(page, generateTestUser());

    // Navigate to the prompt
    await page.goto(page.url());

    // Try to submit a comment that's too long
    const longComment = 'x'.repeat(1001);
    await page.click('.star-rating button:nth-child(4)');
    await page.fill('textarea[placeholder*="comment"]', longComment);

    // Check for validation error
    await expect(page.locator('.error-message')).toContainText(/Comment must be 1000 characters or less/i);
  });

  test('Rating without comment is allowed', async ({ page }) => {
    const newUser = generateTestUser();
    await registerUser(page, newUser);

    // Navigate to a prompt
    await page.goto(`/prompts/${promptId}`);

    // Submit rating without comment
    await page.click('.star-rating button:nth-child(3)');
    await page.click('button:has-text("Submit Rating")');

    // Verify success
    await expect(page.locator('.success-message')).toContainText('Rating submitted successfully');

    // Verify rating appears without comment
    await expect(page.locator('.rating-comments')).toContainText(newUser.nickname);
    await expect(page.locator('.rating-comment:has-text("' + newUser.nickname + '") .comment-text')).toBeEmpty();
  });

  test('XSS protection in comments', async ({ page }) => {
    const newUser = generateTestUser();
    await registerUser(page, newUser);

    // Navigate to a prompt
    await page.goto(`/prompts/${promptId}`);

    // Try to submit a comment with HTML/JavaScript
    const xssComment = '<script>alert("XSS")</script><b>Bold text</b>';
    await page.click('.star-rating button:nth-child(4)');
    await page.fill('textarea[placeholder*="comment"]', xssComment);
    await page.click('button:has-text("Submit Rating")');

    // Verify the comment is sanitized (no script execution)
    const commentText = await page.locator('.rating-comment:has-text("' + newUser.nickname + '") .comment-text').textContent();
    expect(commentText).not.toContain('<script>');
    expect(commentText).not.toContain('<b>');
  });
});

test.describe('Rating Comment System - Pagination', () => {
  let user: any;
  let promptId: string;
  const userComments: any[] = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // Register main user and create prompt
    user = await registerUser(page, generateTestUser());
    promptId = await createPrompt(page, generatePrompt()) || '';

    // Logout
    await logoutUser(page);

    // Create 15 users with ratings and comments to test pagination
    for (let i = 0; i < 15; i++) {
      const testUser = generateTestUser();
      await registerUser(page, testUser);

      // Navigate to prompt and add rating with comment
      await page.goto(`/prompts/${promptId}`);
      await page.click('.star-rating button:nth-child(' + (1 + (i % 5)) + ')');
      await page.fill('textarea[placeholder*="comment"]', `Test comment ${i + 1} from ${testUser.nickname}`);
      await page.click('button:has-text("Submit Rating")');

      userComments.push({
        nickname: testUser.nickname,
        comment: `Test comment ${i + 1} from ${testUser.nickname}`,
        rating: 1 + (i % 5)
      });

      // Logout for next user
      await page.click('button:has-text("Logout")');
    }

    await page.close();
  });

  test('Comments are paginated (10 per page)', async ({ page }) => {
    await loginUser(page, user);
    await page.goto(`/prompts/${promptId}`);

    // Verify first page shows 10 comments
    const visibleComments = await page.locator('.rating-comment').count();
    expect(visibleComments).toBeLessThanOrEqual(10);

    // Verify pagination controls exist
    await expect(page.locator('.pagination')).toBeVisible();

    // Navigate to second page
    await page.click('.pagination button:has-text("2")');

    // Verify second page shows remaining comments
    const secondPageComments = await page.locator('.rating-comment').count();
    expect(secondPageComments).toBeGreaterThan(0);
    expect(secondPageComments).toBeLessThanOrEqual(10);
  });

  test('Comments are sorted newest first', async ({ page }) => {
    await loginUser(page, user);
    await page.goto(`/prompts/${promptId}`);

    // Get the first comment's text
    const firstComment = await page.locator('.rating-comment:first-child .comment-text').textContent();

    // The last added comment should appear first
    expect(firstComment).toContain('Test comment 15');
  });
});

test.describe('Rating Comment System - Integration', () => {
  let user1: any;
  let user2: any;
  let promptId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // Setup users and prompt
    user1 = await registerUser(page, generateTestUser());
    promptId = await createPrompt(page, generatePrompt()) || '';

    await page.click('button:has-text("Logout")');
    user2 = await registerUser(page, generateTestUser());

    await page.close();
  });

  test('Average rating updates correctly with comments', async ({ page }) => {
    // User2 rates with comment
    await loginUser(page, user2);
    await page.goto(`/prompts/${promptId}`);

    // Submit 5-star rating with comment
    await page.click('.star-rating button:nth-child(5)');
    await page.fill('textarea[placeholder*="comment"]', 'Great prompt!');
    await page.click('button:has-text("Submit Rating")');

    // Check average rating
    await expect(page.locator('.average-rating')).toContainText('5.0');

    // Logout and create new user
    await page.click('button:has-text("Logout")');
    const user3 = await registerUser(page, generateTestUser());

    // User3 rates with comment
    await page.goto(`/prompts/${promptId}`);
    await page.click('.star-rating button:nth-child(3)');
    await page.fill('textarea[placeholder*="comment"]', 'Good but could be better');
    await page.click('button:has-text("Submit Rating")');

    // Check updated average rating
    await expect(page.locator('.average-rating')).toContainText('4.0');
  });

  test('Rating count displays correctly', async ({ page }) => {
    await loginUser(page, user1);
    await page.goto(`/prompts/${promptId}`);

    // Check rating count
    const ratingCount = await page.locator('.rating-count').textContent();
    expect(ratingCount).toMatch(/2 ratings/i);
  });

  test('User can update rating and comment together', async ({ page }) => {
    await loginUser(page, user2);
    await page.goto(`/prompts/${promptId}`);

    // Update existing rating
    await page.click('.rating-comment:has-text("' + user2.nickname + '") button:has-text("Edit")');

    // Change rating and comment
    await page.click('.edit-rating-form .star-rating button:nth-child(4)');
    await page.fill('.edit-comment-form textarea', 'Updated: Actually, this is pretty good!');
    await page.click('.edit-comment-form button:has-text("Save")');

    // Verify updates
    await expect(page.locator('.rating-comment:has-text("' + user2.nickname + '") .stars')).toContainText('★★★★');
    await expect(page.locator('.rating-comment:has-text("' + user2.nickname + '") .comment-text')).toContainText('Updated: Actually, this is pretty good!');
  });
});

test.describe('Rating Comment System - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  let user: any;
  let promptId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    user = await registerUser(page, generateTestUser());
    promptId = await createPrompt(page, generatePrompt()) || '';
    await page.close();
  });

  test('Rating and comments work on mobile', async ({ page }) => {
    await loginUser(page, user);

    // Create another prompt for testing
    const newPromptId = await createPrompt(page, generatePrompt());

    // Logout and register new user
    await page.click('button:has-text("Logout")');
    const mobileUser = await registerUser(page, generateTestUser());

    // Navigate to prompt
    await page.goto(`/prompts/${newPromptId}`);

    // Test rating on mobile
    await page.click('.star-rating button:nth-child(4)');
    await page.fill('textarea[placeholder*="comment"]', 'Works great on mobile!');
    await page.click('button:has-text("Submit Rating")');

    // Verify success
    await expect(page.locator('.success-message')).toContainText('Rating submitted successfully');

    // Verify comment appears correctly on mobile
    await expect(page.locator('.rating-comments')).toBeVisible();
    await expect(page.locator('.rating-comment')).toContainText('Works great on mobile!');
  });
});

test.describe('Rating Comment System - Performance', () => {
  test('Comments load within acceptable time', async ({ page }) => {
    const user = generateTestUser();
    await registerUser(page, user);

    // Create prompt with many comments
    const promptId = await createPrompt(page, generatePrompt());

    // Measure load time
    const startTime = Date.now();
    await page.goto(`/prompts/${promptId}`);
    await page.waitForSelector('.rating-comments', { timeout: 5000 });
    const loadTime = Date.now() - startTime;

    // Comments should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});