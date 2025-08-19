# Student Prep Web Application - Testing Guide

## Overview

This document provides comprehensive testing guidelines for the Student Prep Web Application, covering our three-phase release strategy with detailed Playwright end-to-end testing.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Environment Setup](#test-environment-setup)
3. [Release Testing Plans](#release-testing-plans)
4. [Test Execution](#test-execution)
5. [Best Practices](#best-practices)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## Testing Strategy

### Testing Pyramid

Our testing approach follows a comprehensive strategy:

- **Unit Tests**: Component-level testing (Jest/React Testing Library)
- **Integration Tests**: API and database integration testing
- **End-to-End Tests**: Full user journey testing (Playwright)
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication and data protection testing

### Release-Based Testing

We organize our tests around three major releases:

1. **Release 1.0**: Foundation & Student Enrollment
2. **Release 2.0**: Question Management & Content System  
3. **Release 3.0**: Assignment System & Automation

---

## Test Environment Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Set up test database
npm run db:test:setup
```

### Environment Configuration

Create `.env.test` file:

```env
# Database
DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/student_prep_test"

# Email Service (Test Mode)
RESEND_API_KEY="test_key"
EMAIL_FROM="test@studentprep.com"

# Authentication
NEXTAUTH_SECRET="test_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# Test Configuration
NODE_ENV="test"
PLAYWRIGHT_BASE_URL="http://localhost:3000"
```

### Test Data Setup

```bash
# Seed test database
npm run db:seed:test

# Reset test data between test runs
npm run db:reset:test
```

---

## Release Testing Plans

### Release 1.0: Foundation & Student Enrollment

**Test Files:**
- `tests/release-1/student-registration.spec.ts`
- `tests/release-1/email-preferences.spec.ts`

**Key Test Scenarios:**

#### Student Registration
- ✅ Form validation (required fields, email format, grade range)
- ✅ Successful registration flow
- ✅ Duplicate email prevention
- ✅ State field conditional logic (US students only)
- ✅ Default study plan creation
- ✅ Accessibility compliance (ARIA labels, keyboard navigation)
- ✅ Mobile responsiveness
- ✅ Error handling (server errors, network failures)

#### Email Preferences
- ✅ Default preference state (enabled)
- ✅ Preference toggling functionality
- ✅ Study plan channel updates based on preferences
- ✅ Integration with registration flow

**Acceptance Criteria:**
- All registration form validations work correctly
- Students can successfully create accounts
- Email preferences are properly saved and applied
- Default study plans are created with correct settings
- Form is accessible and mobile-friendly

### Release 2.0: Question Management & Content System

**Test Files:**
- `tests/release-2/question-generation.spec.ts`
- `tests/release-2/admin-question-management.spec.ts`

**Key Test Scenarios:**

#### Question Generation
- ✅ Grade-level filtering (questions match student grade)
- ✅ Locale-based filtering (GLOBAL, COUNTRY, STATE scopes)
- ✅ Fallback logic (STATE → COUNTRY → GLOBAL)
- ✅ Default question count (5 questions)
- ✅ Question randomization
- ✅ Empty result handling
- ✅ Performance optimization
- ✅ Error handling for invalid parameters

#### Admin Question Management
- ✅ Admin authentication and authorization
- ✅ Question creation (form validation, successful creation)
- ✅ Question listing and filtering
- ✅ Question editing and updates
- ✅ Question deletion with confirmation
- ✅ Bulk operations (CSV import/export)
- ✅ Question preview functionality
- ✅ Usage analytics and reporting

**Acceptance Criteria:**
- Questions are properly filtered by grade and locale
- Admin interface allows full CRUD operations
- Bulk import/export functionality works correctly
- Question generation performance meets requirements
- Proper error handling for edge cases

### Release 3.0: Assignment System & Automation

**Test Files:**
- `tests/release-3/assignment-delivery.spec.ts`
- `tests/release-3/auto-grading.spec.ts`
- `tests/release-3/weekly-reports.spec.ts`

**Key Test Scenarios:**

#### Assignment Delivery & Scheduling
- ✅ Automated scheduling (Mon/Wed/Fri)
- ✅ Email delivery based on preferences
- ✅ In-app assignment access
- ✅ Assignment timer functionality
- ✅ Progress saving and submission
- ✅ Assignment history tracking
- ✅ Notification system

#### Auto-Grading System
- ✅ Immediate grading on submission
- ✅ Score calculation accuracy
- ✅ Letter grade assignment
- ✅ Detailed feedback generation
- ✅ Grade storage and history
- ✅ Performance analytics
- ✅ Error handling for edge cases

#### Weekly Reports
- ✅ Automated report generation (Fridays)
- ✅ Email delivery with preferences
- ✅ Comprehensive report content
- ✅ Performance metrics calculation
- ✅ Subject breakdown analysis
- ✅ Improvement suggestions
- ✅ Report history and filtering
- ✅ PDF export functionality

**Acceptance Criteria:**
- Assignments are delivered on schedule
- Grading is accurate and immediate
- Weekly reports contain all required sections
- Email delivery respects user preferences
- All automation works reliably

---

## Test Execution

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific release tests
npm run test:e2e:release1
npm run test:e2e:release2
npm run test:e2e:release3

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Generate test report
npm run test:e2e:report
```

### Test Configuration

Our Playwright configuration supports:

- **Multiple Browsers**: Chromium, Firefox, WebKit, Mobile Safari, Mobile Chrome
- **Parallel Execution**: Tests run in parallel for faster execution
- **Retry Logic**: Automatic retries on flaky tests
- **Screenshots/Videos**: Captured on failures for debugging
- **Trace Collection**: Detailed execution traces for analysis

### Test Data Management

```bash
# Before test suite
npm run test:setup

# After test suite  
npm run test:teardown

# Reset between test files
npm run test:reset
```

---

## Best Practices

### Test Organization

1. **File Structure**: Organize tests by release and feature
2. **Naming Convention**: Use descriptive test names that explain the scenario
3. **Test Isolation**: Each test should be independent and not rely on others
4. **Data Management**: Use fresh test data for each test run

### Writing Effective Tests

```typescript
// ✅ Good: Descriptive test name and clear assertions
test('should prevent duplicate registration with existing email', async ({ page }) => {
  // Arrange: Set up test data
  await createTestUser('existing@example.com');
  
  // Act: Attempt registration
  await page.goto('/register');
  await page.fill('input[name="email"]', 'existing@example.com');
  await page.click('button[type="submit"]');
  
  // Assert: Verify expected behavior
  await expect(page.locator('.error-message')).toContainText('A student with this email already exists');
});

// ❌ Avoid: Vague test names and unclear assertions
test('registration test', async ({ page }) => {
  // Test logic...
});
```

### Page Object Model

Use Page Object Model for maintainable tests:

```typescript
// pages/RegistrationPage.ts
export class RegistrationPage {
  constructor(private page: Page) {}
  
  async fillForm(data: StudentData) {
    await this.page.fill('input[name="name"]', data.name);
    await this.page.fill('input[name="email"]', data.email);
    await this.page.selectOption('select[name="grade"]', data.grade.toString());
  }
  
  async submit() {
    await this.page.click('button[type="submit"]');
  }
  
  async getErrorMessage() {
    return this.page.locator('.error-message').textContent();
  }
}
```

### Test Data Factories

Create reusable test data:

```typescript
// factories/StudentFactory.ts
export const createStudentData = (overrides = {}) => ({
  name: 'Test Student',
  email: `test${Date.now()}@example.com`,
  grade: 8,
  country: 'US',
  state: 'NY',
  receiveEmails: true,
  ...overrides
});
```

### Assertions Best Practices

```typescript
// ✅ Specific assertions
await expect(page.locator('.success-message')).toContainText('Registration successful');
await expect(page).toHaveURL('/dashboard');

// ✅ Wait for elements
await expect(page.locator('.loading-spinner')).toBeHidden();
await expect(page.locator('.content')).toBeVisible();

// ✅ Multiple related assertions
await expect.soft(page.locator('.student-name')).toContainText('John Doe');
await expect.soft(page.locator('.student-grade')).toContainText('Grade 8');
await expect.soft(page.locator('.student-email')).toContainText('john@example.com');
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: npm run db:test:setup
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Reporting

- **HTML Report**: Interactive test results with screenshots
- **JUnit XML**: For CI/CD integration
- **JSON Report**: For custom analysis and metrics
- **Allure Report**: Advanced reporting with trends and analytics

---

## Troubleshooting

### Common Issues

#### Test Timeouts
```typescript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  
  // Or use specific waits
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
});
```

#### Flaky Tests
```typescript
// Use retry logic
test.describe.configure({ retries: 2 });

// Wait for stable state
await expect(page.locator('.dynamic-content')).toBeVisible();
await page.waitForLoadState('networkidle');
```

#### Element Not Found
```typescript
// Use more specific selectors
await page.locator('[data-testid="submit-button"]').click();

// Wait for element to be ready
await page.waitForSelector('.submit-button', { state: 'visible' });
```

#### Database State Issues
```typescript
// Reset database between tests
test.beforeEach(async () => {
  await resetTestDatabase();
});
```

### Debug Mode

```bash
# Run in debug mode
npm run test:e2e:debug

# Run specific test in debug mode
npx playwright test --debug tests/release-1/student-registration.spec.ts
```

### Performance Optimization

- Use `page.route()` to mock external API calls
- Implement parallel test execution
- Use database transactions for faster cleanup
- Cache static assets during test runs

---

## Metrics and Reporting

### Test Coverage Goals

- **Release 1.0**: 95% coverage of critical user paths
- **Release 2.0**: 90% coverage of admin and question features  
- **Release 3.0**: 95% coverage of automation and reporting

### Performance Benchmarks

- Page load time: < 2 seconds
- Form submission: < 1 second
- Question generation: < 500ms
- Report generation: < 5 seconds

### Quality Gates

Tests must pass these criteria before deployment:

- ✅ All critical path tests pass
- ✅ No accessibility violations
- ✅ Performance benchmarks met
- ✅ Security tests pass
- ✅ Cross-browser compatibility verified

---

## Maintenance

### Regular Tasks

- **Weekly**: Review and update test data
- **Monthly**: Update browser versions and dependencies
- **Quarterly**: Review and refactor test suites
- **Per Release**: Add new test scenarios for new features

### Test Suite Health

Monitor these metrics:

- Test execution time trends
- Flaky test identification and resolution
- Test coverage reports
- Failed test analysis and patterns

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

*Last Updated: January 2024*
*Version: 1.0*