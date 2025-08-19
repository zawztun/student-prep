import { test, expect } from '@playwright/test';

test.describe('Release 3.0: Assignment Delivery & Scheduling', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as student before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Automated Study Session Scheduling', () => {
    test('should display default study schedule (Mon/Wed/Fri)', async ({ page }) => {
      await page.goto('/dashboard/schedule');
      
      // Check default schedule display
      await expect(page.locator('text=Study Schedule')).toBeVisible();
      await expect(page.locator('.schedule-day:has-text("Monday")')).toBeVisible();
      await expect(page.locator('.schedule-day:has-text("Wednesday")')).toBeVisible();
      await expect(page.locator('.schedule-day:has-text("Friday")')).toBeVisible();
      
      // Check schedule times
      await expect(page.locator('text=Morning Sessions')).toBeVisible();
    });

    test('should show next scheduled assignment', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check next assignment info
      await expect(page.locator('.next-assignment')).toBeVisible();
      await expect(page.locator('.next-assignment .date')).toBeVisible();
      await expect(page.locator('.next-assignment .time')).toBeVisible();
      
      // Should show countdown or "Available Now" status
      const status = page.locator('.next-assignment .status');
      await expect(status).toBeVisible();
    });

    test('should create assignment automatically on scheduled days', async ({ page }) => {
      // Mock current time to be a scheduled day (Monday morning)
      await page.addInitScript(() => {
        const mockDate = new Date('2024-01-15T09:00:00Z'); // Monday
        Date.now = () => mockDate.getTime();
      });
      
      await page.goto('/dashboard');
      
      // Should have a new assignment available
      await expect(page.locator('.available-assignments')).toBeVisible();
      await expect(page.locator('.assignment-card')).toHaveCount.greaterThan(0);
      
      // Assignment should be for today
      const today = new Date().toLocaleDateString();
      await expect(page.locator(`.assignment-card:has-text("${today}")`)).toBeVisible();
    });

    test('should handle no available questions gracefully', async ({ page }) => {
      // Mock scenario where no questions are available for student profile
      await page.route('**/api/questions/generate', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ questions: [] })
        });
      });
      
      await page.goto('/dashboard');
      
      // Should show appropriate message
      await expect(page.locator('text=Content is being prepared')).toBeVisible();
      await expect(page.locator('text=Your next assignment will be available soon')).toBeVisible();
    });

    test('should reschedule assignment when content unavailable', async ({ page }) => {
      // Mock failed question generation
      await page.route('**/api/assignments/create', route => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'No questions available',
            rescheduled: true,
            nextAttempt: '2024-01-16T09:00:00Z'
          })
        });
      });
      
      await page.goto('/dashboard');
      
      // Should show rescheduling message
      await expect(page.locator('text=Assignment rescheduled')).toBeVisible();
      await expect(page.locator('text=Next attempt: Tomorrow at 9:00 AM')).toBeVisible();
    });
  });

  test.describe('Email Assignment Delivery', () => {
    test('should send email when student has email preference enabled', async ({ page }) => {
      // Check email preference is enabled
      await page.goto('/dashboard/settings');
      
      const emailCheckbox = page.locator('input[name="receiveEmails"]');
      await expect(emailCheckbox).toBeChecked();
      
      // Mock email service
      let emailSent = false;
      await page.route('**/api/email/send-assignment', route => {
        emailSent = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, messageId: 'test-123' })
        });
      });
      
      // Trigger assignment creation
      await page.goto('/dashboard');
      await page.click('button:has-text("Generate New Assignment")');
      
      // Verify email was sent
      await page.waitForTimeout(1000); // Wait for async email
      expect(emailSent).toBeTruthy();
      
      // Should show confirmation
      await expect(page.locator('text=Assignment sent to your email')).toBeVisible();
    });

    test('should not send email when preference is disabled', async ({ page }) => {
      // Disable email preference
      await page.goto('/dashboard/settings');
      
      const emailCheckbox = page.locator('input[name="receiveEmails"]');
      if (await emailCheckbox.isChecked()) {
        await emailCheckbox.click();
        await page.click('button:has-text("Save Settings")');
      }
      
      // Mock email service to track calls
      let emailSent = false;
      await page.route('**/api/email/send-assignment', route => {
        emailSent = true;
        route.fulfill({ status: 200, body: '{}' });
      });
      
      // Trigger assignment creation
      await page.goto('/dashboard');
      await page.click('button:has-text("Generate New Assignment")');
      
      // Verify email was NOT sent
      await page.waitForTimeout(1000);
      expect(emailSent).toBeFalsy();
      
      // Should show in-app only message
      await expect(page.locator('text=Assignment available in your dashboard')).toBeVisible();
    });

    test('should handle email delivery failures gracefully', async ({ page }) => {
      // Mock email service failure
      await page.route('**/api/email/send-assignment', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Email service unavailable' })
        });
      });
      
      await page.goto('/dashboard');
      await page.click('button:has-text("Generate New Assignment")');
      
      // Should show fallback message
      await expect(page.locator('text=Assignment created successfully')).toBeVisible();
      await expect(page.locator('text=Email delivery failed, but assignment is available in your dashboard')).toBeVisible();
    });

    test('should include all question details in email format', async ({ page }) => {
      // Mock email content capture
      let emailContent = '';
      await page.route('**/api/email/send-assignment', route => {
        const request = route.request();
        const postData = request.postDataJSON();
        emailContent = postData.html;
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      await page.goto('/dashboard');
      await page.click('button:has-text("Generate New Assignment")');
      
      await page.waitForTimeout(1000);
      
      // Verify email content structure
      expect(emailContent).toContain('Study Assignment');
      expect(emailContent).toContain('Question 1');
      expect(emailContent).toContain('A)'); // Multiple choice options
      expect(emailContent).toContain('B)');
      expect(emailContent).toContain('C)');
      expect(emailContent).toContain('D)');
    });
  });

  test.describe('In-App Assignment Access', () => {
    test('should display list of available assignments', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check assignments section
      await expect(page.locator('.assignments-section')).toBeVisible();
      await expect(page.locator('h2:has-text("Available Assignments")')).toBeVisible();
      
      // Should show assignment cards
      const assignmentCards = page.locator('.assignment-card');
      await expect(assignmentCards).toHaveCount.greaterThan(0);
      
      // Each card should have essential info
      await expect(assignmentCards.first().locator('.assignment-date')).toBeVisible();
      await expect(assignmentCards.first().locator('.assignment-status')).toBeVisible();
      await expect(assignmentCards.first().locator('.question-count')).toBeVisible();
    });

    test('should show assignment details when clicked', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click on first assignment
      await page.click('.assignment-card:first-child');
      
      // Should navigate to assignment page
      await expect(page).toHaveURL(/\/assignments\/\d+/);
      
      // Should show assignment details
      await expect(page.locator('.assignment-header')).toBeVisible();
      await expect(page.locator('.assignment-instructions')).toBeVisible();
      await expect(page.locator('.question-list')).toBeVisible();
    });

    test('should display timer for timed assignments', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Check for timer (if assignment is timed)
      const timer = page.locator('.assignment-timer');
      if (await timer.isVisible()) {
        await expect(timer.locator('.time-remaining')).toBeVisible();
        await expect(timer.locator('.timer-display')).toMatch(/\d{2}:\d{2}/);
      }
    });

    test('should save answers as user progresses', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Answer first question
      await page.click('.question:first-child input[value="A"]');
      
      // Wait for auto-save
      await page.waitForTimeout(1000);
      
      // Refresh page
      await page.reload();
      
      // Answer should be preserved
      await expect(page.locator('.question:first-child input[value="A"]')).toBeChecked();
    });

    test('should show progress indicator', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Check progress indicator
      await expect(page.locator('.progress-indicator')).toBeVisible();
      await expect(page.locator('.progress-bar')).toBeVisible();
      await expect(page.locator('.progress-text')).toMatch(/\d+ of \d+ questions/);
      
      // Answer a question and check progress update
      await page.click('.question:first-child input[value="A"]');
      
      // Progress should update
      await expect(page.locator('.progress-text')).toMatch(/1 of \d+ questions/);
    });

    test('should submit assignment and show results', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Answer all questions
      const questions = page.locator('.question');
      const questionCount = await questions.count();
      
      for (let i = 0; i < questionCount; i++) {
        await questions.nth(i).locator('input[value="A"]').click();
      }
      
      // Submit assignment
      await page.click('button:has-text("Submit Assignment")');
      
      // Should show confirmation dialog
      await expect(page.locator('text=Submit Assignment?')).toBeVisible();
      await page.click('button:has-text("Yes, Submit")');
      
      // Should show results page
      await expect(page).toHaveURL(/\/assignments\/\d+\/results/);
      await expect(page.locator('.assignment-results')).toBeVisible();
      await expect(page.locator('.score-display')).toBeVisible();
    });

    test('should show immediate feedback after submission', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Complete and submit assignment
      const questions = page.locator('.question');
      const questionCount = await questions.count();
      
      for (let i = 0; i < questionCount; i++) {
        await questions.nth(i).locator('input').first().click();
      }
      
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Check immediate feedback
      await expect(page.locator('.correct-answers')).toBeVisible();
      await expect(page.locator('.incorrect-answers')).toBeVisible();
      await expect(page.locator('.explanations')).toBeVisible();
      
      // Each question should show correct/incorrect status
      for (let i = 0; i < questionCount; i++) {
        const questionResult = page.locator(`.question-result:nth-child(${i + 1})`);
        await expect(questionResult.locator('.status-icon')).toBeVisible();
        await expect(questionResult.locator('.explanation')).toBeVisible();
      }
    });
  });

  test.describe('Assignment Status Management', () => {
    test('should track assignment completion status', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check different assignment statuses
      await expect(page.locator('.assignment-card.status-pending')).toBeVisible();
      
      // Complete an assignment
      await page.click('.assignment-card.status-pending:first-child');
      
      // Answer and submit
      await page.click('.question:first-child input[value="A"]');
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Return to dashboard
      await page.goto('/dashboard');
      
      // Assignment should now show as completed
      await expect(page.locator('.assignment-card.status-completed')).toBeVisible();
    });

    test('should show assignment expiration warnings', async ({ page }) => {
      // Mock assignment with near expiration
      await page.route('**/api/assignments', route => {
        const assignments = [{
          id: 1,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          status: 'PENDING',
          questionCount: 5
        }];
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(assignments)
        });
      });
      
      await page.goto('/dashboard');
      
      // Should show expiration warning
      await expect(page.locator('.assignment-card .expiration-warning')).toBeVisible();
      await expect(page.locator('text=Expires in 2 hours')).toBeVisible();
    });

    test('should handle expired assignments', async ({ page }) => {
      // Mock expired assignment
      await page.route('**/api/assignments', route => {
        const assignments = [{
          id: 1,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          status: 'EXPIRED',
          questionCount: 5
        }];
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(assignments)
        });
      });
      
      await page.goto('/dashboard');
      
      // Should show expired status
      await expect(page.locator('.assignment-card.status-expired')).toBeVisible();
      await expect(page.locator('text=Expired')).toBeVisible();
      
      // Should not be clickable
      const expiredCard = page.locator('.assignment-card.status-expired');
      await expect(expiredCard).toHaveClass(/disabled/);
    });
  });

  test.describe('Assignment History', () => {
    test('should display completed assignments history', async ({ page }) => {
      await page.goto('/dashboard/history');
      
      // Check history page
      await expect(page.locator('h1:has-text("Assignment History")')).toBeVisible();
      await expect(page.locator('.history-list')).toBeVisible();
      
      // Should show completed assignments
      const historyItems = page.locator('.history-item');
      await expect(historyItems).toHaveCount.greaterThan(0);
      
      // Each item should show key details
      await expect(historyItems.first().locator('.assignment-date')).toBeVisible();
      await expect(historyItems.first().locator('.score')).toBeVisible();
      await expect(historyItems.first().locator('.grade')).toBeVisible();
    });

    test('should allow viewing past assignment results', async ({ page }) => {
      await page.goto('/dashboard/history');
      
      // Click on a completed assignment
      await page.click('.history-item:first-child .view-results');
      
      // Should show detailed results
      await expect(page).toHaveURL(/\/assignments\/\d+\/results/);
      await expect(page.locator('.assignment-results')).toBeVisible();
      await expect(page.locator('.question-breakdown')).toBeVisible();
    });

    test('should filter history by date range', async ({ page }) => {
      await page.goto('/dashboard/history');
      
      // Apply date filter
      await page.fill('input[name="startDate"]', '2024-01-01');
      await page.fill('input[name="endDate"]', '2024-01-31');
      await page.click('button:has-text("Filter")');
      
      // Results should be filtered
      const historyItems = page.locator('.history-item');
      const count = await historyItems.count();
      
      // Verify dates are within range
      for (let i = 0; i < count; i++) {
        const dateText = await historyItems.nth(i).locator('.assignment-date').textContent();
        const date = new Date(dateText || '');
        expect(date.getFullYear()).toBe(2024);
        expect(date.getMonth()).toBe(0); // January (0-indexed)
      }
    });

    test('should show performance trends', async ({ page }) => {
      await page.goto('/dashboard/history');
      
      // Check performance section
      await expect(page.locator('.performance-trends')).toBeVisible();
      await expect(page.locator('.average-score')).toBeVisible();
      await expect(page.locator('.improvement-indicator')).toBeVisible();
      
      // Should show chart or graph
      await expect(page.locator('.performance-chart')).toBeVisible();
    });
  });

  test.describe('Notification System', () => {
    test('should show in-app notifications for new assignments', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check notification area
      await expect(page.locator('.notifications')).toBeVisible();
      
      // Should show new assignment notification
      await expect(page.locator('.notification.assignment-ready')).toBeVisible();
      await expect(page.locator('text=New assignment available')).toBeVisible();
    });

    test('should show assignment reminder notifications', async ({ page }) => {
      // Mock assignment due soon
      await page.route('**/api/notifications', route => {
        const notifications = [{
          id: 1,
          type: 'ASSIGNMENT_REMINDER',
          message: 'Assignment due in 2 hours',
          createdAt: new Date().toISOString(),
          read: false
        }];
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(notifications)
        });
      });
      
      await page.goto('/dashboard');
      
      // Should show reminder notification
      await expect(page.locator('.notification.reminder')).toBeVisible();
      await expect(page.locator('text=Assignment due in 2 hours')).toBeVisible();
    });

    test('should mark notifications as read when clicked', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click on notification
      const notification = page.locator('.notification:first-child');
      await notification.click();
      
      // Should be marked as read
      await expect(notification).toHaveClass(/read/);
    });
  });
});