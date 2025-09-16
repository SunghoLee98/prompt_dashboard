# E2E Testing Suite for Prompt Driver

## 🎯 Overview

Comprehensive End-to-End testing suite for the Prompt Driver web service, built with Playwright and TypeScript.

## 📋 Test Coverage

### 1. **Authentication Tests** (`auth.spec.ts`)
- ✅ User signup with validation
- ✅ User login/logout flows
- ✅ Session management and JWT handling
- ✅ Password requirements and validation
- ✅ Error handling for auth failures

### 2. **Prompt Management Tests** (`prompts.spec.ts`)
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Search and filtering functionality
- ✅ Like/unlike functionality
- ✅ Sharing prompts
- ✅ Pagination and infinite scroll
- ✅ Performance with large datasets

### 3. **Profile Management Tests** (`profile.spec.ts`)
- ✅ Profile display and editing
- ✅ Password changes
- ✅ Settings management
- ✅ Theme and language switching
- ✅ User statistics and activity

### 4. **Responsive Design Tests** (`responsive.spec.ts`)
- ✅ Mobile viewport testing (iPhone, Android)
- ✅ Tablet viewport testing (iPad)
- ✅ Desktop viewport testing (1080p, 4K)
- ✅ Orientation changes
- ✅ Touch interactions
- ✅ Responsive images and layouts

### 5. **Accessibility Tests** (`accessibility.spec.ts`)
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast validation
- ✅ Focus management
- ✅ ARIA labels and roles

### 6. **Performance Tests** (`performance.spec.ts`)
- ✅ Page load times
- ✅ API response times
- ✅ Core Web Vitals (FCP, LCP, CLS)
- ✅ Resource optimization
- ✅ Memory leak detection
- ✅ Load testing with concurrent users

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend server running on `http://localhost:8080`
- Frontend app running on `http://localhost:3000`

### Installation

```bash
cd e2e
npm install
npx playwright install  # Install browsers
```

## 🏃 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm run test -- auth.spec.ts
npm run test -- prompts.spec.ts
npm run test -- profile.spec.ts
npm run test -- responsive.spec.ts
npm run test -- accessibility.spec.ts
npm run test -- performance.spec.ts
```

### Run Tests in Specific Browser
```bash
npm run test:chrome    # Chrome only
npm run test:firefox   # Firefox only
npm run test:safari    # Safari only
npm run test:mobile    # Mobile browsers
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:headed
```

### Debug Tests
```bash
npm run test:debug    # Step through tests
npm run test:ui       # Playwright UI mode
```

### Generate Test Code
```bash
npm run codegen       # Open Playwright codegen tool
```

## 📊 Test Reports

After running tests, view the HTML report:
```bash
npm run report
```

Reports are generated in:
- `test-report/` - HTML report
- `test-results.json` - JSON results
- `screenshots/` - Test failure screenshots
- `videos/` - Test failure videos

## 🎯 Performance Thresholds

| Metric | Threshold |
|--------|-----------|
| Page Load | < 3 seconds |
| API Response | < 500ms |
| Search Response | < 1 second |
| Login Time | < 2 seconds |
| First Contentful Paint | < 1.5 seconds |
| Largest Contentful Paint | < 2.5 seconds |

## 🧪 Test Data

### Test Users
- `testUsers.validUser` - New user for signup tests
- `testUsers.existingUser` - Existing user for login tests
- `testUsers.adminUser` - Admin user for privileged operations

### Test Prompts
- `testPrompts.basicPrompt` - Simple prompt
- `testPrompts.longPrompt` - Complex multi-step prompt
- `testPrompts.searchablePrompts` - Array of searchable prompts

## 📁 Project Structure

```
e2e/
├── tests/
│   ├── auth.spec.ts         # Authentication tests
│   ├── prompts.spec.ts      # Prompt management tests
│   ├── profile.spec.ts      # Profile tests
│   ├── responsive.spec.ts   # Responsive design tests
│   ├── accessibility.spec.ts # Accessibility tests
│   ├── performance.spec.ts  # Performance tests
│   ├── pages/              # Page Object Models
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── SignupPage.ts
│   │   ├── PromptPage.ts
│   │   └── ProfilePage.ts
│   ├── utils/              # Utilities
│   │   ├── testData.ts    # Test data and constants
│   │   └── helpers.ts     # Helper functions
│   └── fixtures/           # Test fixtures (images, files)
├── playwright.config.ts    # Playwright configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies
└── README.md             # This file
```

## 🔧 Configuration

Edit `playwright.config.ts` to modify:
- Test timeouts
- Browser configurations
- Base URLs
- Report settings
- Parallel execution settings

## 🐛 Debugging Tips

1. **Use Inspector**: Run with `--debug` flag
2. **Take Screenshots**: Tests automatically capture screenshots on failure
3. **View Traces**: Enable trace collection for detailed debugging
4. **Check Videos**: Video recordings available for failed tests
5. **Console Logs**: Add `console.log()` in tests to debug

## 📈 CI/CD Integration

For CI environments, set environment variable:
```bash
CI=true npm test
```

This will:
- Run tests in headless mode
- Enable test retries
- Use single worker
- Generate CI-friendly reports

## 🤝 Best Practices

1. **Use Page Objects**: All page interactions through POM classes
2. **Data Independence**: Generate unique test data for each run
3. **Cleanup**: Clean up test data after tests
4. **Parallel Execution**: Tests are designed to run in parallel
5. **Flaky Test Prevention**: Use proper waits and retries

## 📝 Common Issues

### Tests Failing Due to Timing
- Increase timeouts in `playwright.config.ts`
- Use `waitForNetworkIdle()` helper
- Add explicit waits for elements

### Authentication Issues
- Ensure backend is running
- Check JWT token configuration
- Verify test user credentials

### Performance Tests Failing
- Run on consistent hardware
- Close other applications
- Adjust performance thresholds

## 🚀 Future Improvements

- [ ] Visual regression testing
- [ ] API contract testing
- [ ] Security testing (XSS, CSRF)
- [ ] Internationalization testing
- [ ] Database state management
- [ ] Test data factory improvements
- [ ] Cross-browser compatibility matrix
- [ ] Performance trend tracking

## 📞 Support

For issues or questions:
1. Check test logs in `test-report/`
2. Review screenshots/videos of failures
3. Ensure all services are running
4. Verify test data is correct

---

**Last Updated**: 2024
**Version**: 1.0.0
**Maintainer**: QA Team