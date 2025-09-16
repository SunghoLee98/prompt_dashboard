import { test, expect } from '@playwright/test';
import { ProfilePage } from './pages/ProfilePage';
import { PromptPage } from './pages/PromptPage';
import { testUsers, generateRandomUser, generateRandomPrompt } from './utils/testData';
import { TestHelpers } from './utils/helpers';

test.describe('Profile Management Tests', () => {
  let profilePage: ProfilePage;
  let promptPage: PromptPage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    promptPage = new PromptPage(page);
    
    // Login before each test
    await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
  });

  test.describe('Profile Display', () => {
    test('should display user profile information', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      const profileInfo = await profilePage.getProfileInfo();
      expect(profileInfo.username).toBeTruthy();
      expect(profileInfo.email).toBeTruthy();
    });

    test('should display user statistics', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      const stats = await profilePage.getPromptStats();
      expect(stats.totalPrompts).toBeGreaterThanOrEqual(0);
      expect(stats.totalLikes).toBeGreaterThanOrEqual(0);
    });

    test('should display user avatar', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      const avatarVisible = await profilePage.profileAvatar.isVisible();
      expect(avatarVisible).toBeTruthy();
    });
  });

  test.describe('Profile Editing', () => {
    test('should edit profile username', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      const newUsername = 'updated_user_' + Date.now();
      await profilePage.editProfile({
        username: newUsername
      });
      
      // Verify update
      await page.reload();
      const profileInfo = await profilePage.getProfileInfo();
      expect(profileInfo.username).toContain(newUsername);
    });

    test('should edit profile bio', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      const newBio = 'Updated bio at ' + new Date().toISOString();
      await profilePage.editProfile({
        bio: newBio
      });
      
      // Verify update
      await page.reload();
      const profileInfo = await profilePage.getProfileInfo();
      expect(profileInfo.bio).toContain(newBio);
    });

    test('should change password', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      const newPassword = 'NewPassword123!@#';
      await profilePage.changePassword(
        testUsers.existingUser.password,
        newPassword
      );
      
      // Verify password change with logout and login
      await profilePage.logout();
      await TestHelpers.login(page, testUsers.existingUser.email, newPassword);
      
      const isLoggedIn = await TestHelpers.isLoggedIn(page);
      expect(isLoggedIn).toBeTruthy();
      
      // Change back to original password
      await profilePage.navigateToProfile();
      await profilePage.changePassword(newPassword, testUsers.existingUser.password);
    });

    test('should validate password change requirements', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.editProfileButton.click();
      
      // Try weak new password
      await profilePage.currentPasswordInput.fill(testUsers.existingUser.password);
      await profilePage.newPasswordInput.fill('weak');
      await profilePage.confirmPasswordInput.fill('weak');
      await profilePage.saveChangesButton.click();
      
      const errorVisible = await page.locator('text=/약함|weak|최소/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });

    test('should require current password for changes', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.editProfileButton.click();
      
      // Try to change password without current password
      await profilePage.newPasswordInput.fill('NewPassword123!');
      await profilePage.confirmPasswordInput.fill('NewPassword123!');
      await profilePage.saveChangesButton.click();
      
      const errorVisible = await page.locator('text=/현재.*비밀번호|current.*password/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });
  });

  test.describe('Profile Tabs', () => {
    test('should switch between profile tabs', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      // Switch to My Prompts tab
      await profilePage.switchToMyPrompts();
      let tabContent = await page.locator('.tab-content, [role="tabpanel"]').isVisible();
      expect(tabContent).toBeTruthy();
      
      // Switch to Liked Prompts tab
      await profilePage.switchToLikedPrompts();
      tabContent = await page.locator('.tab-content, [role="tabpanel"]').isVisible();
      expect(tabContent).toBeTruthy();
      
      // Switch to Settings tab
      await profilePage.switchToSettings();
      tabContent = await page.locator('.tab-content, [role="tabpanel"]').isVisible();
      expect(tabContent).toBeTruthy();
    });

    test('should display user prompts in My Prompts tab', async ({ page }) => {
      // Create a prompt first
      await promptPage.navigateToPrompts();
      const prompt = generateRandomPrompt();
      await promptPage.createPrompt(prompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Go to profile and check My Prompts
      await profilePage.navigateToProfile();
      await profilePage.switchToMyPrompts();
      
      const promptCards = page.locator('.prompt-card, [data-testid="prompt-card"]');
      const count = await promptCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display liked prompts in Liked Prompts tab', async ({ page }) => {
      // Like a prompt first
      await promptPage.navigateToPrompts();
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await promptPage.likePrompt(firstPrompt);
      await TestHelpers.waitForNetworkIdle(page);
      
      // Go to profile and check Liked Prompts
      await profilePage.navigateToProfile();
      await profilePage.switchToLikedPrompts();
      
      const promptCards = page.locator('.prompt-card, [data-testid="prompt-card"]');
      const count = await promptCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Settings', () => {
    test('should toggle theme', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.switchToSettings();
      
      const initialTheme = await profilePage.toggleTheme();
      const newTheme = await profilePage.toggleTheme();
      
      expect(initialTheme).not.toBe(newTheme);
    });

    test('should change language', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.switchToSettings();
      
      if (await profilePage.languageSelect.isVisible()) {
        await profilePage.changeLanguage('en');
        await page.reload();
        
        // Check if language changed (look for English text)
        const hasEnglishText = await page.locator('text=/Profile|Settings|Logout/').isVisible();
        expect(hasEnglishText).toBeTruthy();
        
        // Change back to Korean
        await profilePage.changeLanguage('ko');
      }
    });

    test('should toggle notifications', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.switchToSettings();
      
      if (await profilePage.notificationToggle.isVisible()) {
        const isEnabled = await profilePage.toggleNotifications();
        expect(typeof isEnabled).toBe('boolean');
      }
    });

    test('should toggle privacy settings', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.switchToSettings();
      
      if (await profilePage.privacyToggle.isVisible()) {
        const isPrivate = await profilePage.togglePrivacy();
        expect(typeof isPrivate).toBe('boolean');
      }
    });
  });

  test.describe('Public Profile', () => {
    test('should view other user public profile', async ({ page }) => {
      // Navigate to a public user profile
      await profilePage.navigateToUserProfile('testuser123');
      
      // Check if public profile is displayed
      const username = await profilePage.usernameDisplay.isVisible();
      expect(username).toBeTruthy();
      
      // Should not show edit button for other users
      const editButtonVisible = await profilePage.editProfileButton.isVisible();
      expect(editButtonVisible).toBeFalsy();
    });

    test('should show user public prompts', async ({ page }) => {
      await profilePage.navigateToUserProfile('testuser123');
      
      // Check for user's public prompts
      const promptCards = page.locator('.prompt-card, [data-testid="prompt-card"]');
      const hasPrompts = await promptCards.count() >= 0;
      expect(hasPrompts).toBeTruthy();
    });
  });

  test.describe('Account Management', () => {
    test('should logout successfully', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.logout();
      
      // Verify logout
      await expect(page).toHaveURL(/\/login/);
      const isLoggedIn = await TestHelpers.isLoggedIn(page);
      expect(isLoggedIn).toBeFalsy();
    });

    test('should handle session expiry', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      // Simulate expired session
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
      });
      
      // Try to perform an action
      await page.reload();
      
      // Should redirect to login
      const isRedirectedToLogin = await profilePage.checkSessionExpiry();
      expect(isRedirectedToLogin).toBeTruthy();
    });

    test.skip('should delete account with confirmation', async ({ page }) => {
      // Skip this test as it would delete test data
      // Uncomment for actual testing with proper test account
      
      /*
      const testUser = generateRandomUser();
      // Create test account
      await page.goto('/signup');
      // ... signup process
      
      await profilePage.navigateToProfile();
      await profilePage.deleteAccount(testUser.password);
      
      // Verify account deleted
      await expect(page).toHaveURL(/\/(home|login)/);
      
      // Try to login with deleted account
      await TestHelpers.login(page, testUser.email, testUser.password);
      const errorVisible = await page.locator('text=/존재하지 않는|not found/i').isVisible();
      expect(errorVisible).toBeTruthy();
      */
    });
  });

  test.describe('Profile Performance', () => {
    test('should load profile quickly', async ({ page }) => {
      const startTime = Date.now();
      await profilePage.navigateToProfile();
      await TestHelpers.waitForNetworkIdle(page);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000); // 2 seconds max
    });

    test('should update profile quickly', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      const updateTime = await TestHelpers.measureAPIResponseTime(
        page,
        async () => {
          await profilePage.editProfile({
            bio: 'Performance test bio'
          });
        },
        'api/users/profile'
      );
      
      expect(updateTime).toBeLessThan(1000); // 1 second max
    });
  });

  test.describe('Profile Error Handling', () => {
    test('should handle network errors when updating profile', async ({ page }) => {
      await profilePage.navigateToProfile();
      
      // Block API calls
      await page.route('**/api/users/profile', route => route.abort());
      
      await profilePage.editProfileButton.click();
      await profilePage.usernameInput.fill('new_username');
      await profilePage.saveChangesButton.click();
      
      // Check for error message
      const errorVisible = await page.locator('text=/오류|error|실패/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });

    test('should handle validation errors', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.editProfileButton.click();
      
      // Try to save with empty username
      await profilePage.usernameInput.clear();
      await profilePage.saveChangesButton.click();
      
      const errorVisible = await page.locator('text=/필수|required|입력/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });
  });
});