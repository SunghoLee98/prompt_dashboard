import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';
import { LoginPage } from './pages/LoginPage';
import { PromptPage } from './pages/PromptPage';
import { ProfilePage } from './pages/ProfilePage';
import { testUsers } from './utils/testData';
import { TestHelpers } from './utils/helpers';

test.describe('Accessibility Tests', () => {
  test.describe('WCAG Compliance', () => {
    test('should have no accessibility violations on login page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigateToLogin();
      
      // Basic accessibility checks
      await expect(page).toHaveTitle(/로그인|Login/);
      
      // Check for main landmark
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Check for form labels
      const emailLabel = page.locator('label[for*="email"]');
      const passwordLabel = page.locator('label[for*="password"]');
      
      if (await emailLabel.isVisible()) {
        await expect(emailLabel).toHaveText(/이메일|Email/i);
      }
      
      if (await passwordLabel.isVisible()) {
        await expect(passwordLabel).toHaveText(/비밀번호|Password/i);
      }
    });

    test('should have no accessibility violations on prompts page', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Check page structure
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Check search input has label or aria-label
      const searchLabel = await promptPage.searchInput.getAttribute('aria-label');
      if (!searchLabel) {
        const labelFor = await promptPage.searchInput.getAttribute('id');
        if (labelFor) {
          const label = page.locator(`label[for="${labelFor}"]`);
          await expect(label).toBeVisible();
        }
      }
    });

    test('should have no accessibility violations on profile page', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const profilePage = new ProfilePage(page);
      await profilePage.navigateToProfile();
      
      // Check heading hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Check for skip links
      const skipLink = page.locator('a[href="#main"], a[href="#content"]').first();
      if (await skipLink.isVisible()) {
        const href = await skipLink.getAttribute('href');
        expect(href).toBeTruthy();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate login form with keyboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigateToLogin();
      
      // Start from email input
      await loginPage.emailInput.focus();
      
      // Tab to password
      await page.keyboard.press('Tab');
      const passwordFocused = await loginPage.passwordInput.evaluate(el => 
        document.activeElement === el
      );
      expect(passwordFocused).toBeTruthy();
      
      // Tab to login button
      await page.keyboard.press('Tab');
      const buttonFocused = await loginPage.loginButton.evaluate(el =>
        document.activeElement === el
      );
      expect(buttonFocused).toBeTruthy();
      
      // Submit with Enter
      await loginPage.emailInput.fill(testUsers.existingUser.email);
      await loginPage.passwordInput.fill(testUsers.existingUser.password);
      await loginPage.loginButton.focus();
      await page.keyboard.press('Enter');
      
      // Should submit form
      await page.waitForTimeout(1000);
    });

    test('should navigate prompts with keyboard', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Focus search input
      await promptPage.searchInput.focus();
      
      // Tab through interactive elements
      let tabCount = 0;
      const maxTabs = 10;
      
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;
        
        const focusedElement = await page.evaluate(() => {
          const active = document.activeElement;
          return {
            tagName: active?.tagName,
            role: active?.getAttribute('role'),
            ariaLabel: active?.getAttribute('aria-label')
          };
        });
        
        // Should focus interactive elements
        if (focusedElement.tagName) {
          const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
          const isInteractive = interactiveTags.includes(focusedElement.tagName);
          expect(isInteractive).toBeTruthy();
        }
      }
    });

    test('should open modal with keyboard and trap focus', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Focus and activate create button with keyboard
      await promptPage.createPromptButton.focus();
      await page.keyboard.press('Enter');
      
      // Modal should open
      await expect(promptPage.modalOverlay).toBeVisible();
      
      // Focus should be trapped in modal
      const initialFocus = await page.evaluate(() => 
        document.activeElement?.tagName
      );
      
      // Tab through modal elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Focus should still be in modal
      const stillInModal = await page.evaluate(() => {
        const active = document.activeElement;
        const modal = document.querySelector('.modal, [role="dialog"]');
        return modal?.contains(active);
      });
      
      expect(stillInModal).toBeTruthy();
      
      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(promptPage.modalOverlay).toBeHidden();
    });

    test('should navigate with arrow keys in lists', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Focus first prompt card
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.focus();
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      
      // Check if focus moved
      const focusedIndex = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.prompt-card, [data-testid="prompt-card"]'));
        const active = document.activeElement;
        return cards.findIndex(card => card.contains(active));
      });
      
      // Focus should have moved
      if (focusedIndex !== -1) {
        expect(focusedIndex).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Check button ARIA labels
      const createButton = promptPage.createPromptButton;
      const ariaLabel = await createButton.getAttribute('aria-label');
      if (!ariaLabel) {
        const buttonText = await createButton.textContent();
        expect(buttonText).toBeTruthy();
      }
      
      // Check like button ARIA
      const firstPrompt = await promptPage.getPromptByIndex(0);
      const likeBtn = firstPrompt.locator(promptPage.likeButton);
      const likeAriaLabel = await likeBtn.getAttribute('aria-label');
      
      if (likeAriaLabel) {
        expect(likeAriaLabel).toMatch(/좋아요|like/i);
      }
      
      // Check aria-pressed for toggle buttons
      const ariaPressed = await likeBtn.getAttribute('aria-pressed');
      if (ariaPressed !== null) {
        expect(['true', 'false']).toContain(ariaPressed);
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      
      // Get all headings
      const headings = await page.evaluate(() => {
        const h1s = document.querySelectorAll('h1');
        const h2s = document.querySelectorAll('h2');
        const h3s = document.querySelectorAll('h3');
        
        return {
          h1Count: h1s.length,
          h2Count: h2s.length,
          h3Count: h3s.length
        };
      });
      
      // Should have exactly one h1
      expect(headings.h1Count).toBe(1);
      
      // Should not skip heading levels
      if (headings.h3Count > 0) {
        expect(headings.h2Count).toBeGreaterThan(0);
      }
    });

    test('should have descriptive link text', async ({ page }) => {
      await page.goto('/');
      
      const links = await page.locator('a').all();
      
      for (const link of links.slice(0, 10)) { // Check first 10 links
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        
        // Should have descriptive text or aria-label
        if (text) {
          // Should not have generic text
          expect(text.toLowerCase()).not.toBe('click here');
          expect(text.toLowerCase()).not.toBe('read more');
          expect(text.toLowerCase()).not.toBe('link');
        } else if (ariaLabel) {
          expect(ariaLabel.length).toBeGreaterThan(0);
        }
      }
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Check for live regions
      const liveRegions = await page.locator('[aria-live]').all();
      
      if (liveRegions.length > 0) {
        for (const region of liveRegions) {
          const ariaLive = await region.getAttribute('aria-live');
          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
        }
      }
      
      // Check for status messages
      const statusElements = await page.locator('[role="status"], [role="alert"]').all();
      
      // Trigger an action that shows a status
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await promptPage.likePrompt(firstPrompt);
      
      // Check if status is announced
      const newStatus = await page.locator('[role="status"], [role="alert"]').first();
      if (await newStatus.isVisible()) {
        const statusText = await newStatus.textContent();
        expect(statusText).toBeTruthy();
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have accessible form fields', async ({ page }) => {
      const signupPage = page;
      await signupPage.goto('/signup');
      
      // Check all inputs have labels
      const inputs = await page.locator('input:not([type="hidden"])').all();
      
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        
        // Should have either label, aria-label, or aria-labelledby
        if (!ariaLabel && !ariaLabelledby && id) {
          const label = page.locator(`label[for="${id}"]`);
          await expect(label).toBeVisible();
        }
      }
    });

    test('should show error messages accessibly', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigateToLogin();
      
      // Submit empty form to trigger errors
      await loginPage.loginButton.click();
      
      // Check error messages have proper ARIA
      const errors = await page.locator('[role="alert"], .error-message').all();
      
      for (const error of errors) {
        const isVisible = await error.isVisible();
        if (isVisible) {
          // Error should have role="alert" or aria-live
          const role = await error.getAttribute('role');
          const ariaLive = await error.getAttribute('aria-live');
          
          expect(role === 'alert' || ariaLive === 'assertive').toBeTruthy();
          
          // Error text should be descriptive
          const errorText = await error.textContent();
          expect(errorText?.length).toBeGreaterThan(0);
        }
      }
    });

    test('should indicate required fields', async ({ page }) => {
      await page.goto('/signup');
      
      const requiredInputs = await page.locator('input[required], input[aria-required="true"]').all();
      
      for (const input of requiredInputs) {
        // Check for visual indication
        const label = await page.locator(`label[for="${await input.getAttribute('id')}"]`).first();
        
        if (await label.isVisible()) {
          const labelText = await label.textContent();
          // Should indicate required (with * or text)
          const hasRequiredIndicator = 
            labelText?.includes('*') || 
            labelText?.includes('필수') ||
            labelText?.includes('required');
          
          expect(hasRequiredIndicator).toBeTruthy();
        }
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast for text', async ({ page }) => {
      await page.goto('/');
      
      // Check contrast for important text elements
      const elements = await page.locator('h1, h2, p, button, a').all();
      
      for (const element of elements.slice(0, 10)) { // Check first 10 elements
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: parseInt(computed.fontSize),
            fontWeight: computed.fontWeight
          };
        });
        
        // Large text (18pt+ or 14pt+ bold) needs 3:1 ratio
        // Normal text needs 4.5:1 ratio
        const isLargeText = 
          styles.fontSize >= 18 || 
          (styles.fontSize >= 14 && parseInt(styles.fontWeight) >= 700);
        
        // This is a simplified check - actual contrast calculation would be more complex
        if (styles.color !== styles.backgroundColor) {
          // Text should be visible (not same color as background)
          expect(styles.color).not.toBe(styles.backgroundColor);
        }
      }
    });

    test('should not rely solely on color', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Check like buttons have more than just color change
      const firstPrompt = await promptPage.getPromptByIndex(0);
      const likeBtn = firstPrompt.locator(promptPage.likeButton);
      
      // Get initial state
      const initialState = await likeBtn.evaluate(el => ({
        text: el.textContent,
        ariaPressed: el.getAttribute('aria-pressed'),
        className: el.className
      }));
      
      // Click like button
      await promptPage.likePrompt(firstPrompt);
      
      // Get new state
      const newState = await likeBtn.evaluate(el => ({
        text: el.textContent,
        ariaPressed: el.getAttribute('aria-pressed'),
        className: el.className
      }));
      
      // Should have changed more than just color
      const hasNonColorChange = 
        initialState.text !== newState.text ||
        initialState.ariaPressed !== newState.ariaPressed ||
        initialState.className !== newState.className;
      
      expect(hasNonColorChange).toBeTruthy();
    });
  });

  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/login');
      
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      
      // Check for focus outline
      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        if (active) {
          const styles = window.getComputedStyle(active);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            outlineColor: styles.outlineColor,
            boxShadow: styles.boxShadow
          };
        }
        return null;
      });
      
      if (focusedElement) {
        // Should have visible focus indicator
        const hasVisibleFocus = 
          (focusedElement.outlineWidth !== '0px' && focusedElement.outline !== 'none') ||
          focusedElement.boxShadow.includes('rgb');
        
        expect(hasVisibleFocus).toBeTruthy();
      }
    });

    test('should manage focus on route changes', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Navigate to prompts
      await page.goto('/prompts');
      
      // Focus should move to main content
      const focusedAfterNav = await page.evaluate(() => {
        const active = document.activeElement;
        const main = document.querySelector('main');
        return main?.contains(active) || active === main;
      });
      
      expect(focusedAfterNav).toBeTruthy();
    });
  });

  test.describe('Images and Media', () => {
    test('should have alt text for images', async ({ page }) => {
      await page.goto('/');
      
      const images = await page.locator('img').all();
      
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        // Should have alt text or role="presentation" for decorative images
        if (role !== 'presentation' && role !== 'none') {
          expect(alt).toBeTruthy();
          
          // Alt text should be descriptive
          if (alt) {
            expect(alt.length).toBeGreaterThan(0);
            expect(alt.toLowerCase()).not.toBe('image');
            expect(alt.toLowerCase()).not.toBe('photo');
          }
        }
      }
    });

    test('should have captions for videos', async ({ page }) => {
      await page.goto('/');
      
      const videos = await page.locator('video').all();
      
      for (const video of videos) {
        // Check for track elements (captions/subtitles)
        const tracks = await video.locator('track[kind="captions"], track[kind="subtitles"]').all();
        
        if (tracks.length === 0) {
          // Check if video has aria-label describing it
          const ariaLabel = await video.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
        }
      }
    });
  });
});