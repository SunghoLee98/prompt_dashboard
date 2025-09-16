import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  try {
    console.log('Testing http://localhost:4006/test');
    await page.goto('http://localhost:4006/test', { waitUntil: 'networkidle' });
    
    // Wait a bit for React to mount
    await page.waitForTimeout(2000);
    
    // Check if React app mounted
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : 'Root element not found';
    });
    
    console.log('\n=== Root Element Content ===');
    console.log(rootContent.substring(0, 200) + '...');
    
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type}] ${msg.text}`);
    });
    
    if (pageErrors.length > 0) {
      console.log('\n=== Page Errors ===');
      pageErrors.forEach(error => {
        console.log(error);
      });
    }
    
    // Try login page
    console.log('\n\nTesting http://localhost:4006/login');
    await page.goto('http://localhost:4006/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const loginPageContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : 'Root element not found';
    });
    
    console.log('\n=== Login Page Content ===');
    console.log(loginPageContent.substring(0, 200) + '...');
    
    // Check for form elements
    const hasLoginForm = await page.evaluate(() => {
      return {
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        hasForm: !!document.querySelector('form')
      };
    });
    
    console.log('\n=== Login Form Elements ===');
    console.log(JSON.stringify(hasLoginForm, null, 2));
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
})();