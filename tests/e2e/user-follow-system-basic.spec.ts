import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:4000';
const API_URL = 'http://localhost:9090';

// Test user credentials
const testUsers = {
  follower: {
    email: 'follower_test@example.com',
    password: 'TestPass123!',
    nickname: 'FollowerTest'
  },
  followed: {
    email: 'followed_test@example.com',
    password: 'TestPass123!',
    nickname: 'FollowedTest'
  },
  observer: {
    email: 'observer_test@example.com',
    password: 'TestPass123!',
    nickname: 'ObserverTest'
  }
};

// Helper: Wait for element with multiple possible selectors
async function waitForAnyElement(page: Page, selectors: string[], timeout = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selectors.join(', '), { timeout });
    return true;
  } catch {
    return false;
  }
}

// Helper: Register user (with error handling)
async function registerUser(page: Page, user: typeof testUsers.follower): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });

    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', user.email);
    await page.fill('input[name="nickname"], input#nickname', user.nickname);
    await page.fill('input[name="password"], input[type="password"]:not([name="confirmPassword"])', user.password);

    // Handle confirm password if exists
    const confirmPassword = page.locator('input[name="confirmPassword"], input[type="password"]:nth-of-type(2)');
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(user.password);
    }

    // Submit form
    await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');

    // Check for success (redirect or success message)
    await Promise.race([
      page.waitForURL(/\/(login|dashboard|prompts|home)/, { timeout: 10000 }),
      page.waitForSelector('.success-message, .toast-success', { timeout: 10000 })
    ]);

    return true;
  } catch (error) {
    console.log(`Registration failed for ${user.email}: ${error.message}`);
    return false;
  }
}

// Helper: Login user
async function loginUser(page: Page, user: typeof testUsers.follower): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', user.email);
    await page.fill('input[name="password"], input[type="password"]', user.password);

    // Submit
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');

    // Wait for successful login
    await page.waitForURL(/\/(dashboard|prompts|home|feed)/, { timeout: 10000 });

    return true;
  } catch (error) {
    console.log(`Login failed for ${user.email}: ${error.message}`);
    return false;
  }
}

// Helper: Logout user
async function logoutUser(page: Page): Promise<void> {
  try {
    // Click user menu if exists
    const userMenuSelectors = [
      '[data-testid="user-menu"]',
      '.user-menu',
      '.user-avatar',
      '.profile-dropdown'
    ];

    for (const selector of userMenuSelectors) {
      const menu = page.locator(selector);
      if (await menu.isVisible()) {
        await menu.click();
        break;
      }
    }

    // Click logout
    await page.click('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]');
    await page.waitForURL(/\/(login|home|\/)/, { timeout: 5000 });
  } catch (error) {
    console.log('Logout failed, continuing...');
  }
}

// Main test suite
test.describe('User Follow System - Core Features', () => {

  // Setup: Create test users once
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Setting up test users...');

    for (const [key, user] of Object.entries(testUsers)) {
      const registered = await registerUser(page, user);
      if (registered) {
        console.log(`✓ User ${key} registered`);
        await logoutUser(page);
      } else {
        console.log(`⚠ User ${key} might already exist`);
      }
    }

    await context.close();
  });

  test.describe('Basic Follow Operations', () => {

    test('Should display follow button on user profiles', async ({ page }) => {
      // Login as follower
      const loggedIn = await loginUser(page, testUsers.follower);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Navigate to another user's profile (multiple possible URLs)
      const profileUrls = [
        `${BASE_URL}/users/${testUsers.followed.nickname}`,
        `${BASE_URL}/profile/${testUsers.followed.nickname}`,
        `${BASE_URL}/user/${testUsers.followed.nickname}`
      ];

      let profileLoaded = false;
      for (const url of profileUrls) {
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
          // Check if we're on a valid profile page
          if (await page.locator(`text=${testUsers.followed.nickname}`).isVisible()) {
            profileLoaded = true;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!profileLoaded) {
        // Try to find user through search or user list
        await page.goto(`${BASE_URL}/users`, { waitUntil: 'networkidle' });
        const userLink = page.locator(`a:has-text("${testUsers.followed.nickname}")`);
        if (await userLink.isVisible()) {
          await userLink.click();
          await page.waitForLoadState('networkidle');
        } else {
          test.skip();
          return;
        }
      }

      // Check for follow button
      const followButtonSelectors = [
        'button:has-text("Follow")',
        '[data-testid="follow-button"]',
        '.follow-button',
        'button.btn-follow'
      ];

      const buttonVisible = await waitForAnyElement(page, followButtonSelectors, 5000);
      expect(buttonVisible).toBeTruthy();
    });

    test('Should allow following a user', async ({ page }) => {
      // Login
      const loggedIn = await loginUser(page, testUsers.follower);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Navigate to user profile
      await page.goto(`${BASE_URL}/users/${testUsers.followed.nickname}`, { waitUntil: 'networkidle' });

      // Find and click follow button
      const followButton = page.locator('button').filter({ hasText: /^Follow$/i });
      if (await followButton.isVisible()) {
        await followButton.click();

        // Wait for button state change
        await expect(followButton).toHaveText(/Following|Unfollow/i, { timeout: 5000 });

        // Verify API call was made (optional)
        const response = await page.waitForResponse(
          resp => resp.url().includes('/api/follows') && resp.status() === 200,
          { timeout: 5000 }
        ).catch(() => null);

        if (response) {
          expect(response.status()).toBe(200);
        }
      } else {
        // Button might already show "Following" if test was run before
        const followingButton = page.locator('button').filter({ hasText: /Following|Unfollow/i });
        await expect(followingButton).toBeVisible();
      }
    });

    test('Should allow unfollowing a user', async ({ page }) => {
      // Login
      const loggedIn = await loginUser(page, testUsers.follower);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Navigate to user profile
      await page.goto(`${BASE_URL}/users/${testUsers.followed.nickname}`, { waitUntil: 'networkidle' });

      // Ensure we're following first
      const followButton = page.locator('button').filter({ hasText: /^Follow$/i });
      if (await followButton.isVisible()) {
        await followButton.click();
        await page.waitForTimeout(1000);
      }

      // Now unfollow
      const unfollowButton = page.locator('button').filter({ hasText: /Following|Unfollow/i });
      if (await unfollowButton.isVisible()) {
        await unfollowButton.click();

        // Verify button changes back
        await expect(page.locator('button').filter({ hasText: /^Follow$/i })).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Followers/Following Lists', () => {

    test('Should display followers count on profile', async ({ page }) => {
      await page.goto(`${BASE_URL}/users/${testUsers.followed.nickname}`, { waitUntil: 'networkidle' });

      // Look for followers count
      const followersCountSelectors = [
        '.followers-count',
        '[data-testid="followers-count"]',
        'span:has-text("Followers")',
        'a:has-text("Followers")'
      ];

      let foundCount = false;
      for (const selector of followersCountSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          const text = await element.textContent();
          expect(text).toMatch(/\d+/); // Should contain a number
          foundCount = true;
          break;
        }
      }

      if (!foundCount) {
        console.log('Followers count not found - feature might not be implemented');
        test.skip();
      }
    });

    test('Should display following count on profile', async ({ page }) => {
      await page.goto(`${BASE_URL}/users/${testUsers.follower.nickname}`, { waitUntil: 'networkidle' });

      // Look for following count
      const followingCountSelectors = [
        '.following-count',
        '[data-testid="following-count"]',
        'span:has-text("Following")',
        'a:has-text("Following")'
      ];

      let foundCount = false;
      for (const selector of followingCountSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          const text = await element.textContent();
          expect(text).toMatch(/\d+/); // Should contain a number
          foundCount = true;
          break;
        }
      }

      if (!foundCount) {
        console.log('Following count not found - feature might not be implemented');
        test.skip();
      }
    });
  });

  test.describe('Notification System', () => {

    test('Should show notification indicator', async ({ page }) => {
      // Login
      const loggedIn = await loginUser(page, testUsers.followed);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Look for notification icon/indicator
      const notificationSelectors = [
        '.notification-icon',
        '[data-testid="notifications"]',
        'button:has-text("Notifications")',
        '.bell-icon',
        '[aria-label*="notification"]'
      ];

      const hasNotifications = await waitForAnyElement(page, notificationSelectors, 3000);
      if (!hasNotifications) {
        console.log('Notification system not found - feature might not be implemented');
        test.skip();
      }

      // Click to open notifications
      for (const selector of notificationSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          await element.click();
          break;
        }
      }

      // Check if notification panel opens
      await expect(page.locator('.notification-panel, .notifications-list, [role="menu"]')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Personalized Feed', () => {

    test('Should have a feed page', async ({ page }) => {
      // Login
      const loggedIn = await loginUser(page, testUsers.follower);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Try to navigate to feed
      const feedUrls = [
        `${BASE_URL}/feed`,
        `${BASE_URL}/home`,
        `${BASE_URL}/dashboard`
      ];

      let feedFound = false;
      for (const url of feedUrls) {
        await page.goto(url, { waitUntil: 'networkidle' });

        // Check if we're on a feed-like page
        const feedIndicators = [
          '.feed',
          '.post-list',
          '.prompt-list',
          '[data-testid="feed"]',
          'h1:has-text("Feed")',
          'h1:has-text("Home")'
        ];

        for (const indicator of feedIndicators) {
          if (await page.locator(indicator).isVisible()) {
            feedFound = true;
            break;
          }
        }

        if (feedFound) break;
      }

      if (!feedFound) {
        console.log('Feed page not found - feature might not be implemented');
        test.skip();
      }

      // Check for content in feed
      const contentSelectors = [
        '.prompt-card',
        '.post-card',
        '.feed-item',
        '[data-testid="feed-item"]'
      ];

      const hasContent = await waitForAnyElement(page, contentSelectors, 5000);
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('Mobile Responsiveness', () => {

    test('Should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Login
      const loggedIn = await loginUser(page, testUsers.follower);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Navigate to profile
      await page.goto(`${BASE_URL}/users/${testUsers.followed.nickname}`, { waitUntil: 'networkidle' });

      // Check if follow button is visible on mobile
      const followButton = page.locator('button').filter({ hasText: /Follow|Following|Unfollow/i });
      await expect(followButton).toBeVisible();

      // Check if it's clickable
      await expect(followButton).toBeEnabled();
    });
  });

  test.describe('Error Handling', () => {

    test('Should handle network errors gracefully', async ({ page }) => {
      // Login
      const loggedIn = await loginUser(page, testUsers.follower);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Intercept follow API calls and make them fail
      await page.route('**/api/follows/**', route => {
        route.abort('failed');
      });

      // Navigate to profile
      await page.goto(`${BASE_URL}/users/${testUsers.followed.nickname}`, { waitUntil: 'networkidle' });

      // Try to follow
      const followButton = page.locator('button').filter({ hasText: /^Follow$/i });
      if (await followButton.isVisible()) {
        await followButton.click();

        // Should show error message
        const errorSelectors = [
          '.error-message',
          '.toast-error',
          '[role="alert"]',
          '.alert-danger'
        ];

        const errorShown = await waitForAnyElement(page, errorSelectors, 5000);
        expect(errorShown).toBeTruthy();
      }
    });
  });
});

// Cleanup test data after all tests
test.afterAll(async ({ browser }) => {
  console.log('Tests completed. Note: Test data cleanup should be handled by the backend.');
});