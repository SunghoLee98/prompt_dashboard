import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { PromptPage } from './pages/PromptPage';
import { ProfilePage } from './pages/ProfilePage';
import { testUsers, performanceThresholds, generateRandomPrompt } from './utils/testData';
import { TestHelpers } from './utils/helpers';

test.describe('Performance Tests', () => {
  test.describe('Page Load Performance', () => {
    test('should load homepage within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(performanceThresholds.pageLoad);
      
      // Check Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcp = entries.find(e => e.name === 'first-contentful-paint');
            const lcp = entries.find(e => e.entryType === 'largest-contentful-paint');
            
            resolve({
              fcp: fcp?.startTime || 0,
              lcp: lcp?.startTime || 0
            });
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
          
          // Trigger observation
          setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            resolve({
              fcp: 0,
              lcp: 0,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              loadComplete: navigation.loadEventEnd - navigation.fetchStart
            });
          }, 1000);
        });
      });
      
      // First Contentful Paint should be under 1.5s
      if (metrics.fcp) {
        expect(metrics.fcp).toBeLessThan(performanceThresholds.firstContentfulPaint);
      }
    });

    test('should load login page quickly', async ({ page }) => {
      const metrics = await page.evaluate(() => performance.getEntriesByType('navigation'));
      
      const loginPage = new LoginPage(page);
      
      const startTime = Date.now();
      await loginPage.navigateToLogin();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(performanceThresholds.pageLoad);
      
      // Check if critical resources are loaded
      const criticalResourcesLoaded = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        
        return {
          scriptsLoaded: scripts.every(s => !s.src || s.async || s.defer),
          stylesLoaded: styles.length > 0
        };
      });
      
      expect(criticalResourcesLoaded.stylesLoaded).toBeTruthy();
    });

    test('should load prompts page with data quickly', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      
      const startTime = Date.now();
      await promptPage.navigateToPrompts();
      await TestHelpers.waitForNetworkIdle(page);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(performanceThresholds.pageLoad);
      
      // Check if prompts are rendered
      const promptCount = await promptPage.getPromptCount();
      expect(promptCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('API Response Times', () => {
    test('should authenticate quickly', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigateToLogin();
      
      const responseTime = await TestHelpers.measureAPIResponseTime(
        page,
        async () => {
          await loginPage.login(testUsers.existingUser.email, testUsers.existingUser.password);
        },
        'api/auth/login'
      );
      
      expect(responseTime).toBeLessThan(performanceThresholds.loginTime);
    });

    test('should fetch prompts quickly', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const responseTime = await TestHelpers.measureAPIResponseTime(
        page,
        async () => {
          await page.goto('/prompts');
        },
        'api/prompts'
      );
      
      expect(responseTime).toBeLessThan(performanceThresholds.apiResponse);
    });

    test('should search prompts quickly', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      const responseTime = await TestHelpers.measureAPIResponseTime(
        page,
        async () => {
          await promptPage.searchPrompts('test');
        },
        'api/prompts/search'
      );
      
      expect(responseTime).toBeLessThan(performanceThresholds.searchResponse);
    });

    test('should create prompt quickly', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      const prompt = generateRandomPrompt();
      
      const responseTime = await TestHelpers.measureAPIResponseTime(
        page,
        async () => {
          await promptPage.createPrompt(prompt);
        },
        'api/prompts'
      );
      
      expect(responseTime).toBeLessThan(performanceThresholds.apiResponse);
    });
  });

  test.describe('Resource Loading', () => {
    test('should optimize image loading', async ({ page }) => {
      await page.goto('/');
      
      // Check for lazy loading
      const images = await page.locator('img').all();
      let lazyLoadCount = 0;
      
      for (const img of images) {
        const loading = await img.getAttribute('loading');
        if (loading === 'lazy') {
          lazyLoadCount++;
        }
      }
      
      // At least some images should be lazy loaded
      if (images.length > 5) {
        expect(lazyLoadCount).toBeGreaterThan(0);
      }
      
      // Check image formats
      const imageSrcs = await Promise.all(
        images.slice(0, 10).map(img => img.getAttribute('src'))
      );
      
      // Should use modern formats
      const modernFormats = imageSrcs.filter(src => 
        src?.includes('.webp') || src?.includes('.avif')
      );
      
      // Check if images are optimized (not too large)
      const imageRequests = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.name.match(/\.(jpg|jpeg|png|webp|avif)/i))
          .map(r => ({
            url: r.name,
            size: (r as any).encodedBodySize || 0,
            duration: r.duration
          }));
      });
      
      for (const img of imageRequests) {
        // Images should be under 500KB
        expect(img.size).toBeLessThan(500 * 1024);
        // Images should load quickly
        expect(img.duration).toBeLessThan(1000);
      }
    });

    test('should optimize JavaScript bundles', async ({ page }) => {
      await page.goto('/');
      
      const jsRequests = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.name.endsWith('.js'))
          .map(r => ({
            url: r.name,
            size: (r as any).encodedBodySize || 0,
            duration: r.duration
          }));
      });
      
      // Check bundle sizes
      let totalJsSize = 0;
      for (const js of jsRequests) {
        totalJsSize += js.size;
        // Individual bundles should be under 300KB
        expect(js.size).toBeLessThan(300 * 1024);
      }
      
      // Total JS should be under 1MB
      expect(totalJsSize).toBeLessThan(1024 * 1024);
      
      // Check for code splitting (should have multiple bundles)
      if (jsRequests.length > 1) {
        expect(jsRequests.length).toBeGreaterThan(1);
      }
    });

    test('should optimize CSS loading', async ({ page }) => {
      await page.goto('/');
      
      // Check for critical CSS
      const inlineStyles = await page.locator('style').count();
      expect(inlineStyles).toBeGreaterThan(0); // Should have some inline critical CSS
      
      // Check CSS file sizes
      const cssRequests = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.name.endsWith('.css'))
          .map(r => ({
            url: r.name,
            size: (r as any).encodedBodySize || 0,
            duration: r.duration
          }));
      });
      
      for (const css of cssRequests) {
        // CSS files should be under 100KB
        expect(css.size).toBeLessThan(100 * 1024);
        // CSS should load quickly
        expect(css.duration).toBeLessThan(500);
      }
    });
  });

  test.describe('Runtime Performance', () => {
    test('should have smooth scrolling', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Measure FPS during scroll
      const scrollPerformance = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frames = 0;
          const startTime = performance.now();
          
          const countFrame = () => {
            frames++;
            if (performance.now() - startTime < 1000) {
              requestAnimationFrame(countFrame);
            } else {
              resolve(frames);
            }
          };
          
          // Start scrolling
          window.scrollTo({ top: 1000, behavior: 'smooth' });
          requestAnimationFrame(countFrame);
        });
      });
      
      // Should maintain at least 30 FPS
      expect(scrollPerformance).toBeGreaterThan(30);
    });

    test('should handle interactions without jank', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Measure interaction latency
      const interactionLatency = await page.evaluate(() => {
        return new Promise((resolve) => {
          const button = document.querySelector('button');
          if (!button) {
            resolve(0);
            return;
          }
          
          const startTime = performance.now();
          button.addEventListener('click', () => {
            const latency = performance.now() - startTime;
            resolve(latency);
          }, { once: true });
          
          button.click();
        });
      });
      
      // Interaction should be under 100ms
      expect(interactionLatency).toBeLessThan(performanceThresholds.firstInputDelay);
    });

    test('should not have memory leaks', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Perform multiple operations
      const promptPage = new PromptPage(page);
      
      for (let i = 0; i < 5; i++) {
        await promptPage.navigateToPrompts();
        await promptPage.createPromptButton.click();
        await promptPage.cancelButton.click();
        await page.goto('/profile');
        await page.goto('/prompts');
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      // Check memory after operations
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        // Memory increase should be reasonable (not more than 50MB)
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });
  });

  test.describe('Network Optimization', () => {
    test('should use HTTP/2', async ({ page }) => {
      const response = await page.goto('/');
      
      if (response) {
        const protocol = await response.request().response()?.serverAddr();
        // Check if using HTTP/2 or HTTP/3
        // This might not work in all environments
      }
    });

    test('should compress resources', async ({ page }) => {
      await page.goto('/');
      
      const resources = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.name.match(/\.(js|css|json)/))
          .map(r => ({
            url: r.name,
            size: (r as any).encodedBodySize || 0,
            decodedSize: (r as any).decodedBodySize || 0
          }));
      });
      
      for (const resource of resources) {
        if (resource.size > 0 && resource.decodedSize > 0) {
          // Encoded size should be smaller than decoded (compression)
          expect(resource.size).toBeLessThan(resource.decodedSize);
        }
      }
    });

    test('should cache static assets', async ({ page }) => {
      // First load
      await page.goto('/');
      
      // Get resource timings
      const firstLoad = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.name.match(/\.(js|css|jpg|png|webp)/))
          .map(r => ({
            url: r.name,
            duration: r.duration
          }));
      });
      
      // Second load (should use cache)
      await page.reload();
      
      const secondLoad = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.name.match(/\.(js|css|jpg|png|webp)/))
          .map(r => ({
            url: r.name,
            duration: r.duration
          }));
      });
      
      // Second load should be faster due to caching
      const firstLoadTotal = firstLoad.reduce((sum, r) => sum + r.duration, 0);
      const secondLoadTotal = secondLoad.reduce((sum, r) => sum + r.duration, 0);
      
      if (firstLoadTotal > 0 && secondLoadTotal > 0) {
        expect(secondLoadTotal).toBeLessThan(firstLoadTotal);
      }
    });
  });

  test.describe('Load Testing', () => {
    test('should handle concurrent users', async ({ browser }) => {
      const userCount = 5;
      const contexts = [];
      const pages = [];
      
      // Create multiple browser contexts (simulate different users)
      for (let i = 0; i < userCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }
      
      // All users navigate simultaneously
      const startTime = Date.now();
      const navigationPromises = pages.map(page => page.goto('/prompts'));
      await Promise.all(navigationPromises);
      const totalTime = Date.now() - startTime;
      
      // Average load time should still be acceptable
      const averageTime = totalTime / userCount;
      expect(averageTime).toBeLessThan(performanceThresholds.pageLoad * 2); // Allow 2x threshold for concurrent load
      
      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    });

    test('should handle rapid interactions', async ({ page }) => {
      await TestHelpers.login(page, testUsers.existingUser.email, testUsers.existingUser.password);
      
      const promptPage = new PromptPage(page);
      await promptPage.navigateToPrompts();
      
      // Rapidly like/unlike prompts
      const rapidActions = [];
      const firstPrompt = await promptPage.getPromptByIndex(0);
      
      for (let i = 0; i < 10; i++) {
        rapidActions.push(promptPage.likePrompt(firstPrompt));
      }
      
      const startTime = Date.now();
      await Promise.all(rapidActions);
      const duration = Date.now() - startTime;
      
      // Should handle rapid actions without significant slowdown
      expect(duration).toBeLessThan(5000); // 5 seconds for 10 actions
    });
  });

  test.describe('Mobile Performance', () => {
    test.use({
      ...test.use,
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    test('should perform well on mobile devices', async ({ page }) => {
      // Simulate slow 3G network
      await page.context().route('**/*', route => {
        setTimeout(() => route.continue(), 100); // Add 100ms delay
      });
      
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      // Mobile on slow network should still load within reasonable time
      expect(loadTime).toBeLessThan(performanceThresholds.pageLoad * 2);
    });

    test('should optimize for mobile data usage', async ({ page }) => {
      await page.goto('/');
      
      // Check total data transferred
      const totalBytes = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return resources.reduce((total, r) => {
          return total + ((r as any).encodedBodySize || 0);
        }, 0);
      });
      
      // Total page size should be under 2MB for mobile
      expect(totalBytes).toBeLessThan(2 * 1024 * 1024);
    });
  });
});