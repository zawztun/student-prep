import { test, expect } from '@playwright/test';

test.describe('Release 2.0: Admin Question Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@studentprep.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test.describe('Admin Authentication', () => {
    test('should require admin login to access question management', async ({ page }) => {
      // Try to access admin area without login
      await page.goto('/admin/questions');
      
      // Should redirect to login
      await expect(page).toHaveURL('/admin/login');
      await expect(page.locator('text=Admin Login Required')).toBeVisible();
    });

    test('should reject invalid admin credentials', async ({ page }) => {
      await page.goto('/admin/login');
      
      // Try invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
      await expect(page).toHaveURL('/admin/login');
    });

    test('should allow admin logout', async ({ page }) => {
      // Should be logged in from beforeEach
      await expect(page).toHaveURL('/admin/dashboard');
      
      // Click logout
      await page.click('button:has-text("Logout")');
      
      // Should redirect to login
      await expect(page).toHaveURL('/admin/login');
    });
  });

  test.describe('Question Creation Interface', () => {
    test('should display question creation form with all fields', async ({ page }) => {
      await page.goto('/admin/questions/new');
      
      // Check all form fields are present
      await expect(page.locator('select[name="subject"]')).toBeVisible();
      await expect(page.locator('input[name="gradeMin"]')).toBeVisible();
      await expect(page.locator('input[name="gradeMax"]')).toBeVisible();
      await expect(page.locator('select[name="localeScope"]')).toBeVisible();
      await expect(page.locator('textarea[name="stem"]')).toBeVisible();
      await expect(page.locator('input[name="choice0"]')).toBeVisible();
      await expect(page.locator('input[name="choice1"]')).toBeVisible();
      await expect(page.locator('input[name="choice2"]')).toBeVisible();
      await expect(page.locator('input[name="choice3"]')).toBeVisible();
      await expect(page.locator('select[name="correctChoice"]')).toBeVisible();
      await expect(page.locator('textarea[name="explanation"]')).toBeVisible();
      await expect(page.locator('input[name="tags"]')).toBeVisible();
      await expect(page.locator('select[name="difficulty"]')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/admin/questions/new');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Check validation messages
      await expect(page.locator('text=Subject is required')).toBeVisible();
      await expect(page.locator('text=Grade range is required')).toBeVisible();
      await expect(page.locator('text=Question stem is required')).toBeVisible();
      await expect(page.locator('text=All choices are required')).toBeVisible();
      await expect(page.locator('text=Correct answer is required')).toBeVisible();
      await expect(page.locator('text=Explanation is required')).toBeVisible();
    });

    test('should validate grade range logic', async ({ page }) => {
      await page.goto('/admin/questions/new');
      
      // Set invalid grade range (min > max)
      await page.fill('input[name="gradeMin"]', '10');
      await page.fill('input[name="gradeMax"]', '5');
      
      await page.click('button[type="submit"]');
      
      // Check validation message
      await expect(page.locator('text=Minimum grade cannot be greater than maximum grade')).toBeVisible();
    });

    test('should create a new question successfully', async ({ page }) => {
      await page.goto('/admin/questions/new');
      
      // Fill out complete form
      await page.selectOption('select[name="subject"]', 'MATH');
      await page.fill('input[name="gradeMin"]', '8');
      await page.fill('input[name="gradeMax"]', '10');
      await page.selectOption('select[name="localeScope"]', 'GLOBAL');
      await page.fill('textarea[name="stem"]', 'What is 2 + 2?');
      await page.fill('input[name="choice0"]', '3');
      await page.fill('input[name="choice1"]', '4');
      await page.fill('input[name="choice2"]', '5');
      await page.fill('input[name="choice3"]', '6');
      await page.selectOption('select[name="correctChoice"]', '1');
      await page.fill('textarea[name="explanation"]', 'Basic addition: 2 + 2 = 4');
      await page.fill('input[name="tags"]', 'addition, basic-math');
      await page.selectOption('select[name="difficulty"]', 'EASY');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check success message and redirect
      await expect(page.locator('text=Question created successfully')).toBeVisible();
      await expect(page).toHaveURL('/admin/questions');
    });

    test('should handle locale scope configuration correctly', async ({ page }) => {
      await page.goto('/admin/questions/new');
      
      // Test different locale scope options
      const localeScopes = [
        { value: 'GLOBAL', label: 'Global' },
        { value: 'COUNTRY:US', label: 'United States' },
        { value: 'STATE:US-CA', label: 'California, US' }
      ];
      
      for (const scope of localeScopes) {
        await page.selectOption('select[name="localeScope"]', scope.value);
        
        // Verify selection
        const selectedValue = await page.locator('select[name="localeScope"]').inputValue();
        expect(selectedValue).toBe(scope.value);
      }
    });
  });

  test.describe('Question List Management', () => {
    test('should display list of existing questions', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Check table headers
      await expect(page.locator('th:has-text("Subject")')).toBeVisible();
      await expect(page.locator('th:has-text("Grade Range")')).toBeVisible();
      await expect(page.locator('th:has-text("Locale")')).toBeVisible();
      await expect(page.locator('th:has-text("Difficulty")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
      
      // Check for question rows
      await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
    });

    test('should filter questions by subject', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Apply subject filter
      await page.selectOption('select[name="subjectFilter"]', 'MATH');
      await page.click('button:has-text("Filter")');
      
      // All visible questions should be MATH
      const subjectCells = page.locator('td[data-subject]');
      const count = await subjectCells.count();
      
      for (let i = 0; i < count; i++) {
        const subject = await subjectCells.nth(i).textContent();
        expect(subject).toBe('MATH');
      }
    });

    test('should filter questions by grade range', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Apply grade filter
      await page.fill('input[name="gradeFilter"]', '8');
      await page.click('button:has-text("Filter")');
      
      // All visible questions should include grade 8 in their range
      const gradeRangeCells = page.locator('td[data-grade-range]');
      const count = await gradeRangeCells.count();
      
      for (let i = 0; i < count; i++) {
        const gradeRange = await gradeRangeCells.nth(i).textContent();
        // Grade range format: "5-10" or similar
        const [min, max] = gradeRange?.split('-').map(Number) || [0, 0];
        expect(min).toBeLessThanOrEqual(8);
        expect(max).toBeGreaterThanOrEqual(8);
      }
    });

    test('should search questions by content', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Search for specific content
      await page.fill('input[name="searchQuery"]', 'addition');
      await page.click('button:has-text("Search")');
      
      // Results should contain the search term
      const questionRows = page.locator('tbody tr');
      const count = await questionRows.count();
      
      expect(count).toBeGreaterThan(0);
      
      // At least one result should contain "addition"
      const hasAddition = await page.locator('text=addition').count() > 0;
      expect(hasAddition).toBeTruthy();
    });
  });

  test.describe('Question Editing', () => {
    test('should open question for editing', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Click edit button on first question
      await page.click('tbody tr:first-child button:has-text("Edit")');
      
      // Should navigate to edit page
      await expect(page).toHaveURL(/\/admin\/questions\/\d+\/edit/);
      
      // Form should be pre-filled with existing data
      await expect(page.locator('select[name="subject"]')).not.toHaveValue('');
      await expect(page.locator('textarea[name="stem"]')).not.toHaveValue('');
    });

    test('should update question successfully', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Edit first question
      await page.click('tbody tr:first-child button:has-text("Edit")');
      
      // Update the question stem
      await page.fill('textarea[name="stem"]', 'Updated question: What is 3 + 3?');
      await page.fill('input[name="choice1"]', '6');
      await page.fill('textarea[name="explanation"]', 'Updated explanation: 3 + 3 = 6');
      
      // Save changes
      await page.click('button[type="submit"]');
      
      // Check success message
      await expect(page.locator('text=Question updated successfully')).toBeVisible();
      await expect(page).toHaveURL('/admin/questions');
    });

    test('should preserve all data when editing', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Get original data from the list
      const originalStem = await page.locator('tbody tr:first-child td[data-stem]').textContent();
      
      // Edit the question
      await page.click('tbody tr:first-child button:has-text("Edit")');
      
      // Verify original data is loaded
      const loadedStem = await page.locator('textarea[name="stem"]').inputValue();
      expect(loadedStem).toContain(originalStem?.substring(0, 20) || '');
    });
  });

  test.describe('Question Deletion', () => {
    test('should show confirmation dialog before deletion', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Click delete button
      await page.click('tbody tr:first-child button:has-text("Delete")');
      
      // Check confirmation dialog
      await expect(page.locator('text=Are you sure you want to delete this question?')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      await expect(page.locator('button:has-text("Delete")')).toBeVisible();
    });

    test('should cancel deletion when user clicks cancel', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Count questions before deletion attempt
      const initialCount = await page.locator('tbody tr').count();
      
      // Try to delete but cancel
      await page.click('tbody tr:first-child button:has-text("Delete")');
      await page.click('button:has-text("Cancel")');
      
      // Question count should remain the same
      const finalCount = await page.locator('tbody tr').count();
      expect(finalCount).toBe(initialCount);
    });

    test('should delete question when confirmed', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Count questions before deletion
      const initialCount = await page.locator('tbody tr').count();
      
      // Delete first question
      await page.click('tbody tr:first-child button:has-text("Delete")');
      await page.click('button:has-text("Delete")');
      
      // Check success message
      await expect(page.locator('text=Question deleted successfully')).toBeVisible();
      
      // Question count should decrease
      const finalCount = await page.locator('tbody tr').count();
      expect(finalCount).toBe(initialCount - 1);
    });
  });

  test.describe('Bulk Operations', () => {
    test('should support bulk question import via CSV', async ({ page }) => {
      await page.goto('/admin/questions/import');
      
      // Check import interface
      await expect(page.locator('input[type="file"][accept=".csv"]')).toBeVisible();
      await expect(page.locator('text=Upload CSV file with questions')).toBeVisible();
      
      // Mock file upload
      const csvContent = `subject,grade_min,grade_max,locale_scope,stem,choice_0,choice_1,choice_2,choice_3,correct_choice,explanation,tags,difficulty
MATH,5,7,GLOBAL,"What is 4 + 4?",6,7,8,9,2,"4 + 4 = 8","addition,basic-math",EASY`;
      
      // Create a mock file
      await page.setInputFiles('input[type="file"]', {
        name: 'questions.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      });
      
      // Upload file
      await page.click('button:has-text("Import Questions")');
      
      // Check success message
      await expect(page.locator('text=Questions imported successfully')).toBeVisible();
    });

    test('should validate CSV format and show errors', async ({ page }) => {
      await page.goto('/admin/questions/import');
      
      // Upload invalid CSV
      const invalidCsv = `invalid,csv,format
missing,required,fields`;
      
      await page.setInputFiles('input[type="file"]', {
        name: 'invalid.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(invalidCsv)
      });
      
      await page.click('button:has-text("Import Questions")');
      
      // Check error message
      await expect(page.locator('text=Invalid CSV format')).toBeVisible();
      await expect(page.locator('text=Missing required columns')).toBeVisible();
    });

    test('should support bulk question export', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Check export functionality
      await expect(page.locator('button:has-text("Export All")')).toBeVisible();
      
      // Mock download
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export All")');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/questions.*\.csv$/);
    });
  });

  test.describe('Question Preview', () => {
    test('should show question preview in admin interface', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Click preview button
      await page.click('tbody tr:first-child button:has-text("Preview")');
      
      // Check preview modal
      await expect(page.locator('.modal .question-preview')).toBeVisible();
      await expect(page.locator('.question-stem')).toBeVisible();
      await expect(page.locator('.question-choices')).toBeVisible();
      await expect(page.locator('.correct-answer')).toBeVisible();
      await expect(page.locator('.explanation')).toBeVisible();
    });

    test('should highlight correct answer in preview', async ({ page }) => {
      await page.goto('/admin/questions');
      
      // Open preview
      await page.click('tbody tr:first-child button:has-text("Preview")');
      
      // Correct answer should be highlighted
      await expect(page.locator('.choice.correct')).toBeVisible();
      await expect(page.locator('.choice.correct')).toHaveClass(/correct/);
    });
  });

  test.describe('Question Analytics', () => {
    test('should display question usage statistics', async ({ page }) => {
      await page.goto('/admin/questions/analytics');
      
      // Check analytics dashboard
      await expect(page.locator('text=Question Usage Statistics')).toBeVisible();
      await expect(page.locator('.stat-card:has-text("Total Questions")')).toBeVisible();
      await expect(page.locator('.stat-card:has-text("Questions by Subject")')).toBeVisible();
      await expect(page.locator('.stat-card:has-text("Questions by Grade")')).toBeVisible();
      await expect(page.locator('.stat-card:has-text("Questions by Difficulty")')).toBeVisible();
    });

    test('should show question performance metrics', async ({ page }) => {
      await page.goto('/admin/questions/analytics');
      
      // Check performance metrics
      await expect(page.locator('text=Average Correct Rate')).toBeVisible();
      await expect(page.locator('text=Most Difficult Questions')).toBeVisible();
      await expect(page.locator('text=Most Popular Questions')).toBeVisible();
    });
  });
});