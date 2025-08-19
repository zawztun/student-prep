import { test, expect } from '@playwright/test';

test.describe('Release 1.0: Email Preference Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page first
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Email Preference in Registration', () => {
    test('should have email preference checkbox checked by default', async ({ page }) => {
      // Email preference should be checked by default
      await expect(page.locator('input[name="receiveEmail"]')).toBeChecked();
      
      // Label should be clear
      await expect(page.locator('label[for="receiveEmail"]')).toContainText('Receive study sessions and reports via email');
    });

    test('should allow unchecking email preference', async ({ page }) => {
      // Uncheck email preference
      await page.uncheck('input[name="receiveEmail"]');
      await expect(page.locator('input[name="receiveEmail"]')).not.toBeChecked();
      
      // Check again
      await page.check('input[name="receiveEmail"]');
      await expect(page.locator('input[name="receiveEmail"]')).toBeChecked();
    });

    test('should register student with email preference enabled', async ({ page }) => {
      // Fill form with email preference enabled
      await page.fill('input[name="name"]', 'Email Enabled User');
      await page.selectOption('select[name="grade"]', '8');
      await page.fill('input[name="email"]', 'email.enabled@example.com');
      await page.selectOption('select[name="country"]', 'US');
      await page.selectOption('select[name="state"]', 'NY');
      
      // Ensure email preference is checked
      await page.check('input[name="receiveEmail"]');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check success message
      await expect(page.locator('text=Registration successful')).toBeVisible();
      await expect(page.locator('text=You will receive study sessions via email')).toBeVisible();
    });

    test('should register student with email preference disabled', async ({ page }) => {
      // Fill form with email preference disabled
      await page.fill('input[name="name"]', 'Email Disabled User');
      await page.selectOption('select[name="grade"]', '9');
      await page.fill('input[name="email"]', 'email.disabled@example.com');
      await page.selectOption('select[name="country"]', 'CA');
      
      // Uncheck email preference
      await page.uncheck('input[name="receiveEmail"]');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check success message
      await expect(page.locator('text=Registration successful')).toBeVisible();
      await expect(page.locator('text=You can access assignments through the web app')).toBeVisible();
    });
  });

  test.describe('Study Plan Channel Configuration', () => {
    test('should create study plan with EMAIL+IN_APP channels when email enabled', async ({ page }) => {
      // Mock API to capture study plan creation
      let studyPlanData: any = null;
      await page.route('/api/students', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();
        
        // Simulate successful registration and study plan creation
        studyPlanData = {
          channels: postData.receiveEmail ? ['EMAIL', 'IN_APP'] : ['IN_APP'],
          cadence: 'THREE_TIMES_WEEKLY',
          daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY']
        };
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            student: { id: 1, ...postData },
            studyPlan: studyPlanData
          })
        });
      });
      
      // Register with email enabled
      await page.fill('input[name="name"]', 'Channel Test User');
      await page.selectOption('select[name="grade"]', '7');
      await page.fill('input[name="email"]', 'channel.test@example.com');
      await page.selectOption('select[name="country"]', 'UK');
      await page.check('input[name="receiveEmail"]');
      
      await page.click('button[type="submit"]');
      
      // Verify success
      await expect(page.locator('text=Registration successful')).toBeVisible();
      
      // Study plan should have both channels
      expect(studyPlanData?.channels).toEqual(['EMAIL', 'IN_APP']);
    });

    test('should create study plan with IN_APP channel only when email disabled', async ({ page }) => {
      // Mock API to capture study plan creation
      let studyPlanData: any = null;
      await page.route('/api/students', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();
        
        studyPlanData = {
          channels: postData.receiveEmail ? ['EMAIL', 'IN_APP'] : ['IN_APP'],
          cadence: 'THREE_TIMES_WEEKLY',
          daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY']
        };
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            student: { id: 2, ...postData },
            studyPlan: studyPlanData
          })
        });
      });
      
      // Register with email disabled
      await page.fill('input[name="name"]', 'No Email User');
      await page.selectOption('select[name="grade"]', '10');
      await page.fill('input[name="email"]', 'no.email.test@example.com');
      await page.selectOption('select[name="country"]', 'AU');
      await page.uncheck('input[name="receiveEmail"]');
      
      await page.click('button[type="submit"]');
      
      // Verify success
      await expect(page.locator('text=Registration successful')).toBeVisible();
      
      // Study plan should have only IN_APP channel
      expect(studyPlanData?.channels).toEqual(['IN_APP']);
    });
  });

  test.describe('Email Preference Validation', () => {
    test('should not require email preference to be checked', async ({ page }) => {
      // Fill form without checking email preference
      await page.fill('input[name="name"]', 'Optional Email User');
      await page.selectOption('select[name="grade"]', '6');
      await page.fill('input[name="email"]', 'optional@example.com');
      await page.selectOption('select[name="country"]', 'DE');
      await page.uncheck('input[name="receiveEmail"]');
      
      // Form should submit successfully
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Registration successful')).toBeVisible();
    });

    test('should preserve email preference state during form validation errors', async ({ page }) => {
      // Uncheck email preference
      await page.uncheck('input[name="receiveEmail"]');
      
      // Submit form with missing required fields
      await page.click('button[type="submit"]');
      
      // Check validation errors appear
      await expect(page.locator('text=Name is required')).toBeVisible();
      
      // Email preference should remain unchecked
      await expect(page.locator('input[name="receiveEmail"]')).not.toBeChecked();
      
      // Check email preference
      await page.check('input[name="receiveEmail"]');
      
      // Submit again with missing fields
      await page.click('button[type="submit"]');
      
      // Email preference should remain checked
      await expect(page.locator('input[name="receiveEmail"]')).toBeChecked();
    });
  });

  test.describe('User Experience', () => {
    test('should show helpful text about email preference', async ({ page }) => {
      // Check for helpful description
      await expect(page.locator('text=Receive study sessions and weekly reports directly in your inbox')).toBeVisible();
      
      // Check for alternative access information
      await expect(page.locator('text=You can always access assignments through the web application')).toBeVisible();
    });

    test('should have clear visual indication of email preference state', async ({ page }) => {
      const checkbox = page.locator('input[name="receiveEmail"]');
      const label = page.locator('label[for="receiveEmail"]');
      
      // When checked, should have appropriate styling
      await page.check('input[name="receiveEmail"]');
      await expect(checkbox).toBeChecked();
      
      // When unchecked, should have different styling
      await page.uncheck('input[name="receiveEmail"]');
      await expect(checkbox).not.toBeChecked();
    });

    test('should be accessible via keyboard navigation', async ({ page }) => {
      // Navigate to email preference checkbox via keyboard
      await page.keyboard.press('Tab'); // Name
      await page.keyboard.press('Tab'); // Grade
      await page.keyboard.press('Tab'); // Email
      await page.keyboard.press('Tab'); // Country
      await page.keyboard.press('Tab'); // State (if visible)
      await page.keyboard.press('Tab'); // Email preference checkbox
      
      await expect(page.locator('input[name="receiveEmail"]')).toBeFocused();
      
      // Toggle with spacebar
      await page.keyboard.press('Space');
      await expect(page.locator('input[name="receiveEmail"]')).not.toBeChecked();
      
      await page.keyboard.press('Space');
      await expect(page.locator('input[name="receiveEmail"]')).toBeChecked();
    });
  });

  test.describe('Integration with Registration Flow', () => {
    test('should include email preference in form data submission', async ({ page }) => {
      let submittedData: any = null;
      
      // Intercept form submission
      await page.route('/api/students', async (route) => {
        submittedData = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, student: { id: 1 } })
        });
      });
      
      // Fill form with email preference enabled
      await page.fill('input[name="name"]', 'Integration Test');
      await page.selectOption('select[name="grade"]', '8');
      await page.fill('input[name="email"]', 'integration@example.com');
      await page.selectOption('select[name="country"]', 'US');
      await page.selectOption('select[name="state"]', 'CA');
      await page.check('input[name="receiveEmail"]');
      
      await page.click('button[type="submit"]');
      
      // Verify email preference is included in submission
      expect(submittedData?.receiveEmail).toBe(true);
    });

    test('should handle email preference in success message', async ({ page }) => {
      // Register with email enabled
      await page.fill('input[name="name"]', 'Success Message Test');
      await page.selectOption('select[name="grade"]', '9');
      await page.fill('input[name="email"]', 'success@example.com');
      await page.selectOption('select[name="country"]', 'FR');
      await page.check('input[name="receiveEmail"]');
      
      await page.click('button[type="submit"]');
      
      // Check for email-specific success message
      await expect(page.locator('text=Registration successful')).toBeVisible();
      await expect(page.locator('text=study sessions via email')).toBeVisible();
      
      // Register with email disabled
      await page.fill('input[name="name"]', 'No Email Success Test');
      await page.selectOption('select[name="grade"]', '11');
      await page.fill('input[name="email"]', 'no.email.success@example.com');
      await page.selectOption('select[name="country"]', 'JP');
      await page.uncheck('input[name="receiveEmail"]');
      
      await page.click('button[type="submit"]');
      
      // Check for web-app-specific success message
      await expect(page.locator('text=Registration successful')).toBeVisible();
      await expect(page.locator('text=web application')).toBeVisible();
    });
  });
});