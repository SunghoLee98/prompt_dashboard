const { chromium } = require('@playwright/test');

async function debugApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Go to the app
  console.log('Navigating to app...');
  await page.goto('http://localhost:4000');

  // Wait a moment for React to load
  await page.waitForTimeout(3000);

  // Check if the root div has content
  const rootContent = await page.locator('#root').innerHTML();
  console.log('Root div content:', rootContent.slice(0, 200) + '...');

  // Check console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Navigate to register page
  console.log('Navigating to /register...');
  await page.goto('http://localhost:4000/register');
  await page.waitForTimeout(2000);

  // Check if email input exists
  const emailInput = await page.locator('[data-testid="email-input"]');
  const exists = await emailInput.count();
  console.log('Email input exists:', exists > 0);

  if (exists === 0) {
    // Take a screenshot
    await page.screenshot({ path: 'debug-register-page.png' });
    console.log('Screenshot saved as debug-register-page.png');

    // Get page content
    const content = await page.content();
    console.log('Full page content:', content.slice(0, 500) + '...');
  }

  await browser.close();
}

debugApp().catch(console.error);