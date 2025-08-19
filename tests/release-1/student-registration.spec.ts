import { test, expect } from '@playwright/test';

test.describe('Release 1.0: Student Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Registration Form Display', () => {
    test('should display all required form fields', async ({ page }) => {
      // Check form title
      await expect(page.locator('h1')).toContainText('Student Registration');
      
      // Check all form fields are present
      await expect(page.locator('[data-testid="name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="grade-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="country-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="receive-email-checkbox"]')).toBeVisible();
      await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
      
      // Check grade options (1-12)
      await page.click('[data-testid="grade-select"]');
      for (let grade = 1; grade <= 12; grade++) {
        await expect(page.locator(`option[value="${grade}"]`)).toBeVisible();
      }
    });

    test('should show state field only for US students', async ({ page }) => {
      // Initially state field should not be visible
      await expect(page.locator('[data-testid="state-select"]')).not.toBeVisible();
      
      // Select US as country
      await page.selectOption('[data-testid="country-select"]', 'US');
      
      // State field should now be visible and required
      await expect(page.locator('[data-testid="state-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="state-select"]')).toHaveAttribute('required');
      
      // Select different country
      await page.selectOption('[data-testid="country-select"]', 'CA');
      
      // State field should be hidden again
      await expect(page.locator('[data-testid="state-select"]')).not.toBeVisible();
    });

    test('should have email preference checked by default', async ({ page }) => {
      await expect(page.locator('[data-testid="receive-email-checkbox"]')).toBeChecked();
    });
  });

  test.describe('Form Validation', () => {
    test('should show validation errors for empty required fields', async ({ page }) => {
      // Try to submit empty form
      await page.click('[data-testid="submit-button"]');
      
      // Check validation messages
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
      await expect(page.locator('[data-testid="grade-error"]')).toContainText('Grade is required');
      await expect(page.locator('[data-testid="country-error"]')).toContainText('Country is required');
    });

    test('should validate email format', async ({ page }) => {
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="submit-button"]');
      
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email address');
    });

    test('should require state for US students', async ({ page }) => {
      // Fill form with US country but no state
      await page.fill('[data-testid="name-input"]', 'John Doe');
      await page.fill('[data-testid="email-input"]', 'john@example.com');
      await page.selectOption('[data-testid="grade-select"]', '8');
      await page.selectOption('[data-testid="country-select"]', 'US');
      
      // Submit without selecting state
      await page.click('[data-testid="submit-button"]');
      
      await expect(page.locator('[data-testid="state-error"]')).toContainText('State is required for US students');
    });

    test('should validate name length', async ({ page }) => {
      // Test minimum length
      await page.fill('[data-testid="name-input"]', 'A');
      await page.click('[data-testid="submit-button"]');
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name must be at least 2 characters');
      
      // Test maximum length
      const longName = 'A'.repeat(101);
      await page.fill('[data-testid="name-input"]', longName);
      await page.click('[data-testid="submit-button"]');
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name must be less than 100 characters');
    });
  });

  test.describe('Successful Registration', () => {
    test('should successfully register a US student', async ({ page }) => {
      // Fill out complete form for US student
      await page.fill('[data-testid="name-input"]', 'John Doe');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.selectOption('[data-testid="grade-select"]', '8');
      await page.selectOption('[data-testid="country-select"]', 'US');
      await page.selectOption('[data-testid="state-select"]', 'NY');
      
      // Submit form
      await page.click('[data-testid="submit-button"]');
      
      // Check success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Registration successful!');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Your study plan has been created');
      
      // Check redirect to dashboard or confirmation page
      await page.waitForURL('**/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome, John Doe');
    });

    test('should successfully register an international student', async ({ page }) => {
      // Fill out form for international student
      await page.fill('[data-testid="name-input"]', 'Jane Smith');
      await page.fill('[data-testid="email-input"]', 'jane.smith@example.com');
      await page.selectOption('[data-testid="grade-select"]', '10');
      await page.selectOption('[data-testid="country-select"]', 'CA');
      
      // Submit form
      await page.click('[data-testid="submit-button"]');
      
      // Check success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Registration successful!');
      await page.waitForURL('**/dashboard');
    });

    test('should create default study plan with correct schedule', async ({ page }) => {
      // Register student
      await page.fill('[data-testid="name-input"]', 'Test Student');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.selectOption('[data-testid="grade-select"]', '9');
      await page.selectOption('[data-testid="country-select"]', 'US');
      await page.selectOption('[data-testid="state-select"]', 'CA');
      await page.click('[data-testid="submit-button"]');
      
      // Navigate to study plan page
      await page.waitForURL('**/dashboard');
      await page.click('[data-testid="study-plan-link"]');
      
      // Check default schedule (Mon/Wed/Fri)
      await expect(page.locator('[data-testid="schedule-monday"]')).toBeChecked();
      await expect(page.locator('[data-testid="schedule-tuesday"]')).not.toBeChecked();
      await expect(page.locator('[data-testid="schedule-wednesday"]')).toBeChecked();
      await expect(page.locator('[data-testid="schedule-thursday"]')).not.toBeChecked();
      await expect(page.locator('[data-testid="schedule-friday"]')).toBeChecked();
      await expect(page.locator('[data-testid="schedule-saturday"]')).not.toBeChecked();
      await expect(page.locator('[data-testid="schedule-sunday"]')).not.toBeChecked();
      
      // Check sessions per week
      await expect(page.locator('[data-testid="sessions-per-week"]')).toContainText('3');
    });

    test('should handle email preference correctly', async ({ page }) => {
      // Test with email enabled (default)
      await page.fill('[data-testid="name-input"]', 'Email User');
      await page.fill('[data-testid="email-input"]', 'email@example.com');
      await page.selectOption('[data-testid="grade-select"]', '7');
      await page.selectOption('[data-testid="country-select"]', 'US');
      await page.selectOption('[data-testid="state-select"]', 'TX');
      // Email checkbox should be checked by default
      await page.click('[data-testid="submit-button"]');
      
      await page.waitForURL('**/dashboard');
      await page.click('[data-testid="preferences-link"]');
      await expect(page.locator('[data-testid="email-preference"]')).toContainText('Email notifications: Enabled');
      
      // Test with email disabled
      await page.goto('/register');
      await page.fill('[data-testid="name-input"]', 'No Email User');
      await page.fill('[data-testid="email-input"]', 'noemail@example.com');
      await page.selectOption('[data-testid="grade-select"]', '6');
      await page.selectOption('[data-testid="country-select"]', 'CA');
      await page.uncheck('[data-testid="receive-email-checkbox"]');
      await page.click('[data-testid="submit-button"]');
      
      await page.waitForURL('**/dashboard');
      await page.click('[data-testid="preferences-link"]');
      await expect(page.locator('[data-testid="email-preference"]')).toContainText('Email notifications: Disabled');
    });
  });

  test.describe('Duplicate Email Handling', () => {
    test('should prevent registration with existing email', async ({ page }) => {
      // First registration
      await page.fill('[data-testid="name-input"]', 'First User');
      await page.fill('[data-testid="email-input"]', 'duplicate@example.com');
      await page.selectOption('[data-testid="grade-select"]', '8');
      await page.selectOption('[data-testid="country-select"]', 'US');
      await page.selectOption('[data-testid="state-select"]', 'FL');
      await page.click('[data-testid="submit-button"]');
      
      await page.waitForURL('**/dashboard');
      
      // Try to register again with same email
      await page.goto('/register');
      await page.fill('[data-testid="name-input"]', 'Second User');
      await page.fill('[data-testid="email-input"]', 'duplicate@example.com');
      await page.selectOption('[data-testid="grade-select"]', '9');
      await page.selectOption('[data-testid="country-select"]', 'CA');
      await page.click('[data-testid="submit-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="email-error"]')).toContainText('A student with this email already exists');
      
      // Should remain on registration page
      await expect(page).toHaveURL(/.*\/register/);
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have proper labels and ARIA attributes', async ({ page }) => {
      // Check form labels
      await expect(page.locator('label[for="name"]')).toContainText('Full Name');
      await expect(page.locator('label[for="email"]')).toContainText('Email Address');
      await expect(page.locator('label[for="grade"]')).toContainText('Grade Level');
      await expect(page.locator('label[for="country"]')).toContainText('Country');
      
      // Check ARIA attributes
      await expect(page.locator('[data-testid="name-input"]')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('[data-testid="grade-select"]')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('[data-testid="country-select"]')).toHaveAttribute('aria-required', 'true');
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="name-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="grade-select"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="country-select"]')).toBeFocused();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state during form submission', async ({ page }) => {
      // Fill form
      await page.fill('[data-testid="name-input"]', 'Loading Test');
      await page.fill('[data-testid="email-input"]', 'loading@example.com');
      await page.selectOption('[data-testid="grade-select"]', '8');
      await page.selectOption('[data-testid="country-select"]', 'US');
      await page.selectOption('[data-testid="state-select"]', 'NY');
      
      // Submit and check loading state
      await page.click('[data-testid="submit-button"]');
      
      // Button should show loading state
      await expect(page.locator('[data-testid="submit-button"]')).toContainText('Creating Account...');
      await expect(page.locator('[data-testid="submit-button"]')).toBeDisabled();
      
      // Loading spinner should be visible
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/students/register', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      // Fill and submit form
      await page.fill('[data-testid="name-input"]', 'Error Test');
      await page.fill('[data-testid="email-input"]', 'error@example.com');
      await page.selectOption('[data-testid="grade-select"]', '8');
      await page.selectOption('[data-testid="country-select"]', 'CA');
      await page.click('[data-testid="submit-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Registration failed. Please try again.');
      
      // Form should be re-enabled
      await expect(page.locator('[data-testid="submit-button"]')).not.toBeDisabled();
    });

    test('should handle network errors', async ({ page }) => {
      // Mock network error
      await page.route('**/api/students/register', route => {
        route.abort('failed');
      });
      
      // Fill and submit form
      await page.fill('[data-testid="name-input"]', 'Network Error Test');
      await page.fill('[data-testid="email-input"]', 'network@example.com');
      await page.selectOption('[data-testid="grade-select"]', '8');
      await page.selectOption('[data-testid="country-select"]', 'US');
      await page.selectOption('[data-testid="state-select"]', 'CA');
      await page.click('[data-testid="submit-button"]');
      
      // Should show network error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error. Please check your connection and try again.');
    });
  });
});