import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signupLink: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('form input[name="email"]').first();
    this.passwordInput = page.locator('form input[name="password"]').first();
    this.loginButton = page.locator('form button[type="submit"]').first();
    this.signupLink = page.locator('a[href*="signup"], a[href*="register"]').first();
    this.errorMessage = page.locator('[role="alert"], .error-message').first();
    this.rememberMeCheckbox = page.locator('input[type="checkbox"][data-testid="remember-me"]').first();
    this.forgotPasswordLink = page.locator('a[href*="forgot"]').first();
  }

  async navigateToLogin() {
    await this.goto('/login');
    // E2E mode is now set in the goto method of BasePage
  }

  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async navigateToSignup() {
    await this.signupLink.click();
  }

  async navigateToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async validateLoginForm(): Promise<{
    emailRequired: boolean;
    passwordRequired: boolean;
    emailValid: boolean;
  }> {
    // Try to submit empty form
    await this.loginButton.click();
    
    const emailRequired = await this.page.locator('text=/이메일.*필수|email.*required/i').isVisible();
    const passwordRequired = await this.page.locator('text=/비밀번호.*필수|password.*required/i').isVisible();
    
    // Check email validation
    await this.emailInput.fill('invalid-email');
    await this.loginButton.click();
    const emailValid = await this.page.locator('text=/유효한.*이메일|valid.*email/i').isVisible();
    
    return {
      emailRequired,
      passwordRequired,
      emailValid
    };
  }

  async checkLoginPersistence(): Promise<boolean> {
    // Check if user is still logged in after page refresh
    await this.page.reload();
    await this.page.waitForTimeout(1000);
    
    // Check for auth token in localStorage or cookie
    const token = await this.page.evaluate(() => {
      return localStorage.getItem('authToken') || 
             sessionStorage.getItem('authToken') ||
             document.cookie.includes('auth');
    });
    
    return !!token;
  }

  async checkLoginSpeed(): Promise<number> {
    const startTime = Date.now();
    await this.loginButton.click();
    
    // Wait for either success (redirect) or error message
    await Promise.race([
      this.page.waitForURL('**/dashboard', { timeout: 10000 }),
      this.page.waitForURL('**/', { timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 })
    ]).catch(() => {});
    
    const endTime = Date.now();
    return endTime - startTime;
  }
}