import { test, expect } from '@playwright/test';

test.describe('Final Release Validation', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `release${timestamp}@example.com`,
    password: 'ReleaseTest123!',
    nickname: `release${timestamp}`
  };

  test('CRITICAL PATH 1: Complete User Registration and Login Flow', async ({ page }) => {
    // 1. Navigate to application
    await page.goto('http://localhost:4003/');
    
    // 2. Go to registration
    await page.click('text=Sign Up');
    
    // 3. Register new user
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.fill('input[name="nickname"]', testUser.nickname);
    await page.click('button[type="submit"]');
    
    // 4. Wait for redirect to login
    await page.waitForURL('**/auth/login');
    
    // 5. Login with new credentials
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // 6. Verify successful login
    await page.waitForURL('http://localhost:4003/');
    
    // 7. Check user session
    const userMenu = page.locator(`text=${testUser.nickname}`);
    await expect(userMenu).toBeVisible();
    
    console.log('✅ User Registration and Login: PASSED');
  });

  test('CRITICAL PATH 2: Create and Manage Prompts', async ({ page, request }) => {
    // Setup: Login via API
    await request.post('http://localhost:8080/api/auth/register', {
      data: {
        email: `prompt${timestamp}@example.com`,
        password: 'TestPassword123!',
        nickname: `promptuser${timestamp}`
      }
    });
    
    const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
      data: {
        email: `prompt${timestamp}@example.com`,
        password: 'TestPassword123!'
      }
    });
    
    const { accessToken } = (await loginResponse.json()).data;
    
    // Set token and navigate
    await page.goto('http://localhost:4003/');
    await page.evaluate((token) => {
      localStorage.setItem('accessToken', token);
    }, accessToken);
    
    // Create prompt
    await page.goto('http://localhost:4003/prompts/create');
    await page.fill('input[name="title"]', 'Release Test Prompt');
    await page.fill('textarea[name="description"]', 'Testing prompt creation for release');
    await page.fill('textarea[name="content"]', 'This is a test prompt content for final validation.');
    await page.selectOption('select[name="category"]', 'CODING');
    await page.click('button[type="submit"]');
    
    // Verify prompt created
    await page.waitForURL(/prompts\/\d+/);
    await expect(page.locator('h1:has-text("Release Test Prompt")')).toBeVisible();
    
    console.log('✅ Prompt Creation: PASSED');
  });

  test('CRITICAL PATH 3: Search and Filter Prompts', async ({ page }) => {
    await page.goto('http://localhost:4003/prompts');
    
    // Test search
    await page.fill('input[placeholder*="Search"]', 'test');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Test category filter
    await page.selectOption('select[name="category"]', 'CODING');
    await page.waitForTimeout(500);
    
    // Test sorting
    await page.selectOption('select[name="sort"]', 'newest');
    await page.waitForTimeout(500);
    
    console.log('✅ Search and Filter: PASSED');
  });

  test('CRITICAL PATH 4: Error Handling and Validation', async ({ page }) => {
    await page.goto('http://localhost:4003/auth/login');
    
    // Test invalid login
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    // Check error message
    await expect(page.locator('text=Invalid email or password, text=Error')).toBeVisible();
    
    // Test form validation
    await page.goto('http://localhost:4003/auth/register');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter a valid email, text=Invalid email')).toBeVisible();
    
    console.log('✅ Error Handling: PASSED');
  });

  test('PERFORMANCE CHECK: Page Load Times', async ({ page }) => {
    const loadTimes = [];
    
    // Test multiple page loads
    for (const path of ['/', '/prompts', '/auth/login']) {
      const start = Date.now();
      await page.goto(`http://localhost:4003${path}`);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - start;
      loadTimes.push(loadTime);
      
      console.log(`Page ${path}: ${loadTime}ms`);
    }
    
    const avgLoadTime = loadTimes.reduce((a, b) => a + b) / loadTimes.length;
    expect(avgLoadTime).toBeLessThan(3000);
    
    console.log(`✅ Average Load Time: ${avgLoadTime}ms - PASSED`);
  });

  test('STABILITY CHECK: Multiple User Sessions', async ({ browser }) => {
    const contexts = [];
    const testPromises = [];
    
    // Create 3 concurrent sessions
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext();
      contexts.push(context);
      
      const promise = (async () => {
        const page = await context.newPage();
        await page.goto('http://localhost:4003/prompts');
        await page.waitForLoadState('networkidle');
        return page.title();
      })();
      
      testPromises.push(promise);
    }
    
    // Wait for all sessions
    const results = await Promise.all(testPromises);
    
    // Verify all loaded successfully
    for (const title of results) {
      expect(title).toContain('Prompt Driver');
    }
    
    // Cleanup
    for (const context of contexts) {
      await context.close();
    }
    
    console.log('✅ Concurrent Sessions: PASSED');
  });
});