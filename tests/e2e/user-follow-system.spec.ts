import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:4000';
const API_URL = 'http://localhost:9090';

// Test user credentials
const testUsers = {
  user1: {
    email: 'follow_user1@test.com',
    password: 'Password123!',
    nickname: 'FollowUser1'
  },
  user2: {
    email: 'follow_user2@test.com',
    password: 'Password123!',
    nickname: 'FollowUser2'
  },
  user3: {
    email: 'follow_user3@test.com',
    password: 'Password123!',
    nickname: 'FollowUser3'
  },
  user4: {
    email: 'follow_user4@test.com',
    password: 'Password123!',
    nickname: 'FollowUser4'
  }
};

// Helper function to register a user
async function registerUser(page: Page, user: typeof testUsers.user1) {
  await page.goto(`${BASE_URL}/register`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="nickname"]', user.nickname);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for registration to complete
  await page.waitForURL(/\/(login|dashboard|prompts)/, { timeout: 10000 });
}

// Helper function to login a user
async function loginUser(page: Page, user: typeof testUsers.user1) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for login to complete
  await page.waitForURL(/\/(dashboard|prompts|home)/, { timeout: 10000 });
}

// Helper function to logout
async function logoutUser(page: Page) {
  // Try to find and click the user menu/avatar
  const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar, button:has-text("Logout")');
  if (await userMenu.isVisible()) {
    await userMenu.click();
  }

  // Click logout button
  await page.click('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout-button"]');
  await page.waitForURL(/\/(login|home|\/)/, { timeout: 10000 });
}

// Helper function to create a prompt
async function createPrompt(page: Page, title: string, content: string) {
  await page.goto(`${BASE_URL}/prompts/new`);
  await page.fill('input[name="title"]', title);
  await page.fill('textarea[name="description"]', `${title} description`);
  await page.fill('textarea[name="content"]', content);
  await page.selectOption('select[name="category"]', 'DEVELOPMENT');
  await page.fill('input[name="tags"]', 'test,follow');
  await page.click('button[type="submit"]');

  // Wait for prompt creation to complete
  await page.waitForURL(/\/prompts\/\d+/, { timeout: 10000 });
}

// Helper function to navigate to user profile
async function navigateToUserProfile(page: Page, nickname: string) {
  // Try multiple ways to navigate to profile
  const profileLink = page.locator(`a:has-text("${nickname}"), [data-testid="user-${nickname}"], .user-link:has-text("${nickname}")`);

  if (await profileLink.isVisible()) {
    await profileLink.click();
  } else {
    // Direct navigation as fallback
    await page.goto(`${BASE_URL}/users/${nickname}`);
  }

  // Wait for profile page to load
  await page.waitForSelector(`h1:has-text("${nickname}"), h2:has-text("${nickname}"), .profile-name:has-text("${nickname}")`);
}

// Helper function to check notification count
async function getNotificationCount(page: Page): Promise<number> {
  const badge = page.locator('.notification-badge, [data-testid="notification-count"], .badge-count');
  if (await badge.isVisible()) {
    const text = await badge.textContent();
    return parseInt(text || '0', 10);
  }
  return 0;
}

test.describe('User Follow System E2E Tests', () => {

  test.beforeAll(async ({ browser }) => {
    // Setup test users
    const context = await browser.newContext();
    const page = await context.newPage();

    // Register all test users
    for (const user of Object.values(testUsers)) {
      try {
        await registerUser(page, user);
        await logoutUser(page);
      } catch (error) {
        console.log(`User ${user.email} might already exist, continuing...`);
      }
    }

    await context.close();
  });

  test.describe('Follow/Unfollow Actions', () => {

    test('Should allow user to follow another user', async ({ page }) => {
      // Login as user1
      await loginUser(page, testUsers.user1);

      // Navigate to user2's profile
      await navigateToUserProfile(page, testUsers.user2.nickname);

      // Click follow button
      const followButton = page.locator('button:has-text("Follow"), [data-testid="follow-button"]');
      await expect(followButton).toBeVisible();
      await followButton.click();

      // Verify button changes to "Following" or "Unfollow"
      await expect(page.locator('button:has-text("Following"), button:has-text("Unfollow")')).toBeVisible({ timeout: 5000 });

      // Verify follower count increases
      const followerCount = page.locator('.followers-count, [data-testid="followers-count"]');
      await expect(followerCount).toContainText(/[1-9]/);
    });

    test('Should allow user to unfollow another user', async ({ page }) => {
      // Login as user1
      await loginUser(page, testUsers.user1);

      // Navigate to user2's profile
      await navigateToUserProfile(page, testUsers.user2.nickname);

      // Ensure we're following first
      const followButton = page.locator('button:has-text("Follow"), [data-testid="follow-button"]');
      if (await followButton.isVisible()) {
        await followButton.click();
        await page.waitForTimeout(1000);
      }

      // Click unfollow button
      const unfollowButton = page.locator('button:has-text("Following"), button:has-text("Unfollow"), [data-testid="unfollow-button"]');
      await expect(unfollowButton).toBeVisible();
      await unfollowButton.click();

      // Verify button changes back to "Follow"
      await expect(page.locator('button:has-text("Follow")')).toBeVisible({ timeout: 5000 });
    });

    test('Should not allow user to follow themselves', async ({ page }) => {
      // Login as user1
      await loginUser(page, testUsers.user1);

      // Navigate to own profile
      await navigateToUserProfile(page, testUsers.user1.nickname);

      // Verify no follow button is shown
      const followButton = page.locator('button:has-text("Follow"), [data-testid="follow-button"]');
      await expect(followButton).not.toBeVisible();
    });

    test('Should handle follow/unfollow errors gracefully', async ({ page }) => {
      // Login as user1
      await loginUser(page, testUsers.user1);

      // Intercept API calls to simulate error
      await page.route(`${API_URL}/api/follows/*`, route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });

      // Navigate to user3's profile
      await navigateToUserProfile(page, testUsers.user3.nickname);

      // Try to follow
      const followButton = page.locator('button:has-text("Follow"), [data-testid="follow-button"]');
      await followButton.click();

      // Verify error message is shown
      await expect(page.locator('.error-message, .toast-error, [role="alert"]')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Followers/Following Lists', () => {

    test('Should display followers list with pagination', async ({ page }) => {
      // Setup: Create multiple follow relationships
      await loginUser(page, testUsers.user2);
      await navigateToUserProfile(page, testUsers.user1.nickname);
      const followBtn = page.locator('button:has-text("Follow")').first();
      if (await followBtn.isVisible()) {
        await followBtn.click();
        await page.waitForTimeout(500);
      }

      await logoutUser(page);
      await loginUser(page, testUsers.user3);
      await navigateToUserProfile(page, testUsers.user1.nickname);
      const followBtn2 = page.locator('button:has-text("Follow")').first();
      if (await followBtn2.isVisible()) {
        await followBtn2.click();
        await page.waitForTimeout(500);
      }

      // Navigate to user1's followers
      await navigateToUserProfile(page, testUsers.user1.nickname);
      await page.click('a:has-text("Followers"), [data-testid="followers-link"]');

      // Verify followers are displayed
      await expect(page.locator('.follower-item, [data-testid="follower-item"]')).toHaveCount(2, { timeout: 10000 });

      // Check if pagination exists (if more than page size)
      const pagination = page.locator('.pagination, [data-testid="pagination"]');
      if (await pagination.isVisible()) {
        // Test pagination navigation
        await page.click('.pagination-next, button:has-text("Next")');
        await expect(page.locator('.follower-item')).toBeVisible();
      }
    });

    test('Should display following list with pagination', async ({ page }) => {
      // Login as user1
      await loginUser(page, testUsers.user1);

      // Follow multiple users
      for (const user of [testUsers.user2, testUsers.user3, testUsers.user4]) {
        await navigateToUserProfile(page, user.nickname);
        const followBtn = page.locator('button:has-text("Follow")').first();
        if (await followBtn.isVisible()) {
          await followBtn.click();
          await page.waitForTimeout(500);
        }
      }

      // Navigate to following list
      await navigateToUserProfile(page, testUsers.user1.nickname);
      await page.click('a:has-text("Following"), [data-testid="following-link"]');

      // Verify following users are displayed
      await expect(page.locator('.following-item, [data-testid="following-item"]').first()).toBeVisible({ timeout: 10000 });

      // Verify user information is shown
      await expect(page.locator('.user-nickname, [data-testid="user-nickname"]').first()).toBeVisible();
    });

    test('Should allow following/unfollowing from lists', async ({ page }) => {
      // Login as user1
      await loginUser(page, testUsers.user1);

      // Navigate to following list
      await navigateToUserProfile(page, testUsers.user1.nickname);
      await page.click('a:has-text("Following"), [data-testid="following-link"]');

      // Unfollow from the list
      const unfollowButton = page.locator('button:has-text("Unfollow"), button:has-text("Following")').first();
      if (await unfollowButton.isVisible()) {
        await unfollowButton.click();

        // Verify user is removed from list or button changes
        await expect(unfollowButton).toHaveText('Follow', { timeout: 5000 });
      }
    });
  });

  test.describe('Notification System', () => {

    test('Should create notification when user gets followed', async ({ page }) => {
      // Login as user4
      await loginUser(page, testUsers.user4);

      // Check initial notification count
      const initialCount = await getNotificationCount(page);

      // Logout and login as user1
      await logoutUser(page);
      await loginUser(page, testUsers.user1);

      // Follow user4
      await navigateToUserProfile(page, testUsers.user4.nickname);
      const followButton = page.locator('button:has-text("Follow")').first();
      if (await followButton.isVisible()) {
        await followButton.click();
        await page.waitForTimeout(1000);
      }

      // Logout and login back as user4
      await logoutUser(page);
      await loginUser(page, testUsers.user4);

      // Check notification count increased
      const newCount = await getNotificationCount(page);
      expect(newCount).toBeGreaterThan(initialCount);

      // Open notifications
      await page.click('.notification-icon, [data-testid="notification-icon"], button:has-text("Notifications")');

      // Verify follow notification exists
      await expect(page.locator(`.notification-item:has-text("${testUsers.user1.nickname}"):has-text("followed")`)).toBeVisible({ timeout: 5000 });
    });

    test('Should allow marking notifications as read', async ({ page }) => {
      // Login as user4 (who has notifications)
      await loginUser(page, testUsers.user4);

      // Open notifications
      await page.click('.notification-icon, [data-testid="notification-icon"], button:has-text("Notifications")');

      // Mark notification as read
      const markReadButton = page.locator('button:has-text("Mark as read"), [data-testid="mark-read"]').first();
      if (await markReadButton.isVisible()) {
        await markReadButton.click();

        // Verify notification is marked as read (style change or removal)
        await expect(markReadButton).not.toBeVisible({ timeout: 5000 });
      }

      // Verify notification count decreases
      const count = await getNotificationCount(page);
      expect(count).toBe(0);
    });

    test('Should allow deleting notifications', async ({ page }) => {
      // Setup: Create a new notification
      await loginUser(page, testUsers.user2);
      await navigateToUserProfile(page, testUsers.user3.nickname);
      const followBtn = page.locator('button:has-text("Follow")').first();
      if (await followBtn.isVisible()) {
        await followBtn.click();
        await page.waitForTimeout(500);
      }

      // Login as user3
      await logoutUser(page);
      await loginUser(page, testUsers.user3);

      // Open notifications
      await page.click('.notification-icon, [data-testid="notification-icon"], button:has-text("Notifications")');

      // Delete notification
      const deleteButton = page.locator('button:has-text("Delete"), [data-testid="delete-notification"]').first();
      if (await deleteButton.isVisible()) {
        const notificationCount = await page.locator('.notification-item').count();
        await deleteButton.click();

        // Confirm deletion if needed
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible({ timeout: 1000 })) {
          await confirmButton.click();
        }

        // Verify notification is removed
        await expect(page.locator('.notification-item')).toHaveCount(notificationCount - 1, { timeout: 5000 });
      }
    });
  });

  test.describe('Personalized Feed', () => {

    test('Should show prompts from followed users in feed', async ({ page }) => {
      // Setup: Create prompts by user2
      await loginUser(page, testUsers.user2);
      await createPrompt(page, 'Followed User Prompt 1', 'This is a test prompt from followed user');
      await createPrompt(page, 'Followed User Prompt 2', 'Another test prompt from followed user');

      // Login as user1 and follow user2
      await logoutUser(page);
      await loginUser(page, testUsers.user1);
      await navigateToUserProfile(page, testUsers.user2.nickname);
      const followButton = page.locator('button:has-text("Follow")').first();
      if (await followButton.isVisible()) {
        await followButton.click();
        await page.waitForTimeout(1000);
      }

      // Navigate to personalized feed
      await page.goto(`${BASE_URL}/feed`);

      // Verify prompts from followed users are shown
      await expect(page.locator('.prompt-card:has-text("Followed User Prompt 1"), [data-testid="prompt-card"]:has-text("Followed User Prompt 1")')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.prompt-card:has-text("Followed User Prompt 2"), [data-testid="prompt-card"]:has-text("Followed User Prompt 2")')).toBeVisible();

      // Verify author information is shown
      await expect(page.locator(`.author-name:has-text("${testUsers.user2.nickname}"), [data-testid="author-name"]:has-text("${testUsers.user2.nickname}")`)).toBeVisible();
    });

    test('Should not show prompts from unfollowed users', async ({ page }) => {
      // Setup: Create prompt by user3
      await loginUser(page, testUsers.user3);
      await createPrompt(page, 'Unfollowed User Prompt', 'This prompt should not appear in feed');

      // Login as user1 (not following user3)
      await logoutUser(page);
      await loginUser(page, testUsers.user1);

      // Navigate to personalized feed
      await page.goto(`${BASE_URL}/feed`);

      // Verify prompt from unfollowed user is not shown
      await expect(page.locator('.prompt-card:has-text("Unfollowed User Prompt")')).not.toBeVisible();
    });

    test('Should update feed when following/unfollowing users', async ({ page }) => {
      // Login as user1
      await loginUser(page, testUsers.user1);

      // Navigate to personalized feed
      await page.goto(`${BASE_URL}/feed`);

      // Remember initial prompt count
      const initialPromptCount = await page.locator('.prompt-card, [data-testid="prompt-card"]').count();

      // Follow user3
      await navigateToUserProfile(page, testUsers.user3.nickname);
      const followButton = page.locator('button:has-text("Follow")').first();
      if (await followButton.isVisible()) {
        await followButton.click();
        await page.waitForTimeout(1000);
      }

      // Go back to feed
      await page.goto(`${BASE_URL}/feed`);

      // Verify feed is updated (should include user3's prompts now)
      const newPromptCount = await page.locator('.prompt-card, [data-testid="prompt-card"]').count();
      expect(newPromptCount).toBeGreaterThanOrEqual(initialPromptCount);
    });
  });

  test.describe('UI Integration Tests', () => {

    test('Should show follow status indicators throughout UI', async ({ page }) => {
      // Login as user1
      await loginUser(page, testUsers.user1);

      // Check follow status on prompt cards
      await page.goto(`${BASE_URL}/prompts`);

      // Find a prompt card with author info
      const promptCard = page.locator('.prompt-card, [data-testid="prompt-card"]').first();
      if (await promptCard.isVisible()) {
        // Check if follow indicator exists on card
        const followIndicator = promptCard.locator('.follow-status, [data-testid="follow-status"]');
        if (await followIndicator.isVisible()) {
          // Verify it shows correct status
          const status = await followIndicator.textContent();
          expect(['Following', 'Follow', '']).toContain(status?.trim());
        }
      }

      // Check follow status on user profile
      await navigateToUserProfile(page, testUsers.user2.nickname);
      const profileFollowButton = page.locator('button:has-text("Follow"), button:has-text("Following"), button:has-text("Unfollow")');
      await expect(profileFollowButton).toBeVisible();
    });

    test('Should show follow counts on user profiles', async ({ page }) => {
      // Navigate to user profile
      await page.goto(`${BASE_URL}/users/${testUsers.user2.nickname}`);

      // Check followers count
      const followersCount = page.locator('.followers-count, [data-testid="followers-count"], a:has-text("Followers")');
      await expect(followersCount).toBeVisible();
      await expect(followersCount).toContainText(/\d+/);

      // Check following count
      const followingCount = page.locator('.following-count, [data-testid="following-count"], a:has-text("Following")');
      await expect(followingCount).toBeVisible();
      await expect(followingCount).toContainText(/\d+/);
    });

    test('Should handle quick follow/unfollow actions', async ({ page }) => {
      // Login as user1
      await loginUser(page, testUsers.user1);

      // Navigate to user list or search results
      await page.goto(`${BASE_URL}/users`);

      // Find follow buttons in user list
      const followButtons = page.locator('button:has-text("Follow")');
      const buttonCount = await followButtons.count();

      if (buttonCount > 0) {
        // Click multiple follow buttons quickly
        for (let i = 0; i < Math.min(3, buttonCount); i++) {
          await followButtons.nth(i).click();
          await page.waitForTimeout(200); // Small delay between clicks
        }

        // Verify all buttons changed state
        await expect(page.locator('button:has-text("Following"), button:has-text("Unfollow")')).toHaveCount(Math.min(3, buttonCount), { timeout: 5000 });
      }
    });
  });

  test.describe('Responsive Design Tests', () => {

    test('Should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Login
      await loginUser(page, testUsers.user1);

      // Navigate to user profile
      await navigateToUserProfile(page, testUsers.user2.nickname);

      // Check follow button is visible and clickable on mobile
      const followButton = page.locator('button:has-text("Follow"), button:has-text("Following"), button:has-text("Unfollow")');
      await expect(followButton).toBeVisible();
      await expect(followButton).toBeEnabled();

      // Check if mobile menu exists for navigation
      const mobileMenu = page.locator('.mobile-menu-toggle, [data-testid="mobile-menu"], .hamburger-menu');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();

        // Check notifications are accessible from mobile menu
        await expect(page.locator('a:has-text("Notifications"), button:has-text("Notifications")')).toBeVisible();
      }
    });

    test('Should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Login
      await loginUser(page, testUsers.user1);

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`);

      // Verify feed layout on tablet
      await expect(page.locator('.prompt-card, [data-testid="prompt-card"]').first()).toBeVisible();

      // Check follow buttons in feed
      const followButton = page.locator('button:has-text("Follow")').first();
      if (await followButton.isVisible()) {
        await expect(followButton).toBeEnabled();
      }
    });

    test('Should handle touch interactions on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Login
      await loginUser(page, testUsers.user1);

      // Navigate to followers list
      await navigateToUserProfile(page, testUsers.user1.nickname);
      await page.click('a:has-text("Followers"), [data-testid="followers-link"]');

      // Test swipe/scroll on mobile
      await page.locator('.followers-list, [data-testid="followers-list"]').scrollIntoViewIfNeeded();

      // Test tap on follow button
      const followButton = page.locator('button:has-text("Follow")').first();
      if (await followButton.isVisible()) {
        await followButton.tap();
        await expect(followButton).toHaveText(/Following|Unfollow/, { timeout: 5000 });
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {

    test('Should handle network errors gracefully', async ({ page }) => {
      // Login
      await loginUser(page, testUsers.user1);

      // Simulate network failure
      await page.route(`${API_URL}/api/follows/*`, route => route.abort());

      // Try to follow a user
      await navigateToUserProfile(page, testUsers.user4.nickname);
      const followButton = page.locator('button:has-text("Follow")').first();
      await followButton.click();

      // Verify error message is shown
      await expect(page.locator('.error-message, .toast-error, [role="alert"]')).toBeVisible({ timeout: 5000 });

      // Verify button remains in original state
      await expect(followButton).toHaveText('Follow');
    });

    test('Should handle unauthorized access to follow actions', async ({ page }) => {
      // Navigate to user profile without logging in
      await page.goto(`${BASE_URL}/users/${testUsers.user2.nickname}`);

      // Check if follow button requires login
      const followButton = page.locator('button:has-text("Follow")');
      if (await followButton.isVisible()) {
        await followButton.click();

        // Should redirect to login or show login modal
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
      }
    });

    test('Should handle following deleted or inactive users', async ({ page }) => {
      // Login
      await loginUser(page, testUsers.user1);

      // Try to navigate to non-existent user
      await page.goto(`${BASE_URL}/users/nonexistentuser123456`);

      // Should show error or redirect
      await expect(page.locator('.error-message, .not-found, h1:has-text("404")')).toBeVisible({ timeout: 5000 });
    });

    test('Should handle rate limiting on follow actions', async ({ page }) => {
      // Login
      await loginUser(page, testUsers.user1);

      // Navigate to users page
      await page.goto(`${BASE_URL}/users`);

      // Try to follow many users quickly
      const followButtons = page.locator('button:has-text("Follow")');
      const buttonCount = await followButtons.count();

      if (buttonCount > 10) {
        // Click many buttons rapidly
        for (let i = 0; i < 10; i++) {
          await followButtons.nth(i).click();
          // No delay to trigger rate limit
        }

        // Check if rate limit message appears
        const rateLimitMessage = page.locator('.error-message:has-text("rate limit"), .toast-error:has-text("too many")');
        if (await rateLimitMessage.isVisible({ timeout: 3000 })) {
          expect(await rateLimitMessage.textContent()).toMatch(/rate|limit|too many/i);
        }
      }
    });
  });

  test.describe('Accessibility Tests', () => {

    test('Should have proper ARIA labels for follow buttons', async ({ page }) => {
      // Login
      await loginUser(page, testUsers.user1);

      // Navigate to user profile
      await navigateToUserProfile(page, testUsers.user2.nickname);

      // Check follow button has proper ARIA label
      const followButton = page.locator('button:has-text("Follow"), button:has-text("Following")').first();
      const ariaLabel = await followButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/follow|unfollow/i);
    });

    test('Should be keyboard navigable', async ({ page }) => {
      // Login
      await loginUser(page, testUsers.user1);

      // Navigate to users page
      await page.goto(`${BASE_URL}/users`);

      // Tab to first follow button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Press Enter to follow
      await page.keyboard.press('Enter');

      // Check if action was performed
      const followedButton = page.locator('button:has-text("Following"), button:has-text("Unfollow")').first();
      if (await followedButton.isVisible({ timeout: 3000 })) {
        expect(await followedButton.textContent()).toMatch(/Following|Unfollow/);
      }
    });

    test('Should announce notification updates to screen readers', async ({ page }) => {
      // Login
      await loginUser(page, testUsers.user4);

      // Check for ARIA live region for notifications
      const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"]');
      await expect(liveRegion).toHaveCount(1, { timeout: 5000 });
    });
  });
});

// Performance tests
test.describe('Performance Tests', () => {

  test('Should load followers list within acceptable time', async ({ page }) => {
    // Start measuring
    const startTime = Date.now();

    // Navigate to followers list
    await page.goto(`${BASE_URL}/users/${testUsers.user1.nickname}/followers`);

    // Wait for content to load
    await page.waitForSelector('.follower-item, [data-testid="follower-item"], .empty-state', { timeout: 5000 });

    // Check load time
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
  });

  test('Should handle pagination efficiently', async ({ page }) => {
    // Navigate to a user with many followers
    await page.goto(`${BASE_URL}/users/${testUsers.user2.nickname}/followers`);

    // If pagination exists
    const nextButton = page.locator('.pagination-next, button:has-text("Next"), [aria-label="Next page"]');
    if (await nextButton.isVisible()) {
      const startTime = Date.now();
      await nextButton.click();

      // Wait for new content
      await page.waitForSelector('.follower-item', { timeout: 2000 });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Pagination should be fast
    }
  });
});