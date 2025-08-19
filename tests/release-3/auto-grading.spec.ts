import { test, expect } from '@playwright/test';

test.describe('Release 3.0: Auto-Grading System', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as student before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Immediate Grading on Submission', () => {
    test('should calculate score immediately after submission', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Answer questions with known correct/incorrect answers
      await page.click('.question:nth-child(1) input[value="A"]'); // Assume A is correct
      await page.click('.question:nth-child(2) input[value="B"]'); // Assume B is incorrect
      await page.click('.question:nth-child(3) input[value="C"]'); // Assume C is correct
      
      // Submit assignment
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Should immediately show score
      await expect(page.locator('.score-display')).toBeVisible();
      await expect(page.locator('.score-percentage')).toMatch(/\d+%/);
      await expect(page.locator('.score-fraction')).toMatch(/\d+ \/ \d+/);
    });

    test('should show correct/incorrect status for each question', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Complete assignment
      const questions = page.locator('.question');
      const questionCount = await questions.count();
      
      for (let i = 0; i < questionCount; i++) {
        await questions.nth(i).locator('input').first().click();
      }
      
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Check individual question results
      for (let i = 0; i < questionCount; i++) {
        const questionResult = page.locator(`.question-result:nth-child(${i + 1})`);
        
        // Should show correct or incorrect status
        const statusIcon = questionResult.locator('.status-icon');
        await expect(statusIcon).toBeVisible();
        
        const isCorrect = await statusIcon.getAttribute('class');
        expect(isCorrect).toMatch(/(correct|incorrect)/);
      }
    });

    test('should display explanations for all questions', async ({ page }) => {
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
      
      // Check explanations are shown
      for (let i = 0; i < questionCount; i++) {
        const explanation = page.locator(`.question-result:nth-child(${i + 1}) .explanation`);
        await expect(explanation).toBeVisible();
        await expect(explanation).not.toBeEmpty();
      }
    });

    test('should highlight correct answers', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Complete assignment
      await page.click('.question:first-child input[value="A"]');
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Correct answer should be highlighted
      await expect(page.locator('.question-result:first-child .correct-answer')).toBeVisible();
      await expect(page.locator('.question-result:first-child .correct-answer')).toHaveClass(/highlighted/);
    });

    test('should show student selected answer vs correct answer', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Select an answer
      await page.click('.question:first-child input[value="B"]');
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Should show both selected and correct answers
      const questionResult = page.locator('.question-result:first-child');
      await expect(questionResult.locator('.your-answer')).toBeVisible();
      await expect(questionResult.locator('.correct-answer')).toBeVisible();
      
      // Should clearly distinguish between them
      await expect(questionResult.locator('.your-answer')).toContainText('Your answer: B');
      await expect(questionResult.locator('.correct-answer')).toContainText('Correct answer:');
    });
  });

  test.describe('Letter Grade Calculation', () => {
    test('should assign correct letter grade based on percentage', async ({ page }) => {
      // Mock assignment with known score
      await page.route('**/api/assignments/*/submit', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            score: 4,
            totalQuestions: 5,
            percentage: 80,
            letterGrade: 'B',
            results: []
          })
        });
      });
      
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Complete assignment
      await page.click('.question:first-child input[value="A"]');
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Should show correct letter grade
      await expect(page.locator('.letter-grade')).toContainText('B');
      await expect(page.locator('.percentage')).toContainText('80%');
    });

    test('should use standard grading scale', async ({ page }) => {
      const gradingTests = [
        { percentage: 95, expectedGrade: 'A' },
        { percentage: 85, expectedGrade: 'B' },
        { percentage: 75, expectedGrade: 'C' },
        { percentage: 65, expectedGrade: 'D' },
        { percentage: 55, expectedGrade: 'F' }
      ];
      
      for (const test of gradingTests) {
        // Mock different scores
        await page.route('**/api/assignments/*/submit', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              percentage: test.percentage,
              letterGrade: test.expectedGrade,
              results: []
            })
          });
        });
        
        await page.goto('/dashboard');
        await page.click('.assignment-card:first-child');
        await page.click('.question:first-child input[value="A"]');
        await page.click('button:has-text("Submit Assignment")');
        await page.click('button:has-text("Yes, Submit")');
        
        // Verify grade
        await expect(page.locator('.letter-grade')).toContainText(test.expectedGrade);
        
        // Reset for next test
        await page.goto('/dashboard');
      }
    });

    test('should handle perfect score (100%)', async ({ page }) => {
      await page.route('**/api/assignments/*/submit', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            score: 5,
            totalQuestions: 5,
            percentage: 100,
            letterGrade: 'A',
            results: []
          })
        });
      });
      
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Complete assignment
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Should show perfect score
      await expect(page.locator('.letter-grade')).toContainText('A');
      await expect(page.locator('.percentage')).toContainText('100%');
      await expect(page.locator('.perfect-score-message')).toBeVisible();
    });

    test('should handle zero score (0%)', async ({ page }) => {
      await page.route('**/api/assignments/*/submit', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            score: 0,
            totalQuestions: 5,
            percentage: 0,
            letterGrade: 'F',
            results: []
          })
        });
      });
      
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Submit without answering
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Should show failing grade
      await expect(page.locator('.letter-grade')).toContainText('F');
      await expect(page.locator('.percentage')).toContainText('0%');
    });
  });

  test.describe('Grade Storage and History', () => {
    test('should save grade to student record', async ({ page }) => {
      let gradeSaved = false;
      
      await page.route('**/api/assignments/*/submit', route => {
        gradeSaved = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            score: 4,
            totalQuestions: 5,
            percentage: 80,
            letterGrade: 'B',
            saved: true
          })
        });
      });
      
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      await page.click('.question:first-child input[value="A"]');
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Verify grade was saved
      expect(gradeSaved).toBeTruthy();
      await expect(page.locator('text=Grade saved successfully')).toBeVisible();
    });

    test('should display grade in assignment history', async ({ page }) => {
      // Complete an assignment first
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      await page.click('.question:first-child input[value="A"]');
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Go to history page
      await page.goto('/dashboard/history');
      
      // Should show the grade in history
      await expect(page.locator('.history-item:first-child .grade')).toBeVisible();
      await expect(page.locator('.history-item:first-child .grade')).toMatch(/[A-F]/);
      await expect(page.locator('.history-item:first-child .percentage')).toMatch(/\d+%/);
    });

    test('should calculate GPA from multiple assignments', async ({ page }) => {
      // Mock multiple completed assignments
      await page.route('**/api/students/*/gpa', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            gpa: 3.2,
            totalAssignments: 5,
            averagePercentage: 82
          })
        });
      });
      
      await page.goto('/dashboard/progress');
      
      // Should show GPA calculation
      await expect(page.locator('.gpa-display')).toBeVisible();
      await expect(page.locator('.gpa-value')).toContainText('3.2');
      await expect(page.locator('.assignments-count')).toContainText('5 assignments');
    });
  });

  test.describe('Grading Edge Cases', () => {
    test('should handle partial submissions', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Answer only some questions
      await page.click('.question:nth-child(1) input[value="A"]');
      await page.click('.question:nth-child(3) input[value="C"]');
      // Leave question 2 unanswered
      
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Should handle unanswered questions
      await expect(page.locator('.question-result:nth-child(2) .unanswered')).toBeVisible();
      await expect(page.locator('.question-result:nth-child(2) .status-icon.incorrect')).toBeVisible();
    });

    test('should handle multiple choice validation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Try to select multiple answers for same question (should not be allowed)
      await page.click('.question:first-child input[value="A"]');
      await page.click('.question:first-child input[value="B"]');
      
      // Only one should be selected
      const checkedInputs = page.locator('.question:first-child input:checked');
      await expect(checkedInputs).toHaveCount(1);
    });

    test('should handle server errors during grading', async ({ page }) => {
      // Mock server error
      await page.route('**/api/assignments/*/submit', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Grading service unavailable' })
        });
      });
      
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      await page.click('.question:first-child input[value="A"]');
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Should show error message
      await expect(page.locator('text=Grading failed')).toBeVisible();
      await expect(page.locator('text=Please try again later')).toBeVisible();
      
      // Should offer retry option
      await expect(page.locator('button:has-text("Retry Grading")')).toBeVisible();
    });

    test('should retry grading on failure', async ({ page }) => {
      let attemptCount = 0;
      
      await page.route('**/api/assignments/*/submit', route => {
        attemptCount++;
        
        if (attemptCount === 1) {
          // First attempt fails
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          // Second attempt succeeds
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              score: 3,
              totalQuestions: 5,
              percentage: 60,
              letterGrade: 'D'
            })
          });
        }
      });
      
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      await page.click('.question:first-child input[value="A"]');
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // First attempt should fail
      await expect(page.locator('text=Grading failed')).toBeVisible();
      
      // Retry
      await page.click('button:has-text("Retry Grading")');
      
      // Second attempt should succeed
      await expect(page.locator('.letter-grade')).toContainText('D');
      await expect(page.locator('.percentage')).toContainText('60%');
    });
  });

  test.describe('Performance and Feedback', () => {
    test('should provide performance insights', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Complete assignment
      await page.click('.question:first-child input[value="A"]');
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Should show performance insights
      await expect(page.locator('.performance-insights')).toBeVisible();
      await expect(page.locator('.strengths')).toBeVisible();
      await expect(page.locator('.areas-for-improvement')).toBeVisible();
    });

    test('should show subject-specific performance', async ({ page }) => {
      await page.goto('/dashboard/progress');
      
      // Should show breakdown by subject
      await expect(page.locator('.subject-performance')).toBeVisible();
      await expect(page.locator('.subject-math')).toBeVisible();
      await expect(page.locator('.subject-science')).toBeVisible();
      await expect(page.locator('.subject-english')).toBeVisible();
      
      // Each subject should show average grade
      await expect(page.locator('.subject-math .average-grade')).toMatch(/[A-F]/);
    });

    test('should track improvement over time', async ({ page }) => {
      await page.goto('/dashboard/progress');
      
      // Should show improvement indicators
      await expect(page.locator('.improvement-trend')).toBeVisible();
      await expect(page.locator('.trend-indicator')).toBeVisible();
      
      // Should show trend direction (up/down/stable)
      const trendIcon = page.locator('.trend-icon');
      await expect(trendIcon).toBeVisible();
      
      const trendClass = await trendIcon.getAttribute('class');
      expect(trendClass).toMatch(/(trending-up|trending-down|trending-stable)/);
    });

    test('should provide study recommendations', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('.assignment-card:first-child');
      
      // Complete assignment with mixed results
      await page.click('.question:first-child input[value="A"]'); // Correct
      await page.click('.question:nth-child(2) input[value="B"]'); // Incorrect
      await page.click('button:has-text("Submit Assignment")');
      await page.click('button:has-text("Yes, Submit")');
      
      // Should show study recommendations
      await expect(page.locator('.study-recommendations')).toBeVisible();
      await expect(page.locator('.recommended-topics')).toBeVisible();
      await expect(page.locator('text=Focus on these areas')).toBeVisible();
    });
  });
});