import { test, expect } from '@playwright/test';

test.describe('Release 2.0: Question Bank Management', () => {
  test.beforeEach(async ({ page }) => {
    // Use admin authentication state
    await page.goto('/admin/login');
    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/admin/dashboard');
  });

  test.describe('Question Creation', () => {
    test('should create a new multiple choice question successfully', async ({ page }) => {
      // Navigate to question creation
      await page.click('[data-testid="question-bank-link"]');
      await page.click('[data-testid="create-question-button"]');
      
      // Fill out question form
      await page.fill('[data-testid="question-stem"]', 'What is the capital of France?');
      await page.selectOption('[data-testid="subject-select"]', 'GEOGRAPHY');
      await page.fill('[data-testid="grade-min"]', '6');
      await page.fill('[data-testid="grade-max"]', '12');
      await page.selectOption('[data-testid="locale-scope"]', 'GLOBAL');
      await page.selectOption('[data-testid="difficulty"]', 'EASY');
      
      // Add multiple choice options
      await page.fill('[data-testid="choice-0"]', 'London');
      await page.fill('[data-testid="choice-1"]', 'Paris');
      await page.fill('[data-testid="choice-2"]', 'Berlin');
      await page.fill('[data-testid="choice-3"]', 'Madrid');
      
      // Set correct answer
      await page.selectOption('[data-testid="correct-answer"]', '1'); // Paris
      
      // Add explanation
      await page.fill('[data-testid="explanation"]', 'Paris is the capital and largest city of France.');
      
      // Add tags
      await page.fill('[data-testid="tags"]', 'geography, capitals, europe, france');
      
      // Submit form
      await page.click('[data-testid="save-question-button"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Question created successfully');
      
      // Verify redirect to question list
      await expect(page).toHaveURL(/\/admin\/questions$/);
      
      // Verify question appears in list
      await expect(page.locator('[data-testid="question-list"]')).toContainText('What is the capital of France?');
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      await page.click('[data-testid="create-question-button"]');
      
      // Try to submit without required fields
      await page.click('[data-testid="save-question-button"]');
      
      // Check validation errors
      await expect(page.locator('[data-testid="stem-error"]')).toContainText('Question stem is required');
      await expect(page.locator('[data-testid="subject-error"]')).toContainText('Subject is required');
      await expect(page.locator('[data-testid="grade-min-error"]')).toContainText('Minimum grade is required');
      await expect(page.locator('[data-testid="grade-max-error"]')).toContainText('Maximum grade is required');
      await expect(page.locator('[data-testid="correct-answer-error"]')).toContainText('Correct answer is required');
    });

    test('should validate grade range logic', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      await page.click('[data-testid="create-question-button"]');
      
      // Set invalid grade range (min > max)
      await page.fill('[data-testid="grade-min"]', '10');
      await page.fill('[data-testid="grade-max"]', '5');
      
      await page.click('[data-testid="save-question-button"]');
      
      await expect(page.locator('[data-testid="grade-range-error"]')).toContainText('Minimum grade cannot be greater than maximum grade');
    });

    test('should validate choice requirements for multiple choice questions', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      await page.click('[data-testid="create-question-button"]');
      
      // Fill basic info
      await page.fill('[data-testid="question-stem"]', 'Test question');
      await page.selectOption('[data-testid="subject-select"]', 'MATH');
      await page.fill('[data-testid="grade-min"]', '5');
      await page.fill('[data-testid="grade-max"]', '8');
      
      // Leave choices empty
      await page.click('[data-testid="save-question-button"]');
      
      await expect(page.locator('[data-testid="choices-error"]')).toContainText('At least 2 choices are required');
    });

    test('should handle locale scope selection correctly', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      await page.click('[data-testid="create-question-button"]');
      
      // Test US state selection
      await page.selectOption('[data-testid="locale-scope"]', 'STATE');
      await page.selectOption('[data-testid="country-select"]', 'US');
      await page.selectOption('[data-testid="state-select"]', 'CA');
      
      // Verify locale scope is set correctly
      const localeDisplay = await page.locator('[data-testid="locale-display"]').textContent();
      expect(localeDisplay).toContain('STATE:US-CA');
      
      // Test country level
      await page.selectOption('[data-testid="locale-scope"]', 'COUNTRY');
      await page.selectOption('[data-testid="country-select"]', 'CA');
      
      const countryLocaleDisplay = await page.locator('[data-testid="locale-display"]').textContent();
      expect(countryLocaleDisplay).toContain('COUNTRY:CA');
      
      // Test global
      await page.selectOption('[data-testid="locale-scope"]', 'GLOBAL');
      
      const globalLocaleDisplay = await page.locator('[data-testid="locale-display"]').textContent();
      expect(globalLocaleDisplay).toContain('GLOBAL');
    });
  });

  test.describe('Question Editing', () => {
    test('should edit existing question successfully', async ({ page }) => {
      // Navigate to question list
      await page.click('[data-testid="question-bank-link"]');
      
      // Click edit on first question
      await page.click('[data-testid="edit-question-0"]');
      
      // Modify question stem
      await page.fill('[data-testid="question-stem"]', 'Updated: What is the capital of France?');
      
      // Modify explanation
      await page.fill('[data-testid="explanation"]', 'Updated explanation: Paris is the capital and largest city of France, known for its culture and history.');
      
      // Save changes
      await page.click('[data-testid="save-question-button"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Question updated successfully');
      
      // Verify changes in question list
      await expect(page.locator('[data-testid="question-list"]')).toContainText('Updated: What is the capital of France?');
    });

    test('should preserve existing data when editing', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      await page.click('[data-testid="edit-question-0"]');
      
      // Verify existing data is loaded
      const stem = await page.locator('[data-testid="question-stem"]').inputValue();
      expect(stem).toBeTruthy();
      
      const choice0 = await page.locator('[data-testid="choice-0"]').inputValue();
      expect(choice0).toBeTruthy();
      
      const gradeMin = await page.locator('[data-testid="grade-min"]').inputValue();
      expect(parseInt(gradeMin)).toBeGreaterThanOrEqual(1);
      
      const gradeMax = await page.locator('[data-testid="grade-max"]').inputValue();
      expect(parseInt(gradeMax)).toBeLessThanOrEqual(12);
    });

    test('should handle concurrent editing conflicts', async ({ page, context }) => {
      // Open question in first tab
      await page.click('[data-testid="question-bank-link"]');
      await page.click('[data-testid="edit-question-0"]');
      
      // Open same question in second tab
      const page2 = await context.newPage();
      await page2.goto('/admin/questions');
      await page2.click('[data-testid="edit-question-0"]');
      
      // Edit in first tab
      await page.fill('[data-testid="question-stem"]', 'First tab edit');
      await page.click('[data-testid="save-question-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Question updated successfully');
      
      // Try to edit in second tab
      await page2.fill('[data-testid="question-stem"]', 'Second tab edit');
      await page2.click('[data-testid="save-question-button"]');
      
      // Should show conflict warning
      await expect(page2.locator('[data-testid="conflict-warning"]')).toContainText('This question has been modified by another user');
    });
  });

  test.describe('Question Deletion', () => {
    test('should delete question with confirmation', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Get initial question count
      const initialCount = await page.locator('[data-testid="question-row"]').count();
      
      // Click delete on first question
      await page.click('[data-testid="delete-question-0"]');
      
      // Confirm deletion in modal
      await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-confirmation-text"]')).toContainText('Are you sure you want to delete this question?');
      
      await page.click('[data-testid="confirm-delete-button"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Question deleted successfully');
      
      // Verify question count decreased
      const finalCount = await page.locator('[data-testid="question-row"]').count();
      expect(finalCount).toBe(initialCount - 1);
    });

    test('should cancel deletion when user clicks cancel', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      const initialCount = await page.locator('[data-testid="question-row"]').count();
      
      await page.click('[data-testid="delete-question-0"]');
      await page.click('[data-testid="cancel-delete-button"]');
      
      // Modal should close
      await expect(page.locator('[data-testid="delete-confirmation-modal"]')).not.toBeVisible();
      
      // Question count should remain the same
      const finalCount = await page.locator('[data-testid="question-row"]').count();
      expect(finalCount).toBe(initialCount);
    });

    test('should prevent deletion of questions used in active assignments', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Try to delete a question that's in use
      await page.click('[data-testid="delete-question-in-use"]');
      
      // Should show warning instead of confirmation
      await expect(page.locator('[data-testid="deletion-blocked-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="deletion-blocked-text"]')).toContainText('This question cannot be deleted because it is currently used in active assignments');
    });
  });

  test.describe('Question Filtering and Search', () => {
    test('should filter questions by subject', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Apply math filter
      await page.selectOption('[data-testid="subject-filter"]', 'MATH');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Verify all visible questions are math questions
      const questionRows = await page.locator('[data-testid="question-row"]').all();
      for (const row of questionRows) {
        const subject = await row.locator('[data-testid="question-subject"]').textContent();
        expect(subject).toBe('MATH');
      }
    });

    test('should filter questions by grade range', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Filter for grade 8 questions
      await page.selectOption('[data-testid="grade-filter"]', '8');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Verify all questions include grade 8 in their range
      const questionRows = await page.locator('[data-testid="question-row"]').all();
      for (const row of questionRows) {
        const gradeMin = await row.locator('[data-testid="grade-min"]').textContent();
        const gradeMax = await row.locator('[data-testid="grade-max"]').textContent();
        
        expect(parseInt(gradeMin || '0')).toBeLessThanOrEqual(8);
        expect(parseInt(gradeMax || '0')).toBeGreaterThanOrEqual(8);
      }
    });

    test('should filter questions by locale scope', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Filter for US questions
      await page.selectOption('[data-testid="locale-filter"]', 'COUNTRY:US');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Verify all questions are US-specific or global
      const questionRows = await page.locator('[data-testid="question-row"]').all();
      for (const row of questionRows) {
        const localeScope = await row.locator('[data-testid="locale-scope"]').textContent();
        expect(localeScope).toMatch(/(COUNTRY:US|STATE:US-|GLOBAL)/);
      }
    });

    test('should search questions by text content', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Search for questions containing "capital"
      await page.fill('[data-testid="search-input"]', 'capital');
      await page.click('[data-testid="search-button"]');
      
      // Verify search results contain the search term
      const questionRows = await page.locator('[data-testid="question-row"]').all();
      expect(questionRows.length).toBeGreaterThan(0);
      
      for (const row of questionRows) {
        const questionText = await row.locator('[data-testid="question-stem"]').textContent();
        expect(questionText?.toLowerCase()).toContain('capital');
      }
    });

    test('should combine multiple filters', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Apply multiple filters
      await page.selectOption('[data-testid="subject-filter"]', 'GEOGRAPHY');
      await page.selectOption('[data-testid="grade-filter"]', '8');
      await page.selectOption('[data-testid="difficulty-filter"]', 'EASY');
      await page.fill('[data-testid="search-input"]', 'capital');
      
      await page.click('[data-testid="apply-filters-button"]');
      
      // Verify results match all criteria
      const questionRows = await page.locator('[data-testid="question-row"]').all();
      
      for (const row of questionRows) {
        const subject = await row.locator('[data-testid="question-subject"]').textContent();
        const difficulty = await row.locator('[data-testid="question-difficulty"]').textContent();
        const questionText = await row.locator('[data-testid="question-stem"]').textContent();
        const gradeMin = await row.locator('[data-testid="grade-min"]').textContent();
        const gradeMax = await row.locator('[data-testid="grade-max"]').textContent();
        
        expect(subject).toBe('GEOGRAPHY');
        expect(difficulty).toBe('EASY');
        expect(questionText?.toLowerCase()).toContain('capital');
        expect(parseInt(gradeMin || '0')).toBeLessThanOrEqual(8);
        expect(parseInt(gradeMax || '0')).toBeGreaterThanOrEqual(8);
      }
    });

    test('should clear filters', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Apply filters
      await page.selectOption('[data-testid="subject-filter"]', 'MATH');
      await page.fill('[data-testid="search-input"]', 'algebra');
      await page.click('[data-testid="apply-filters-button"]');
      
      const filteredCount = await page.locator('[data-testid="question-row"]').count();
      
      // Clear filters
      await page.click('[data-testid="clear-filters-button"]');
      
      // Verify all questions are shown again
      const totalCount = await page.locator('[data-testid="question-row"]').count();
      expect(totalCount).toBeGreaterThan(filteredCount);
      
      // Verify filter inputs are cleared
      const subjectFilter = await page.locator('[data-testid="subject-filter"]').inputValue();
      const searchInput = await page.locator('[data-testid="search-input"]').inputValue();
      
      expect(subjectFilter).toBe('');
      expect(searchInput).toBe('');
    });
  });

  test.describe('Bulk Operations', () => {
    test('should select multiple questions for bulk operations', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Select first three questions
      await page.check('[data-testid="select-question-0"]');
      await page.check('[data-testid="select-question-1"]');
      await page.check('[data-testid="select-question-2"]');
      
      // Verify bulk actions toolbar appears
      await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible();
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('3 questions selected');
    });

    test('should bulk delete selected questions', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      const initialCount = await page.locator('[data-testid="question-row"]').count();
      
      // Select questions
      await page.check('[data-testid="select-question-0"]');
      await page.check('[data-testid="select-question-1"]');
      
      // Bulk delete
      await page.click('[data-testid="bulk-delete-button"]');
      await page.click('[data-testid="confirm-bulk-delete-button"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('2 questions deleted successfully');
      
      // Verify count decreased
      const finalCount = await page.locator('[data-testid="question-row"]').count();
      expect(finalCount).toBe(initialCount - 2);
    });

    test('should bulk update question properties', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Select questions
      await page.check('[data-testid="select-question-0"]');
      await page.check('[data-testid="select-question-1"]');
      
      // Open bulk edit modal
      await page.click('[data-testid="bulk-edit-button"]');
      
      // Update difficulty for selected questions
      await page.selectOption('[data-testid="bulk-difficulty-select"]', 'HARD');
      await page.click('[data-testid="apply-bulk-changes-button"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('2 questions updated successfully');
      
      // Verify changes applied
      const firstQuestionDifficulty = await page.locator('[data-testid="question-row"]:first-child [data-testid="question-difficulty"]').textContent();
      const secondQuestionDifficulty = await page.locator('[data-testid="question-row"]:nth-child(2) [data-testid="question-difficulty"]').textContent();
      
      expect(firstQuestionDifficulty).toBe('HARD');
      expect(secondQuestionDifficulty).toBe('HARD');
    });

    test('should select all questions with select all checkbox', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      const totalCount = await page.locator('[data-testid="question-row"]').count();
      
      // Click select all
      await page.check('[data-testid="select-all-questions"]');
      
      // Verify all questions are selected
      const selectedCheckboxes = await page.locator('[data-testid^="select-question-"]:checked').count();
      expect(selectedCheckboxes).toBe(totalCount);
      
      // Verify bulk actions toolbar shows correct count
      await expect(page.locator('[data-testid="selected-count"]')).toContainText(`${totalCount} questions selected`);
    });
  });

  test.describe('Question Import/Export', () => {
    test('should import questions from CSV file', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Click import button
      await page.click('[data-testid="import-questions-button"]');
      
      // Upload CSV file
      const fileInput = page.locator('[data-testid="csv-file-input"]');
      await fileInput.setInputFiles('tests/fixtures/sample-questions.csv');
      
      // Start import
      await page.click('[data-testid="start-import-button"]');
      
      // Wait for import to complete
      await expect(page.locator('[data-testid="import-success-message"]')).toContainText('Questions imported successfully');
      
      // Verify import summary
      await expect(page.locator('[data-testid="import-summary"]')).toContainText('5 questions imported');
      await expect(page.locator('[data-testid="import-summary"]')).toContainText('0 errors');
    });

    test('should handle CSV import validation errors', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      await page.click('[data-testid="import-questions-button"]');
      
      // Upload invalid CSV file
      const fileInput = page.locator('[data-testid="csv-file-input"]');
      await fileInput.setInputFiles('tests/fixtures/invalid-questions.csv');
      
      await page.click('[data-testid="start-import-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="import-errors"]')).toBeVisible();
      await expect(page.locator('[data-testid="import-errors"]')).toContainText('Row 2: Missing required field "stem"');
      await expect(page.locator('[data-testid="import-errors"]')).toContainText('Row 3: Invalid grade range');
    });

    test('should export questions to CSV', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Apply filters to export specific questions
      await page.selectOption('[data-testid="subject-filter"]', 'MATH');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Start download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-questions-button"]');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/questions-export-.*\.csv/);
      
      // Verify export success message
      await expect(page.locator('[data-testid="export-success-message"]')).toContainText('Questions exported successfully');
    });
  });

  test.describe('Question Analytics and Insights', () => {
    test('should display question usage statistics', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Click on analytics tab
      await page.click('[data-testid="analytics-tab"]');
      
      // Verify analytics dashboard elements
      await expect(page.locator('[data-testid="total-questions-stat"]')).toBeVisible();
      await expect(page.locator('[data-testid="questions-by-subject-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="questions-by-grade-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="questions-by-difficulty-chart"]')).toBeVisible();
      
      // Verify specific statistics
      const totalQuestions = await page.locator('[data-testid="total-questions-count"]').textContent();
      expect(parseInt(totalQuestions || '0')).toBeGreaterThan(0);
    });

    test('should show question performance metrics', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // View individual question performance
      await page.click('[data-testid="view-analytics-0"]');
      
      // Verify performance metrics
      await expect(page.locator('[data-testid="question-analytics-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="times-used-stat"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-score-stat"]')).toBeVisible();
      await expect(page.locator('[data-testid="difficulty-rating-stat"]')).toBeVisible();
      
      // Verify performance chart
      await expect(page.locator('[data-testid="performance-over-time-chart"]')).toBeVisible();
    });

    test('should identify questions needing review', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      await page.click('[data-testid="analytics-tab"]');
      
      // Check for questions with low performance
      await page.click('[data-testid="low-performance-questions-tab"]');
      
      // Verify low-performing questions are listed
      const lowPerformanceQuestions = await page.locator('[data-testid="low-performance-question"]').count();
      
      if (lowPerformanceQuestions > 0) {
        // Verify each question shows performance indicators
        const firstLowPerformanceQuestion = page.locator('[data-testid="low-performance-question"]').first();
        await expect(firstLowPerformanceQuestion.locator('[data-testid="average-score"]')).toBeVisible();
        await expect(firstLowPerformanceQuestion.locator('[data-testid="review-suggestion"]')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility and UX', () => {
    test('should have proper accessibility attributes', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Check form accessibility
      await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute('aria-label', 'Search questions');
      await expect(page.locator('[data-testid="subject-filter"]')).toHaveAttribute('aria-label', 'Filter by subject');
      await expect(page.locator('[data-testid="grade-filter"]')).toHaveAttribute('aria-label', 'Filter by grade');
      
      // Check table accessibility
      await expect(page.locator('[data-testid="questions-table"]')).toHaveAttribute('role', 'table');
      await expect(page.locator('[data-testid="questions-table"] thead')).toHaveAttribute('role', 'rowgroup');
      
      // Check button accessibility
      await expect(page.locator('[data-testid="create-question-button"]')).toHaveAttribute('aria-label', 'Create new question');
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Navigate through interface with keyboard
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="subject-filter"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="grade-filter"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="apply-filters-button"]')).toBeFocused();
      
      // Should be able to activate buttons with Enter/Space
      await page.keyboard.press('Enter');
      // Filter should be applied
    });

    test('should provide helpful loading states', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Apply filter that takes time to process
      await page.selectOption('[data-testid="subject-filter"]', 'MATH');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Should show loading state
      await expect(page.locator('[data-testid="questions-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="apply-filters-button"]')).toBeDisabled();
      
      // Wait for loading to complete
      await page.waitForSelector('[data-testid="questions-loading"]', { state: 'hidden' });
      await expect(page.locator('[data-testid="apply-filters-button"]')).toBeEnabled();
    });

    test('should handle empty states gracefully', async ({ page }) => {
      await page.click('[data-testid="question-bank-link"]');
      
      // Apply filter that returns no results
      await page.fill('[data-testid="search-input"]', 'nonexistentquestiontext12345');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Should show empty state
      await expect(page.locator('[data-testid="no-questions-found"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-questions-message"]')).toContainText('No questions found matching your criteria');
      await expect(page.locator('[data-testid="clear-filters-suggestion"]')).toContainText('Try clearing your filters or adjusting your search terms');
    });
  });
});