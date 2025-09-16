import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SignupPage extends BasePage {
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signupButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly termsCheckbox: Locator;
  readonly privacyCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    // Try multiple selectors for username/nickname field
    this.usernameInput = page.locator('form input[name="username"], form input[name="nickname"]').first();
    this.emailInput = page.locator('form input[name="email"]').first();
    this.passwordInput = page.locator('form input[name="password"]').first();
    this.confirmPasswordInput = page.locator('form input[name="confirmPassword"]').first();
    this.signupButton = page.locator('form button[type="submit"]').first();
    this.loginLink = page.locator('a[href*="login"]').first();
    this.errorMessage = page.locator('[role="alert"], .error-message').first();
    this.successMessage = page.locator('[role="alert"][severity="success"], .success-message').first();
    this.termsCheckbox = page.locator('input[type="checkbox"][data-testid="terms-checkbox"]').first();
    this.privacyCheckbox = page.locator('input[type="checkbox"][data-testid="privacy-checkbox"]').first();
  }

  async navigateToSignup() {
    await this.goto('/signup');
  }

  async fillSignupForm(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms?: boolean;
    acceptPrivacy?: boolean;
  }) {
    await this.usernameInput.fill(data.username);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
    
    if (data.acceptTerms && await this.termsCheckbox.isVisible()) {
      await this.termsCheckbox.check();
    }
    
    if (data.acceptPrivacy && await this.privacyCheckbox.isVisible()) {
      await this.privacyCheckbox.check();
    }
  }

  async submitSignup() {
    await this.signupButton.click();
  }

  async signup(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms?: boolean;
    acceptPrivacy?: boolean;
  }) {
    await this.fillSignupForm(data);
    await this.submitSignup();
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  async getSuccessMessage(): Promise<string> {
    await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.successMessage.textContent() || '';
  }

  async validateSignupForm(): Promise<{
    usernameRequired: boolean;
    emailRequired: boolean;
    passwordRequired: boolean;
    passwordMatch: boolean;
    passwordStrength: boolean;
    termsRequired: boolean;
  }> {
    // Try to submit empty form
    await this.signupButton.click();
    
    const usernameRequired = await this.page.locator('text=/사용자.*필수|username.*required/i').isVisible();
    const emailRequired = await this.page.locator('text=/이메일.*필수|email.*required/i').isVisible();
    const passwordRequired = await this.page.locator('text=/비밀번호.*필수|password.*required/i').isVisible();
    
    // Check password mismatch
    await this.passwordInput.fill('Test123!@#');
    await this.confirmPasswordInput.fill('Different123!@#');
    await this.signupButton.click();
    const passwordMatch = await this.page.locator('text=/비밀번호.*일치|password.*match/i').isVisible();
    
    // Check password strength
    await this.passwordInput.fill('weak');
    const passwordStrength = await this.page.locator('text=/비밀번호.*약함|password.*weak|최소.*문자/i').isVisible();
    
    // Check terms requirement
    const termsRequired = await this.page.locator('text=/약관.*동의|terms.*agree/i').isVisible();
    
    return {
      usernameRequired,
      emailRequired,
      passwordRequired,
      passwordMatch,
      passwordStrength,
      termsRequired
    };
  }

  async checkDuplicateEmail(email: string): Promise<boolean> {
    await this.emailInput.fill(email);
    await this.emailInput.blur(); // Trigger validation
    await this.page.waitForTimeout(500);
    
    return await this.page.locator('text=/이미.*사용|already.*use|duplicate/i').isVisible();
  }

  async checkDuplicateUsername(username: string): Promise<boolean> {
    await this.usernameInput.fill(username);
    await this.usernameInput.blur(); // Trigger validation
    await this.page.waitForTimeout(500);
    
    return await this.page.locator('text=/이미.*사용|already.*use|duplicate/i').isVisible();
  }

  async checkPasswordStrengthIndicator(): Promise<string> {
    const passwords = [
      { value: 'weak', expected: 'weak' },
      { value: 'Medium123', expected: 'medium' },
      { value: 'Strong123!@#', expected: 'strong' }
    ];
    
    for (const { value } of passwords) {
      await this.passwordInput.fill(value);
      await this.page.waitForTimeout(300);
    }
    
    // Return the last strength indicator
    const strengthIndicator = await this.page.locator('.password-strength, [data-strength]').textContent();
    return strengthIndicator || '';
  }
}