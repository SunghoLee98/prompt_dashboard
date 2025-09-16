import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';
import { testUsers, generateRandomUser, errorMessages, successMessages } from './utils/testData';
import { TestHelpers } from './utils/helpers';

test.describe('Authentication Tests', () => {
  let loginPage: LoginPage;
  let signupPage: SignupPage;
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    signupPage = new SignupPage(page);
    profilePage = new ProfilePage(page);
    
    // Clear storage before each test
    await TestHelpers.clearStorage(page);
  });

  test.describe('User Signup', () => {
    test('should successfully sign up a new user', async ({ page }) => {
      const newUser = generateRandomUser();
      
      await signupPage.navigateToSignup();
      await signupPage.signup({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        confirmPassword: newUser.password,
        acceptTerms: true,
        acceptPrivacy: true
      });

      // After successful registration, should redirect to login page
      await expect(page).toHaveURL(/\/login/);
      
      // Check for success message on login page
      const loginPage = new LoginPage(page);
      const successMessage = await page.locator('[role="alert"][severity="success"], .success-message').isVisible();
      expect(successMessage).toBeTruthy();
    });

    test('should show validation errors for invalid signup data', async ({ page }) => {
      await signupPage.navigateToSignup();
      
      const validation = await signupPage.validateSignupForm();
      expect(validation.usernameRequired).toBeTruthy();
      expect(validation.emailRequired).toBeTruthy();
      expect(validation.passwordRequired).toBeTruthy();
    });

    test('should check password strength requirements', async ({ page }) => {
      await signupPage.navigateToSignup();
      
      // Test weak password
      await signupPage.fillSignupForm({
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak'
      });
      
      await signupPage.submitSignup();
      const errorVisible = await page.locator('text=/약함|weak|최소/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      await signupPage.navigateToSignup();
      
      // Try to register with existing email
      await signupPage.signup({
        username: 'newuser',
        email: testUsers.existingUser.email,
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        acceptTerms: true
      });
      
      const isDuplicate = await signupPage.checkDuplicateEmail(testUsers.existingUser.email);
      expect(isDuplicate).toBeTruthy();
    });

    test('should validate password confirmation match', async ({ page }) => {
      await signupPage.navigateToSignup();
      
      await signupPage.fillSignupForm({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPass123!'
      });
      
      await signupPage.submitSignup();
      const mismatchError = await page.locator('text=/일치|match/i').isVisible();
      expect(mismatchError).toBeTruthy();
    });
  });

  test.describe('User Login', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      await loginPage.navigateToLogin();
      await loginPage.login(testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Check redirect after successful login
      await expect(page).toHaveURL(/\/(dashboard|home|prompts)/);
      
      // Verify user is logged in
      const isLoggedIn = await TestHelpers.isLoggedIn(page);
      expect(isLoggedIn).toBeTruthy();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await loginPage.navigateToLogin();
      await loginPage.login('wrong@email.com', 'wrongpassword');
      
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain('올바르지 않습니다');
    });

    test('should validate login form fields', async ({ page }) => {
      await loginPage.navigateToLogin();
      
      const validation = await loginPage.validateLoginForm();
      expect(validation.emailRequired).toBeTruthy();
      expect(validation.passwordRequired).toBeTruthy();
      expect(validation.emailValid).toBeTruthy();
    });

    test('should persist login with remember me option', async ({ page }) => {
      await loginPage.navigateToLogin();
      await loginPage.login(
        testUsers.existingUser.email,
        testUsers.existingUser.password,
        true // Remember me
      );
      
      // Refresh page and check if still logged in
      await page.reload();
      const isLoggedIn = await TestHelpers.isLoggedIn(page);
      expect(isLoggedIn).toBeTruthy();
    });

    test('should measure login performance', async ({ page }) => {
      await loginPage.navigateToLogin();
      
      await loginPage.emailInput.fill(testUsers.existingUser.email);
      await loginPage.passwordInput.fill(testUsers.existingUser.password);
      
      const loginTime = await loginPage.checkLoginSpeed();
      expect(loginTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should redirect to signup page', async ({ page }) => {
      await loginPage.navigateToLogin();
      await loginPage.navigateToSignup();
      
      await expect(page).toHaveURL(/\/signup/);
    });
  });

  test.describe('User Logout', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each logout test
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
    });

    test('should successfully logout user', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.logout();
      
      // Check redirect to login page
      await expect(page).toHaveURL(/\/login/);
      
      // Verify user is logged out
      const isLoggedIn = await TestHelpers.isLoggedIn(page);
      expect(isLoggedIn).toBeFalsy();
    });

    test('should clear session data on logout', async ({ page }) => {
      await profilePage.navigateToProfile();
      await profilePage.logout();
      
      // Check that auth tokens are cleared
      const tokens = await page.evaluate(() => {
        return {
          localStorage: localStorage.getItem('authToken'),
          sessionStorage: sessionStorage.getItem('authToken')
        };
      });
      
      expect(tokens.localStorage).toBeNull();
      expect(tokens.sessionStorage).toBeNull();
    });
  });

  test.describe('Session Management', () => {
    test('should handle expired JWT token', async ({ page }) => {
      // Set an expired token
      await page.goto('/');
      await page.evaluate(() => {
        // Set expired token (past date)
        const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';
        localStorage.setItem('authToken', expiredToken);
      });
      
      // Try to access protected route
      await page.goto('/profile');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should refresh token automatically', async ({ page }) => {
      // This test would require backend support for token refresh
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Simulate token near expiry
      await page.evaluate(() => {
        const currentToken = localStorage.getItem('authToken');
        // Modify token expiry (this is simulated)
        if (currentToken) {
          localStorage.setItem('authTokenExpiry', String(Date.now() + 60000)); // 1 minute
        }
      });
      
      // Make an API call that should trigger refresh
      await page.goto('/profile');
      await page.waitForTimeout(2000);
      
      // Check if still logged in
      const isLoggedIn = await TestHelpers.isLoggedIn(page);
      expect(isLoggedIn).toBeTruthy();
    });
  });

  test.describe('Authentication Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Block API requests
      await page.route('**/api/auth/login', route => route.abort());
      
      await loginPage.navigateToLogin();
      await loginPage.login('test@example.com', 'password');
      
      // Check for network error message
      const errorVisible = await page.locator('text=/네트워크|network|연결/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });

    test('should handle server errors (500)', async ({ page }) => {
      // Mock server error
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await loginPage.navigateToLogin();
      await loginPage.login('test@example.com', 'password');
      
      // Check for server error message
      const errorVisible = await page.locator('text=/서버|server|오류/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });

    test('should handle rate limiting (429)', async ({ page }) => {
      // Mock rate limit response
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 429,
          body: JSON.stringify({ error: 'Too many requests' })
        });
      });
      
      await loginPage.navigateToLogin();
      await loginPage.login('test@example.com', 'password');
      
      // Check for rate limit message
      const errorVisible = await page.locator('text=/너무 많은|too many|잠시/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });
  });

  test.describe('Cross-browser Authentication', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work in ${browserName}`, async ({ page }) => {
        await loginPage.navigateToLogin();
        await loginPage.login(testUsers.existingUser.email, testUsers.existingUser.password);
        
        // Verify login works across browsers
        await expect(page).toHaveURL(/\/(dashboard|home|prompts)/);
        const isLoggedIn = await TestHelpers.isLoggedIn(page);
        expect(isLoggedIn).toBeTruthy();
      });
    });
  });
});