import { Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique test user data
 */
export const generateTestUser = () => ({
  email: `test-${uuidv4()}@example.com`,
  password: 'Test1234!',
  nickname: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
});

/**
 * Generate test prompt data
 */
export const generatePrompt = () => ({
  title: `Test Prompt ${Date.now()}`,
  description: 'Test prompt for E2E testing',
  content: 'This is a test prompt content for automated testing.',
  category: 'education',
  tags: ['test', 'e2e'],
  isPublic: true,
});

/**
 * Register a new user
 */
export async function registerUser(page: Page, userData: any) {
  await page.goto('/signup');

  // Fill registration form - try both username and nickname fields
  const nicknameInput = page.locator('input[name="nickname"], input[name="username"]').first();
  await nicknameInput.fill(userData.nickname);

  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.fill('input[name="confirmPassword"]', userData.password);

  // Check terms and privacy checkboxes if present
  const termsCheckbox = page.locator('input[type="checkbox"][data-testid="terms-checkbox"]');
  if (await termsCheckbox.isVisible()) {
    await termsCheckbox.check();
  }

  const privacyCheckbox = page.locator('input[type="checkbox"][data-testid="privacy-checkbox"]');
  if (await privacyCheckbox.isVisible()) {
    await privacyCheckbox.check();
  }

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect - registration usually redirects to login page
  try {
    await page.waitForURL(/\/(login|prompts)/, { timeout: 10000 });
  } catch (error) {
    // If no redirect, wait a bit for processing
    await page.waitForTimeout(2000);
  }

  // Check if we're on login page (typical after registration)
  if (page.url().includes('/login')) {
    // Now login with the new user credentials
    await loginUser(page, userData);
  }

  return userData;
}

/**
 * Login existing user
 */
export async function loginUser(page: Page, userData: any) {
  await page.goto('/login');

  // Fill login form
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to prompts or dashboard
  try {
    await page.waitForURL(/\/(prompts|dashboard|home)/, { timeout: 10000 });
  } catch (error) {
    // Check if we're already logged in
    const logoutButton = page.locator('button:has-text("Logout")').first();
    if (!(await logoutButton.isVisible())) {
      throw new Error('Login failed - no redirect and no logout button visible');
    }
  }
}

/**
 * Logout current user
 */
export async function logoutUser(page: Page) {
  // Click user menu or logout button
  const logoutButton = page.locator('button:has-text("Logout")').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Try clicking user menu first
    const userMenu = page.locator('[data-testid="user-menu"]').first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.click('button:has-text("Logout")');
    }
  }

  // Wait for redirect to home or login page
  await page.waitForURL(/\/(login|$)/, { timeout: 5000 });
}

/**
 * Create a new prompt
 */
export async function createPrompt(page: Page, promptData: any): Promise<string> {
  // Navigate to create prompt page
  await page.goto('/prompts/new');

  // Wait for the form to be loaded
  await page.waitForSelector('input[name="title"]', { timeout: 5000 });

  // Fill prompt form
  await page.fill('input[name="title"]', promptData.title);
  await page.fill('textarea[name="description"]', promptData.description);
  await page.fill('textarea[name="content"]', promptData.content);

  // Select category - handle both select and other UI components
  const categorySelect = page.locator('select[name="category"]');
  if (await categorySelect.isVisible()) {
    await categorySelect.selectOption(promptData.category);
  } else {
    // Try clicking on a category button or dropdown
    await page.click(`[data-testid="category-${promptData.category}"], button:has-text("${promptData.category}")`);
  }

  // Add tags if provided
  if (promptData.tags && promptData.tags.length > 0) {
    for (const tag of promptData.tags) {
      const tagInput = page.locator('input[placeholder*="tag" i], input[name="tags"]').first();
      if (await tagInput.isVisible()) {
        await tagInput.fill(tag);
        await tagInput.press('Enter');
        await page.waitForTimeout(500); // Small delay between tags
      }
    }
  }

  // Check public checkbox if specified
  if (promptData.isPublic !== undefined) {
    const publicCheckbox = page.locator('input[type="checkbox"][name="isPublic"], input[type="checkbox"][data-testid="public-checkbox"]').first();
    if (await publicCheckbox.isVisible()) {
      if (promptData.isPublic) {
        await publicCheckbox.check();
      } else {
        await publicCheckbox.uncheck();
      }
    }
  }

  // Submit form - try multiple submit button selectors
  const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Submit"), button:has-text("Save")').first();
  await submitButton.click();

  // Wait for redirect to prompt detail page
  await page.waitForURL(/\/prompts\/\d+/, { timeout: 15000 });

  // Extract prompt ID from URL
  const url = page.url();
  const promptId = url.match(/\/prompts\/(\d+)/)?.[1] || '';

  return promptId;
}

/**
 * Rate a prompt with optional comment
 */
export async function ratePrompt(page: Page, promptId: string, rating: number, comment?: string) {
  // Navigate to prompt
  await page.goto(`/prompts/${promptId}`);

  // Wait for rating section
  await page.waitForSelector('.rating-section, [data-testid="rating-section"]', { timeout: 10000 });

  // Click star rating
  const starSelector = `.star-rating button:nth-child(${rating}), [data-testid="star-${rating}"]`;
  await page.click(starSelector);

  // Add comment if provided
  if (comment) {
    const commentInput = page.locator('textarea[placeholder*="comment" i]').first();
    await commentInput.fill(comment);
  }

  // Submit rating
  const submitButton = page.locator('button:has-text("Submit Rating"), button:has-text("Rate")').first();
  await submitButton.click();

  // Wait for success message or rating to appear
  await page.waitForSelector('.success-message, [data-testid="rating-success"]', { timeout: 5000 });
}

/**
 * Wait for element with retry
 */
export async function waitForElement(page: Page, selector: string, options = { timeout: 10000 }) {
  let retries = 3;
  while (retries > 0) {
    try {
      await page.waitForSelector(selector, options);
      return;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for logout button or user menu
  const logoutButton = page.locator('button:has-text("Logout")').first();
  const userMenu = page.locator('[data-testid="user-menu"]').first();

  return (await logoutButton.isVisible()) || (await userMenu.isVisible());
}

/**
 * Clean up test data (if API endpoints are available)
 */
export async function cleanupTestData(page: Page, promptId?: string) {
  // This would ideally call cleanup API endpoints
  // For now, just navigate away
  await page.goto('/');
}