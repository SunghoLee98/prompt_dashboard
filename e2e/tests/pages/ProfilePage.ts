import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly profileAvatar: Locator;
  readonly usernameDisplay: Locator;
  readonly emailDisplay: Locator;
  readonly editProfileButton: Locator;
  readonly logoutButton: Locator;
  readonly deleteAccountButton: Locator;
  readonly userPromptsTab: Locator;
  readonly likedPromptsTab: Locator;
  readonly settingsTab: Locator;
  
  // Edit profile form
  readonly usernameInput: Locator;
  readonly bioTextarea: Locator;
  readonly avatarUpload: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly saveChangesButton: Locator;
  readonly cancelChangesButton: Locator;
  
  // Settings
  readonly themeToggle: Locator;
  readonly languageSelect: Locator;
  readonly notificationToggle: Locator;
  readonly privacyToggle: Locator;

  constructor(page: Page) {
    super(page);
    
    // Profile display
    this.profileAvatar = page.locator('.avatar, img[alt*="avatar"], img[alt*="profile"]');
    this.usernameDisplay = page.locator('.username, [data-testid="username"]');
    this.emailDisplay = page.locator('.email, [data-testid="email"]');
    this.editProfileButton = page.locator('button:has-text("프로필 수정"), button:has-text("Edit Profile")');
    this.logoutButton = page.locator('button:has-text("로그아웃"), button:has-text("Logout")');
    this.deleteAccountButton = page.locator('button:has-text("계정 삭제"), button:has-text("Delete Account")');
    
    // Tabs
    this.userPromptsTab = page.locator('button:has-text("내 프롬프트"), button:has-text("My Prompts")');
    this.likedPromptsTab = page.locator('button:has-text("좋아요한 프롬프트"), button:has-text("Liked Prompts")');
    this.settingsTab = page.locator('button:has-text("설정"), button:has-text("Settings")');
    
    // Edit form
    this.usernameInput = page.locator('input[name="username"], input[name="name"]');
    this.bioTextarea = page.locator('textarea[name="bio"], textarea[name="description"]');
    this.avatarUpload = page.locator('input[type="file"][accept*="image"]');
    this.currentPasswordInput = page.locator('input[name="currentPassword"], input[name="oldPassword"]');
    this.newPasswordInput = page.locator('input[name="newPassword"]');
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    this.saveChangesButton = page.locator('button:has-text("저장"), button:has-text("Save Changes")');
    this.cancelChangesButton = page.locator('button:has-text("취소"), button:has-text("Cancel")');
    
    // Settings
    this.themeToggle = page.locator('button[aria-label*="theme"], input[type="checkbox"][name="theme"]');
    this.languageSelect = page.locator('select[name="language"]');
    this.notificationToggle = page.locator('input[type="checkbox"][name="notifications"]');
    this.privacyToggle = page.locator('input[type="checkbox"][name="privacy"]');
  }

  async navigateToProfile() {
    await this.goto('/profile');
  }

  async navigateToUserProfile(userId: string) {
    await this.goto(`/users/${userId}`);
  }

  async getProfileInfo(): Promise<{
    username: string;
    email: string;
    bio?: string;
  }> {
    const username = await this.usernameDisplay.textContent() || '';
    const email = await this.emailDisplay.textContent() || '';
    const bioElement = this.page.locator('.bio, [data-testid="bio"]');
    const bio = await bioElement.isVisible() ? await bioElement.textContent() || '' : '';
    
    return { username, email, bio };
  }

  async editProfile(updates: {
    username?: string;
    bio?: string;
    avatarPath?: string;
  }) {
    await this.editProfileButton.click();
    await this.page.waitForTimeout(500);
    
    if (updates.username) {
      await this.usernameInput.clear();
      await this.usernameInput.fill(updates.username);
    }
    
    if (updates.bio) {
      await this.bioTextarea.clear();
      await this.bioTextarea.fill(updates.bio);
    }
    
    if (updates.avatarPath) {
      await this.avatarUpload.setInputFiles(updates.avatarPath);
    }
    
    await this.saveChangesButton.click();
    await this.page.waitForTimeout(1000);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.editProfileButton.click();
    await this.page.waitForTimeout(500);
    
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    
    await this.saveChangesButton.click();
    await this.page.waitForTimeout(1000);
  }

  async logout() {
    await this.logoutButton.click();
    
    // Handle confirmation if exists
    const confirmButton = this.page.locator('button:has-text("확인"), button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }
    
    await this.page.waitForURL('**/login', { timeout: 5000 });
  }

  async deleteAccount(password: string) {
    await this.deleteAccountButton.click();
    
    // Handle confirmation dialog
    const passwordInput = this.page.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 1000 })) {
      await passwordInput.fill(password);
    }
    
    await this.page.locator('button:has-text("삭제"), button:has-text("Delete"), button:has-text("Confirm")').click();
    await this.page.waitForTimeout(2000);
  }

  async switchToMyPrompts() {
    await this.userPromptsTab.click();
    await this.page.waitForTimeout(500);
  }

  async switchToLikedPrompts() {
    await this.likedPromptsTab.click();
    await this.page.waitForTimeout(500);
  }

  async switchToSettings() {
    await this.settingsTab.click();
    await this.page.waitForTimeout(500);
  }

  async toggleTheme(): Promise<string> {
    await this.themeToggle.click();
    await this.page.waitForTimeout(500);
    
    // Check current theme
    const isDark = await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ||
             document.body.classList.contains('dark-theme') ||
             localStorage.getItem('theme') === 'dark';
    });
    
    return isDark ? 'dark' : 'light';
  }

  async changeLanguage(language: string) {
    await this.languageSelect.selectOption(language);
    await this.page.waitForTimeout(500);
  }

  async toggleNotifications(): Promise<boolean> {
    const isChecked = await this.notificationToggle.isChecked();
    await this.notificationToggle.click();
    await this.page.waitForTimeout(500);
    return !isChecked;
  }

  async togglePrivacy(): Promise<boolean> {
    const isChecked = await this.privacyToggle.isChecked();
    await this.privacyToggle.click();
    await this.page.waitForTimeout(500);
    return !isChecked;
  }

  async getPromptStats(): Promise<{
    totalPrompts: number;
    totalLikes: number;
    totalViews?: number;
  }> {
    const stats = this.page.locator('.stats, [data-testid="user-stats"]');
    
    const promptsText = await stats.locator('text=/프롬프트|prompts/i').textContent() || '0';
    const likesText = await stats.locator('text=/좋아요|likes/i').textContent() || '0';
    const viewsText = await stats.locator('text=/조회|views/i').textContent() || '0';
    
    return {
      totalPrompts: parseInt(promptsText.match(/\d+/)?.[0] || '0'),
      totalLikes: parseInt(likesText.match(/\d+/)?.[0] || '0'),
      totalViews: parseInt(viewsText.match(/\d+/)?.[0] || '0')
    };
  }

  async checkSessionExpiry(): Promise<boolean> {
    // Wait for potential session timeout (simulate with long wait)
    await this.page.waitForTimeout(2000);
    
    // Check if redirected to login
    const currentUrl = this.page.url();
    return currentUrl.includes('/login');
  }
}