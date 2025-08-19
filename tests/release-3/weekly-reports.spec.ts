import { test, expect } from '@playwright/test';

test.describe('Release 3.0: Weekly Reports System', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as student before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Weekly Report Generation', () => {
    test('should generate weekly report every Friday', async ({ page }) => {
      // Mock current date to be Friday
      await page.addInitScript(() => {
        const mockDate = new Date('2024-01-19T10:00:00Z'); // Friday
        Date.now = () => mockDate.getTime();
      });
      
      // Mock report generation
      let reportGenerated = false;
      await page.route('**/api/reports/weekly/generate', route => {
        reportGenerated = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            reportId: 'weekly-2024-01-19',
            generated: true,
            weekStart: '2024-01-15',
            weekEnd: '2024-01-19'
          })
        });
      });
      
      await page.goto('/dashboard/reports');
      
      // Should show latest weekly report
      await expect(page.locator('.weekly-report.latest')).toBeVisible();
      await expect(page.locator('text=Week of January 15-19, 2024')).toBeVisible();
    });

    test('should include all assignments from the week', async ({ page }) => {
      await page.goto('/dashboard/reports');
      
      // Open latest weekly report
      await page.click('.weekly-report:first-child');
      
      // Should show assignments summary
      await expect(page.locator('.assignments-summary')).toBeVisible();
      await expect(page.locator('.assignment-count')).toBeVisible();
      
      // Should list individual assignments
      const assignmentItems = page.locator('.assignment-item');
      await expect(assignmentItems).toHaveCount.greaterThan(0);
      
      // Each assignment should show key details
      await expect(assignmentItems.first().locator('.assignment-date')).toBeVisible();
      await expect(assignmentItems.first().locator('.assignment-score')).toBeVisible();
      await expect(assignmentItems.first().locator('.assignment-grade')).toBeVisible();
    });

    test('should calculate weekly performance metrics', async ({ page }) => {
      await page.goto('/dashboard/reports');
      await page.click('.weekly-report:first-child');
      
      // Should show performance metrics
      await expect(page.locator('.performance-metrics')).toBeVisible();
      await expect(page.locator('.average-score')).toBeVisible();
      await expect(page.locator('.total-questions')).toBeVisible();
      await expect(page.locator('.correct-answers')).toBeVisible();
      await expect(page.locator('.completion-rate')).toBeVisible();
      
      // Metrics should have valid values
      await expect(page.locator('.average-score')).toMatch(/\d+%/);
      await expect(page.locator('.completion-rate')).toMatch(/\d+%/);
    });

    test('should show subject breakdown', async ({ page }) => {
      await page.goto('/dashboard/reports');
      await page.click('.weekly-report:first-child');
      
      // Should show subject performance
      await expect(page.locator('.subject-breakdown')).toBeVisible();
      
      // Should show different subjects
      await expect(page.locator('.subject-math')).toBeVisible();
      await expect(page.locator('.subject-science')).toBeVisible();
      await expect(page.locator('.subject-english')).toBeVisible();
      
      // Each subject should show performance data
      await expect(page.locator('.subject-math .subject-score')).toMatch(/\d+%/);
      await expect(page.locator('.subject-math .questions-count')).toMatch(/\d+ questions/);
    });

    test('should include detailed explanations for incorrect answers', async ({ page }) => {
      await page.goto('/dashboard/reports');
      await page.click('.weekly-report:first-child');
      
      // Should show incorrect answers section
      await expect(page.locator('.incorrect-answers-section')).toBeVisible();
      await expect(page.locator('h3:has-text("Questions to Review")')).toBeVisible();
      
      // Should list incorrect questions with explanations
      const incorrectQuestions = page.locator('.incorrect-question');
      if (await incorrectQuestions.count() > 0) {
        await expect(incorrectQuestions.first().locator('.question-text')).toBeVisible();
        await expect(incorrectQuestions.first().locator('.your-answer')).toBeVisible();
        await expect(incorrectQuestions.first().locator('.correct-answer')).toBeVisible();
        await expect(incorrectQuestions.first().locator('.explanation')).toBeVisible();
      }
    });

    test('should show improvement suggestions', async ({ page }) => {
      await page.goto('/dashboard/reports');
      await page.click('.weekly-report:first-child');
      
      // Should show improvement section
      await expect(page.locator('.improvement-suggestions')).toBeVisible();
      await expect(page.locator('h3:has-text("Areas for Improvement")')).toBeVisible();
      
      // Should provide specific suggestions
      const suggestions = page.locator('.suggestion-item');
      if (await suggestions.count() > 0) {
        await expect(suggestions.first().locator('.suggestion-text')).toBeVisible();
        await expect(suggestions.first().locator('.subject-tag')).toBeVisible();
      }
    });
  });

  test.describe('Email Report Delivery', () => {
    test('should send weekly report via email when preference enabled', async ({ page }) => {
      // Ensure email preference is enabled
      await page.goto('/dashboard/settings');
      
      const emailCheckbox = page.locator('input[name="receiveEmails"]');
      if (!await emailCheckbox.isChecked()) {
        await emailCheckbox.click();
        await page.click('button:has-text("Save Settings")');
      }
      
      // Mock email service
      let emailSent = false;
      await page.route('**/api/email/send-weekly-report', route => {
        emailSent = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: true, 
            messageId: 'weekly-report-123',
            recipient: 'student@example.com'
          })
        });
      });
      
      // Trigger report generation
      await page.goto('/dashboard/reports');
      await page.click('button:has-text("Generate This Week\'s Report")');
      
      // Verify email was sent
      await page.waitForTimeout(1000);
      expect(emailSent).toBeTruthy();
      
      // Should show confirmation
      await expect(page.locator('text=Weekly report sent to your email')).toBeVisible();
    });

    test('should not send email when preference disabled', async ({ page }) => {
      // Disable email preference
      await page.goto('/dashboard/settings');
      
      const emailCheckbox = page.locator('input[name="receiveEmails"]');
      if (await emailCheckbox.isChecked()) {
        await emailCheckbox.click();
        await page.click('button:has-text("Save Settings")');
      }
      
      // Mock email service to track calls
      let emailSent = false;
      await page.route('**/api/email/send-weekly-report', route => {
        emailSent = true;
        route.fulfill({ status: 200, body: '{}' });
      });
      
      // Generate report
      await page.goto('/dashboard/reports');
      await page.click('button:has-text("Generate This Week\'s Report")');
      
      // Verify email was NOT sent
      await page.waitForTimeout(1000);
      expect(emailSent).toBeFalsy();
      
      // Should show in-app only message
      await expect(page.locator('text=Weekly report available in your dashboard')).toBeVisible();
    });

    test('should include all report sections in email format', async ({ page }) => {
      // Mock email content capture
      let emailContent = '';
      await page.route('**/api/email/send-weekly-report', route => {
        const request = route.request();
        const postData = request.postDataJSON();
        emailContent = postData.html;
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      await page.goto('/dashboard/reports');
      await page.click('button:has-text("Generate This Week\'s Report")');
      
      await page.waitForTimeout(1000);
      
      // Verify email content structure
      expect(emailContent).toContain('Weekly Study Report');
      expect(emailContent).toContain('Performance Summary');
      expect(emailContent).toContain('Subject Breakdown');
      expect(emailContent).toContain('Questions to Review');
      expect(emailContent).toContain('Areas for Improvement');
      expect(emailContent).toContain('Grade:'); // Letter grade
    });

    test('should handle email delivery failures gracefully', async ({ page }) => {
      // Mock email service failure
      await page.route('**/api/email/send-weekly-report', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Email service unavailable' })
        });
      });
      
      await page.goto('/dashboard/reports');
      await page.click('button:has-text("Generate This Week\'s Report")');
      
      // Should show fallback message
      await expect(page.locator('text=Report generated successfully')).toBeVisible();
      await expect(page.locator('text=Email delivery failed, but report is available in your dashboard')).toBeVisible();
    });

    test('should retry email delivery on failure', async ({ page }) => {
      let attemptCount = 0;
      
      await page.route('**/api/email/send-weekly-report', route => {
        attemptCount++;
        
        if (attemptCount === 1) {
          // First attempt fails
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Temporary failure' })
          });
        } else {
          // Second attempt succeeds
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        }
      });
      
      await page.goto('/dashboard/reports');
      await page.click('button:has-text("Generate This Week\'s Report")');
      
      // Should eventually succeed after retry
      await expect(page.locator('text=Weekly report sent to your email')).toBeVisible();
      expect(attemptCount).toBe(2);
    });
  });

  test.describe('Report History and Access', () => {
    test('should display list of past weekly reports', async ({ page }) => {
      await page.goto('/dashboard/reports');
      
      // Should show reports list
      await expect(page.locator('.reports-list')).toBeVisible();
      await expect(page.locator('h2:has-text("Weekly Reports")')).toBeVisible();
      
      // Should show multiple report entries
      const reportItems = page.locator('.report-item');
      await expect(reportItems).toHaveCount.greaterThan(0);
      
      // Each report should show key info
      await expect(reportItems.first().locator('.report-date')).toBeVisible();
      await expect(reportItems.first().locator('.report-grade')).toBeVisible();
      await expect(reportItems.first().locator('.assignments-count')).toBeVisible();
    });

    test('should allow viewing past report details', async ({ page }) => {
      await page.goto('/dashboard/reports');
      
      // Click on a past report
      await page.click('.report-item:nth-child(2)'); // Second report (not latest)
      
      // Should show detailed report view
      await expect(page).toHaveURL(/\/reports\/weekly\/\d+/);
      await expect(page.locator('.report-header')).toBeVisible();
      await expect(page.locator('.report-content')).toBeVisible();
      
      // Should show all report sections
      await expect(page.locator('.performance-metrics')).toBeVisible();
      await expect(page.locator('.subject-breakdown')).toBeVisible();
    });

    test('should filter reports by date range', async ({ page }) => {
      await page.goto('/dashboard/reports');
      
      // Apply date filter
      await page.fill('input[name="startDate"]', '2024-01-01');
      await page.fill('input[name="endDate"]', '2024-01-31');
      await page.click('button:has-text("Filter Reports")');
      
      // Should show filtered results
      const reportItems = page.locator('.report-item');
      const count = await reportItems.count();
      
      // Verify dates are within range
      for (let i = 0; i < count; i++) {
        const dateText = await reportItems.nth(i).locator('.report-date').textContent();
        const date = new Date(dateText || '');
        expect(date.getFullYear()).toBe(2024);
        expect(date.getMonth()).toBe(0); // January (0-indexed)
      }
    });

    test('should export report as PDF', async ({ page }) => {
      await page.goto('/dashboard/reports');
      await page.click('.report-item:first-child');
      
      // Should have export option
      await expect(page.locator('button:has-text("Export PDF")')).toBeVisible();
      
      // Mock PDF generation
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export PDF")');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/weekly-report.*\.pdf$/);
    });

    test('should show report statistics overview', async ({ page }) => {
      await page.goto('/dashboard/reports');
      
      // Should show overview statistics
      await expect(page.locator('.reports-overview')).toBeVisible();
      await expect(page.locator('.total-reports')).toBeVisible();
      await expect(page.locator('.average-grade')).toBeVisible();
      await expect(page.locator('.improvement-trend')).toBeVisible();
      
      // Statistics should have valid values
      await expect(page.locator('.total-reports')).toMatch(/\d+ reports/);
      await expect(page.locator('.average-grade')).toMatch(/[A-F]/);
    });
  });

  test.describe('Report Content Validation', () => {
    test('should handle weeks with no assignments', async ({ page }) => {
      // Mock week with no completed assignments
      await page.route('**/api/reports/weekly/*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            weekStart: '2024-01-15',
            weekEnd: '2024-01-19',
            assignments: [],
            totalQuestions: 0,
            correctAnswers: 0,
            averageScore: 0
          })
        });
      });
      
      await page.goto('/dashboard/reports');
      await page.click('.report-item:first-child');
      
      // Should show appropriate message
      await expect(page.locator('text=No assignments completed this week')).toBeVisible();
      await expect(page.locator('text=Keep up with your study schedule')).toBeVisible();
    });

    test('should handle weeks with partial assignments', async ({ page }) => {
      // Mock week with some incomplete assignments
      await page.route('**/api/reports/weekly/*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            weekStart: '2024-01-15',
            weekEnd: '2024-01-19',
            assignments: [
              { completed: true, score: 80 },
              { completed: false, score: null }
            ],
            completionRate: 50
          })
        });
      });
      
      await page.goto('/dashboard/reports');
      await page.click('.report-item:first-child');
      
      // Should show completion status
      await expect(page.locator('.completion-rate')).toContainText('50%');
      await expect(page.locator('text=1 assignment pending')).toBeVisible();
    });

    test('should calculate accurate grade trends', async ({ page }) => {
      await page.goto('/dashboard/reports');
      await page.click('.report-item:first-child');
      
      // Should show grade trend
      await expect(page.locator('.grade-trend')).toBeVisible();
      
      // Should show trend direction
      const trendIndicator = page.locator('.trend-indicator');
      await expect(trendIndicator).toBeVisible();
      
      const trendClass = await trendIndicator.getAttribute('class');
      expect(trendClass).toMatch(/(improving|declining|stable)/);
    });

    test('should validate report data consistency', async ({ page }) => {
      await page.goto('/dashboard/reports');
      await page.click('.report-item:first-child');
      
      // Get performance metrics
      const totalQuestions = await page.locator('.total-questions').textContent();
      const correctAnswers = await page.locator('.correct-answers').textContent();
      const averageScore = await page.locator('.average-score').textContent();
      
      // Validate data consistency
      const total = parseInt(totalQuestions?.replace(/\D/g, '') || '0');
      const correct = parseInt(correctAnswers?.replace(/\D/g, '') || '0');
      const percentage = parseInt(averageScore?.replace(/\D/g, '') || '0');
      
      expect(correct).toBeLessThanOrEqual(total);
      
      if (total > 0) {
        const calculatedPercentage = Math.round((correct / total) * 100);
        expect(Math.abs(percentage - calculatedPercentage)).toBeLessThanOrEqual(1); // Allow 1% rounding difference
      }
    });
  });

  test.describe('Report Scheduling and Automation', () => {
    test('should show next report generation date', async ({ page }) => {
      await page.goto('/dashboard/reports');
      
      // Should show next report info
      await expect(page.locator('.next-report-info')).toBeVisible();
      await expect(page.locator('.next-report-date')).toBeVisible();
      
      // Should show countdown or specific date
      const nextReportText = await page.locator('.next-report-date').textContent();
      expect(nextReportText).toMatch(/(Friday|in \d+ days|Tomorrow)/);
    });

    test('should allow manual report generation', async ({ page }) => {
      await page.goto('/dashboard/reports');
      
      // Should have manual generation option
      await expect(page.locator('button:has-text("Generate This Week\'s Report")')).toBeVisible();
      
      // Click to generate
      await page.click('button:has-text("Generate This Week\'s Report")');
      
      // Should show generation progress
      await expect(page.locator('text=Generating report...')).toBeVisible();
      
      // Should complete and show new report
      await expect(page.locator('text=Report generated successfully')).toBeVisible();
    });

    test('should prevent duplicate report generation for same week', async ({ page }) => {
      await page.goto('/dashboard/reports');
      
      // Try to generate report for current week twice
      await page.click('button:has-text("Generate This Week\'s Report")');
      await expect(page.locator('text=Report generated successfully')).toBeVisible();
      
      // Second attempt should show message
      await page.click('button:has-text("Generate This Week\'s Report")');
      await expect(page.locator('text=Report for this week already exists')).toBeVisible();
    });

    test('should handle timezone considerations for Friday delivery', async ({ page }) => {
      // Mock different timezone
      await page.addInitScript(() => {
        // Override timezone to test edge cases
        Intl.DateTimeFormat = function() {
          return {
            resolvedOptions: () => ({ timeZone: 'America/New_York' })
          };
        };
      });
      
      await page.goto('/dashboard/reports');
      
      // Should still show appropriate scheduling based on user timezone
      await expect(page.locator('.next-report-info')).toBeVisible();
      
      // Report timing should account for user's timezone
      const nextReportText = await page.locator('.next-report-date').textContent();
      expect(nextReportText).toBeTruthy();
    });
  });
});