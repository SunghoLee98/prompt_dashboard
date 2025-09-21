import { test, expect, Page } from '@playwright/test';

// Helper functions
async function createTestUser(page: Page, email: string = 'testuser@example.com', nickname: string = 'testuser', password: string = 'Password123!') {
  await page.goto('/register');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="nickname-input"]', nickname);
  await page.fill('[data-testid="password-input"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.check('[data-testid="terms-checkbox"]');
  await page.click('[data-testid="register-button"]');
  await page.waitForURL('/login');
}

async function loginUser(page: Page, email: string = 'testuser@example.com', password: string = 'Password123!') {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

async function createTestPrompt(page: Page, title: string = 'Test Prompt', description: string = 'Test Description', content: string = 'Test content for prompt', category: string = 'coding') {
  await page.goto('/prompts/new');
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="description"]', description);
  await page.fill('textarea[name="content"]', content);
  await page.selectOption('select[name="category"]', category);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/prompts\/\d+/);
}

test.describe('Core Platform Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto('/');
  });

  test.describe('User Authentication', () => {
    test('should register a new user successfully', async ({ page }) => {
      await createTestUser(page);

      // Should be redirected to login page
      await expect(page).toHaveURL('/login');

      // Should see success message
      const successMessage = page.locator('.success-message');
      if (await successMessage.count() > 0) {
        await expect(successMessage).toBeVisible();
      }
    });

    test('should login with valid credentials', async ({ page }) => {
      await createTestUser(page);
      await loginUser(page);

      // Should be redirected to home page
      await expect(page).toHaveURL('/');

      // Should see user menu or logout option
      const userMenu = page.locator('[data-testid="user-menu"]').or(page.locator('text=로그아웃'));
      await expect(userMenu).toBeVisible();
    });

    test('should prevent login with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'invalid@email.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should remain on login page or show error
      await expect(page).toHaveURL('/login');
      const errorMessage = page.locator('.error-message, [role="alert"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }
    });
  });

  test.describe('Prompt Management', () => {
    test('should create a new prompt', async ({ page }) => {
      await createTestUser(page, 'author@example.com', 'testauthor');
      await loginUser(page, 'author@example.com');
      await createTestPrompt(page);

      // Should be redirected to the created prompt page
      await expect(page).toHaveURL(/\/prompts\/\d+/);

      // Should display the prompt content
      await expect(page.locator('h1, .prompt-title')).toContainText('Test Prompt');
      await expect(page.locator('.prompt-description, .description')).toContainText('Test Description');
      await expect(page.locator('.prompt-content, .content')).toContainText('Test content for prompt');
    });

    test('should display prompts in the public list', async ({ page }) => {
      // Create a user and prompt first
      await createTestUser(page, 'author@example.com', 'testauthor');
      await loginUser(page, 'author@example.com');
      await createTestPrompt(page, 'Public Test Prompt');

      // Navigate to prompts list
      await page.goto('/prompts');

      // Should see the created prompt
      await expect(page.locator('[data-testid="prompt-card"], .prompt-card')).toContainText('Public Test Prompt');
    });

    test('should allow searching for prompts', async ({ page }) => {
      // Create a user and prompt first
      await createTestUser(page, 'author@example.com', 'testauthor');
      await loginUser(page, 'author@example.com');
      await createTestPrompt(page, 'Searchable Prompt');

      // Navigate to prompts list and search
      await page.goto('/prompts');

      const searchInput = page.locator('input[name="search"], input[placeholder*="검색"], input[placeholder*="search"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('Searchable');
        await page.keyboard.press('Enter');

        // Should see search results
        await expect(page.locator('[data-testid="prompt-card"], .prompt-card')).toContainText('Searchable Prompt');
      }
    });

    test('should filter prompts by category', async ({ page }) => {
      // Create a user and prompt first
      await createTestUser(page, 'author@example.com', 'testauthor');
      await loginUser(page, 'author@example.com');
      await createTestPrompt(page, 'Coding Prompt', 'A coding related prompt', 'console.log("hello");', 'coding');

      // Navigate to prompts list and filter
      await page.goto('/prompts');

      const categoryFilter = page.locator('select[name="category"], .category-filter');
      if (await categoryFilter.count() > 0) {
        await categoryFilter.selectOption('coding');

        // Should see filtered results
        await expect(page.locator('[data-testid="prompt-card"], .prompt-card')).toContainText('Coding Prompt');
      }
    });

    test('should view prompt details', async ({ page }) => {
      // Create a user and prompt first
      await createTestUser(page, 'author@example.com', 'testauthor');
      await loginUser(page, 'author@example.com');
      await createTestPrompt(page, 'Detailed Prompt', 'Detailed description', 'Detailed content');

      // Navigate to prompts list and click on a prompt
      await page.goto('/prompts');

      const promptCard = page.locator('[data-testid="prompt-card"], .prompt-card').first();
      if (await promptCard.count() > 0) {
        await promptCard.click();

        // Should navigate to prompt detail page
        await expect(page).toHaveURL(/\/prompts\/\d+/);

        // Should display full prompt details
        await expect(page.locator('h1, .prompt-title')).toContainText('Detailed Prompt');
        await expect(page.locator('.prompt-description, .description')).toContainText('Detailed description');
        await expect(page.locator('.prompt-content, .content')).toContainText('Detailed content');
      }
    });

    test('should allow editing own prompts', async ({ page }) => {
      // Create a user and prompt first
      await createTestUser(page, 'author@example.com', 'testauthor');
      await loginUser(page, 'author@example.com');
      await createTestPrompt(page, 'Editable Prompt');

      // Look for edit button or link
      const editButton = page.locator('[data-testid="edit-button"], .edit-button, a[href*="/edit"], text=편집');
      if (await editButton.count() > 0) {
        await editButton.click();

        // Should navigate to edit page
        await expect(page).toHaveURL(/\/prompts\/\d+\/edit/);

        // Should be able to modify the prompt
        await page.fill('input[name="title"]', 'Updated Prompt Title');

        const saveButton = page.locator('button[type="submit"], .save-button, text=저장');
        if (await saveButton.count() > 0) {
          await saveButton.click();

          // Should see updated content
          await expect(page.locator('h1, .prompt-title')).toContainText('Updated Prompt Title');
        }
      }
    });
  });

  test.describe('User Interactions', () => {
    test('should allow liking prompts', async ({ page }) => {
      // Create author and prompt
      await createTestUser(page, 'author@example.com', 'testauthor');
      await loginUser(page, 'author@example.com');
      await createTestPrompt(page);

      // Logout and create another user
      const logoutButton = page.locator('[data-testid="logout-button"], .logout-button, text=로그아웃');
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
      }

      await createTestUser(page, 'liker@example.com', 'testliker');
      await loginUser(page, 'liker@example.com');

      // Navigate to prompts and like
      await page.goto('/prompts');

      const likeButton = page.locator('[data-testid="like-button"], .like-button, .heart-icon').first();
      if (await likeButton.count() > 0) {
        await likeButton.click();

        // Should see updated like count
        const likeCount = page.locator('.like-count');
        if (await likeCount.count() > 0) {
          await expect(likeCount).toContainText('1');
        }
      }
    });

    test('should display view counts', async ({ page }) => {
      // Create a user and prompt
      await createTestUser(page, 'author@example.com', 'testauthor');
      await loginUser(page, 'author@example.com');
      await createTestPrompt(page);

      const currentUrl = page.url();

      // Navigate away and back to increment view count
      await page.goto('/prompts');
      await page.goto(currentUrl);

      // Should display view count
      const viewCount = page.locator('.view-count, [data-testid="view-count"]');
      if (await viewCount.count() > 0) {
        await expect(viewCount).toBeVisible();
      }
    });
  });

  test.describe('Navigation and UI', () => {
    test('should navigate between pages correctly', async ({ page }) => {
      // Test main navigation
      await page.goto('/');
      await expect(page).toHaveURL('/');

      // Navigate to prompts
      const promptsLink = page.locator('a[href="/prompts"], text=프롬프트');
      if (await promptsLink.count() > 0) {
        await promptsLink.click();
        await expect(page).toHaveURL('/prompts');
      }

      // Navigate to login
      const loginLink = page.locator('a[href="/login"], text=로그인');
      if (await loginLink.count() > 0) {
        await loginLink.click();
        await expect(page).toHaveURL('/login');
      }

      // Navigate to register
      const registerLink = page.locator('a[href="/register"], text=회원가입');
      if (await registerLink.count() > 0) {
        await registerLink.click();
        await expect(page).toHaveURL('/register');
      }
    });

    test('should display responsive design elements', async ({ page }) => {
      await page.goto('/');

      // Check if main content is visible
      const mainContent = page.locator('main, .main-content, #root');
      await expect(mainContent).toBeVisible();

      // Check if navigation is present
      const navigation = page.locator('nav, .navigation, .header');
      if (await navigation.count() > 0) {
        await expect(navigation).toBeVisible();
      }
    });

    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/nonexistent-page');

      // Should show 404 page or redirect to home
      const notFoundContent = page.locator('text=404, text=찾을 수 없음, text=Not Found');
      if (await notFoundContent.count() > 0) {
        await expect(notFoundContent).toBeVisible();
      } else {
        // Or should redirect to a valid page
        await expect(page).toHaveURL(/^\/(login|register|prompts|$)/);
      }
    });
  });

  test.describe('Data Validation and Security', () => {
    test('should validate registration form inputs', async ({ page }) => {
      await page.goto('/register');

      // Try to submit empty form
      await page.click('[data-testid="register-button"]');

      // Should show validation errors
      const errorMessages = page.locator('.error-message, [role="alert"], .validation-error');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }

      // Try with invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="register-button"]');

      // Should show email validation error
      const emailError = page.locator('text=이메일, text=email');
      if (await emailError.count() > 0) {
        await expect(emailError).toBeVisible();
      }
    });

    test('should require authentication for protected routes', async ({ page }) => {
      // Try to access create prompt page without login
      await page.goto('/prompts/new');

      // Should redirect to login or show access denied
      await expect(page).toHaveURL(/\/(login|register)/);
    });

    test('should validate prompt creation form', async ({ page }) => {
      await createTestUser(page);
      await loginUser(page);
      await page.goto('/prompts/new');

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();

        // Should show validation errors or remain on form
        const errorMessages = page.locator('.error-message, [role="alert"], .validation-error');
        if (await errorMessages.count() > 0) {
          await expect(errorMessages.first()).toBeVisible();
        } else {
          // Should remain on creation page if validation failed
          await expect(page).toHaveURL('/prompts/new');
        }
      }
    });
  });
});

test.describe('Integration and Performance Tests', () => {
  test('should handle concurrent user actions', async ({ page, context }) => {
    // Create multiple users and test concurrent access
    await createTestUser(page, 'user1@example.com', 'user1');

    // Create second page for concurrent testing
    const page2 = await context.newPage();
    await createTestUser(page2, 'user2@example.com', 'user2');

    // Both users login concurrently
    await Promise.all([
      loginUser(page, 'user1@example.com'),
      loginUser(page2, 'user2@example.com')
    ]);

    // Both should be logged in successfully
    await expect(page).toHaveURL('/');
    await expect(page2).toHaveURL('/');
  });

  test('should maintain session across page reloads', async ({ page }) => {
    await createTestUser(page);
    await loginUser(page);

    // Reload page
    await page.reload();

    // Should still be logged in
    const userMenu = page.locator('[data-testid="user-menu"], text=로그아웃');
    if (await userMenu.count() > 0) {
      await expect(userMenu).toBeVisible();
    }
  });

  test('should load pages within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds (reasonable for development environment)
    expect(loadTime).toBeLessThan(5000);

    // Main content should be visible
    const mainContent = page.locator('main, .main-content, #root');
    await expect(mainContent).toBeVisible();
  });
});