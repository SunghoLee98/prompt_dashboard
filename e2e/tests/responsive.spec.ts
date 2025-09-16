import { test, expect, devices } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { PromptPage } from './pages/PromptPage';
import { ProfilePage } from './pages/ProfilePage';
import { testUsers } from './utils/testData';
import { TestHelpers } from './utils/helpers';

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile - iPhone 12', viewport: devices['iPhone 12'].viewport },
    { name: 'Mobile - Pixel 5', viewport: devices['Pixel 5'].viewport },
    { name: 'Tablet - iPad', viewport: devices['iPad (gen 7)'].viewport },
    { name: 'Tablet - iPad Pro', viewport: devices['iPad Pro 11'].viewport },
    { name: 'Desktop - 1080p', viewport: { width: 1920, height: 1080 } },
    { name: 'Desktop - 1440p', viewport: { width: 2560, height: 1440 } },
    { name: 'Desktop - 4K', viewport: { width: 3840, height: 2160 } }
  ];

  viewports.forEach(device => {
    test.describe(`${device.name} viewport`, () => {
      test.use({ viewport: device.viewport });

      test('should display login page responsively', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigateToLogin();
        
        // Check if all elements are visible
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();
        
        // Check if layout is not broken
        const loginForm = page.locator('form');
        const formBox = await loginForm.boundingBox();
        
        if (formBox) {
          // Form should be within viewport
          expect(formBox.width).toBeLessThanOrEqual(device.viewport.width);
          expect(formBox.x).toBeGreaterThanOrEqual(0);
        }
      });

      test('should display prompt list responsively', async ({ page }) => {
        await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
        
        const promptPage = new PromptPage(page);
        await promptPage.navigateToPrompts();
        
        // Check search bar visibility
        await expect(promptPage.searchInput).toBeVisible();
        
        // Check prompt cards layout
        const promptCards = await promptPage.promptCard.all();
        
        if (promptCards.length > 0) {
          const firstCard = promptCards[0];
          const cardBox = await firstCard.boundingBox();
          
          if (cardBox) {
            // Cards should fit within viewport
            expect(cardBox.width).toBeLessThanOrEqual(device.viewport.width);
            
            // On mobile, cards should be stacked (full width)
            if (device.viewport.width < 768) {
              expect(cardBox.width).toBeGreaterThan(device.viewport.width * 0.8);
            }
          }
        }
      });

      test('should have responsive navigation menu', async ({ page }) => {
        await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
        await page.goto('/');
        
        const header = page.locator('header');
        await expect(header).toBeVisible();
        
        if (device.viewport.width < 768) {
          // Mobile should have hamburger menu
          const hamburger = page.locator('[aria-label*="menu"], .hamburger, .menu-toggle');
          
          if (await hamburger.isVisible()) {
            await hamburger.click();
            
            // Menu should open
            const mobileMenu = page.locator('.mobile-menu, .nav-menu, nav');
            await expect(mobileMenu).toBeVisible();
            
            // Close menu
            await hamburger.click();
            await expect(mobileMenu).toBeHidden();
          }
        } else {
          // Desktop should show full navigation
          const nav = page.locator('nav');
          await expect(nav).toBeVisible();
        }
      });

      test('should handle text overflow properly', async ({ page }) => {
        await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
        
        const promptPage = new PromptPage(page);
        await promptPage.navigateToPrompts();
        
        // Check text truncation
        const titles = await page.locator('.prompt-title, h2, h3').all();
        
        for (const title of titles.slice(0, 3)) { // Check first 3 titles
          const styles = await title.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              overflow: computed.overflow,
              textOverflow: computed.textOverflow,
              whiteSpace: computed.whiteSpace
            };
          });
          
          // Should have proper text overflow handling
          const hasOverflowHandling = 
            styles.overflow === 'hidden' || 
            styles.textOverflow === 'ellipsis' ||
            styles.whiteSpace === 'nowrap';
          
          expect(hasOverflowHandling).toBeTruthy();
        }
      });

      test('should have responsive forms', async ({ page }) => {
        await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
        
        const promptPage = new PromptPage(page);
        await promptPage.navigateToPrompts();
        await promptPage.createPromptButton.click();
        
        // Check modal responsiveness
        const modal = promptPage.modalOverlay;
        await expect(modal).toBeVisible();
        
        const modalBox = await modal.boundingBox();
        
        if (modalBox) {
          // Modal should fit within viewport
          expect(modalBox.width).toBeLessThanOrEqual(device.viewport.width);
          expect(modalBox.height).toBeLessThanOrEqual(device.viewport.height);
          
          // On mobile, modal should be full width
          if (device.viewport.width < 768) {
            expect(modalBox.width).toBeGreaterThan(device.viewport.width * 0.9);
          }
        }
        
        // Check form inputs
        await expect(promptPage.promptTitleInput).toBeVisible();
        await expect(promptPage.promptContentTextarea).toBeVisible();
        
        // Close modal
        await promptPage.cancelButton.click();
      });

      test('should have readable font sizes', async ({ page }) => {
        await page.goto('/');
        
        // Check body text font size
        const bodyFontSize = await page.evaluate(() => {
          const body = document.body;
          return parseInt(window.getComputedStyle(body).fontSize);
        });
        
        // Minimum readable font size
        expect(bodyFontSize).toBeGreaterThanOrEqual(14);
        
        // Check heading sizes
        const h1 = page.locator('h1').first();
        if (await h1.isVisible()) {
          const h1FontSize = await h1.evaluate(el => 
            parseInt(window.getComputedStyle(el).fontSize)
          );
          
          // Headings should be larger than body text
          expect(h1FontSize).toBeGreaterThan(bodyFontSize);
          
          // On mobile, headings shouldn't be too large
          if (device.viewport.width < 768) {
            expect(h1FontSize).toBeLessThanOrEqual(32);
          }
        }
      });
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape transition', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      
      const initialLayout = await page.screenshot();
      
      // Switch to landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await page.waitForTimeout(500);
      
      // Check if layout adjusted
      const landscapeLayout = await page.screenshot();
      
      // Layout should be different
      expect(initialLayout).not.toEqual(landscapeLayout);
      
      // Elements should still be visible
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });
  });

  test.describe('Touch Interactions', () => {
    test('should support touch gestures', async ({ page, browserName }) => {
      // Set mobile viewport for this test
      await page.setViewportSize(devices['iPhone 12'].viewport);
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Test swipe/scroll
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Should scroll to bottom
      const scrollPosition = await page.evaluate(() => window.scrollY);
      expect(scrollPosition).toBeGreaterThan(0);
      
      // Test tap on prompt card
      const firstPrompt = await promptPage.getPromptByIndex(0);
      await firstPrompt.tap();
      
      // Should respond to tap
      await page.waitForTimeout(500);
    });

    test('should have touch-friendly button sizes', async ({ page }) => {
      await page.goto('/login');
      
      const loginPage = new LoginPage(page);
      
      // Check button size (minimum 44x44 for touch)
      const buttonBox = await loginPage.loginButton.boundingBox();
      
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      }
      
      // Check input field heights
      const inputBox = await loginPage.emailInput.boundingBox();
      
      if (inputBox) {
        expect(inputBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Responsive Images', () => {
    test('should load appropriate image sizes', async ({ page, viewport }) => {
      await page.goto('/');
      
      const images = await page.locator('img').all();
      
      for (const img of images.slice(0, 5)) { // Check first 5 images
        const src = await img.getAttribute('src');
        const srcset = await img.getAttribute('srcset');
        
        if (viewport?.width && viewport.width < 768) {
          // Mobile should not load large images
          if (src) {
            expect(src).not.toContain('large');
            expect(src).not.toContain('2x');
          }
        }
        
        // Should have srcset for responsive images
        if (srcset) {
          expect(srcset).toContain('1x');
          
          if (viewport?.width && viewport.width > 1920) {
            expect(srcset).toContain('2x');
          }
        }
      }
    });
  });

  test.describe('Grid and Flexbox Layouts', () => {
    test('should adjust grid columns based on viewport', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      const container = page.locator('.prompt-list, .grid, .flex');
      
      // Mobile - single column
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(500);
      
      let gridColumns = await container.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.gridTemplateColumns || styles.display;
      });
      
      if (gridColumns.includes('grid')) {
        expect(gridColumns).toContain('1fr');
      }
      
      // Tablet - 2 columns
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      gridColumns = await container.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.gridTemplateColumns || '';
      });
      
      // Desktop - 3+ columns
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      gridColumns = await container.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.gridTemplateColumns || '';
      });
    });
  });

  test.describe('Media Query Breakpoints', () => {
    const breakpoints = [
      { name: 'xs', width: 320 },
      { name: 'sm', width: 640 },
      { name: 'md', width: 768 },
      { name: 'lg', width: 1024 },
      { name: 'xl', width: 1280 },
      { name: '2xl', width: 1536 }
    ];

    breakpoints.forEach(breakpoint => {
      test(`should apply styles at ${breakpoint.name} breakpoint`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: 800 });
        await page.goto('/');
        
        // Check if appropriate styles are applied
        const bodyClasses = await page.evaluate(() => document.body.className);
        
        // Check container width
        const container = page.locator('.container, main, .wrapper').first();
        if (await container.isVisible()) {
          const containerBox = await container.boundingBox();
          
          if (containerBox) {
            // Container should have appropriate max-width
            if (breakpoint.width >= 1536) {
              expect(containerBox.width).toBeLessThanOrEqual(1536);
            } else if (breakpoint.width >= 1280) {
              expect(containerBox.width).toBeLessThanOrEqual(1280);
            } else if (breakpoint.width >= 1024) {
              expect(containerBox.width).toBeLessThanOrEqual(1024);
            }
          }
        }
        
        // Check padding/margins adjust
        const padding = await page.evaluate(() => {
          const main = document.querySelector('main');
          if (main) {
            const styles = window.getComputedStyle(main);
            return {
              paddingLeft: parseInt(styles.paddingLeft),
              paddingRight: parseInt(styles.paddingRight)
            };
          }
          return null;
        });
        
        if (padding) {
          // Smaller viewports should have less padding
          if (breakpoint.width < 640) {
            expect(padding.paddingLeft).toBeLessThanOrEqual(20);
          }
        }
      });
    });
  });
});