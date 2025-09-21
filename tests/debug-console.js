const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });

  // Listen for page errors
  page.on('pageerror', exception => {
    console.log(`PAGE ERROR: ${exception.toString()}`);
  });

  // Go to the page
  console.log('Navigating to /register...');
  await page.goto('http://localhost:4000/register');

  // Wait a bit to see if anything loads
  await page.waitForTimeout(5000);

  // Check what's in the root element
  const rootContent = await page.$eval('#root', el => el.innerHTML);
  console.log('Root content:', rootContent);

  // Take a screenshot
  await page.screenshot({ path: './debug-register-page.png' });

  await browser.close();
})();
