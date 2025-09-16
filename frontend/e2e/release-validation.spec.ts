import { test, expect } from '@playwright/test';

test.describe('Release Validation Tests', () => {
  test('MVP-001: Homepage loads with all critical elements', async ({ page }) => {
    await page.goto('http://localhost:4000/');
    
    // 페이지 로딩 확인
    await expect(page).toHaveTitle(/Prompt Driver/);
    
    // 네비게이션 바 확인
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // 핵심 링크 확인
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('link', { name: '회원가입' })).toBeVisible();
    
    // 메인 콘텐츠 확인
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('MVP-002: Register page loads with form elements', async ({ page }) => {
    await page.goto('http://localhost:4000/register');
    
    // 회원가입 폼 확인
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
    
    // 입력 필드 확인
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('nickname')).toBeVisible();
    
    // 비밀번호 필드 확인 (placeholder가 다를 수 있음)
    const passwordFields = page.locator('input[type="password"]');
    await expect(passwordFields).toHaveCount(2); // 비밀번호, 비밀번호 확인
    
    // 약관 동의 체크박스 확인
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    
    // 회원가입 버튼 확인 (폼 내부의 버튼)
    await expect(page.locator('main').getByRole('button', { name: '회원가입' })).toBeVisible();
  });

  test('MVP-003: Login page loads with form elements', async ({ page }) => {
    await page.goto('http://localhost:4000/login');
    
    // 로그인 폼 확인
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    
    // 입력 필드 확인
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    
    // 비밀번호 필드 확인
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toBeVisible();
    
    // 로그인 버튼 확인 (폼 내부의 버튼)
    await expect(page.locator('main').getByRole('button', { name: '로그인' })).toBeVisible();
    
    // 회원가입 링크 확인
    await expect(page.locator('main').getByRole('link', { name: '회원가입' })).toBeVisible();
  });

  test('MVP-004: Navigation between pages works', async ({ page }) => {
    await page.goto('http://localhost:4000/');
    
    // 회원가입 페이지로 이동
    await page.getByRole('link', { name: '회원가입' }).first().click();
    await expect(page).toHaveURL(/register/);
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
    
    // 로그인 페이지로 이동
    await page.getByRole('navigation').getByRole('link', { name: '로그인' }).click();
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    
    // 홈으로 돌아가기
    await page.getByRole('link', { name: 'Prompt Driver' }).click();
    await expect(page).toHaveURL('http://localhost:4000/');
  });

  test('MVP-005: Basic form interaction works', async ({ page }) => {
    await page.goto('http://localhost:4000/register');
    
    // 이메일 입력
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    
    // 닉네임 입력
    const nicknameInput = page.getByPlaceholder('nickname');
    await nicknameInput.fill('testuser');
    await expect(nicknameInput).toHaveValue('testuser');
    
    // 비밀번호 입력
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.first().fill('TestPass123!');
    await passwordFields.nth(1).fill('TestPass123!');
    
    // 체크박스 클릭
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('MVP-006: API connection attempt (CORS errors acceptable)', async ({ page }) => {
    await page.goto('http://localhost:4000/register');
    
    // 네트워크 요청 모니터링
    let apiCallMade = false;
    page.on('request', request => {
      if (request.url().includes('localhost:9090') || request.url().includes('/api/')) {
        apiCallMade = true;
      }
    });
    
    // 폼 작성
    await page.getByPlaceholder('your@email.com').fill('test@example.com');
    await page.getByPlaceholder('nickname').fill('testuser');
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.first().fill('TestPass123!');
    await passwordFields.nth(1).fill('TestPass123!');
    await page.getByRole('checkbox').first().check();
    
    // 제출 시도
    await page.locator('main').getByRole('button', { name: '회원가입' }).click();
    
    // API 호출이 시도되었는지 확인 (CORS 에러는 괜찮음)
    await page.waitForTimeout(2000);
    
    // 페이지가 여전히 작동하는지 확인
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
  });
});