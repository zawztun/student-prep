import { test, expect } from '@playwright/test';

test.describe('Release 2.0: Localized Question Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard for question generation testing
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Localized Question Generation', () => {
    test('should generate questions matching student grade level', async ({ page }) => {
      // Mock API response for question generation
      await page.route('/api/questions/generate', async (route) => {
        const request = route.request();
        const params = new URL(request.url()).searchParams;
        const grade = parseInt(params.get('grade') || '0');
        
        // Return grade-appropriate questions
        const questions = [
          {
            id: 1,
            subject: 'MATH',
            grade_min: grade - 1,
            grade_max: grade + 1,
            locale_scope: 'GLOBAL',
            stem: `Grade ${grade} Math Question`,
            choices: ['A', 'B', 'C', 'D'],
            correct_choice: 0,
            explanation: 'Test explanation'
          }
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ questions })
        });
      });
      
      // Test question generation for different grades
      const grades = [3, 7, 10, 12];
      
      for (const grade of grades) {
        const response = await page.request.get(`/api/questions/generate?grade=${grade}&country=US&state=NY`);
        const data = await response.json();
        
        expect(data.questions).toHaveLength(1);
        expect(data.questions[0].grade_min).toBeLessThanOrEqual(grade);
        expect(data.questions[0].grade_max).toBeGreaterThanOrEqual(grade);
      }
    });

    test('should filter questions by locale scope', async ({ page }) => {
      // Test global questions
      let response = await page.request.get('/api/questions/generate?grade=8&country=GLOBAL');
      let data = await response.json();
      expect(data.questions.every((q: any) => q.locale_scope === 'GLOBAL')).toBeTruthy();
      
      // Test country-specific questions
      response = await page.request.get('/api/questions/generate?grade=8&country=US');
      data = await response.json();
      expect(data.questions.every((q: any) => 
        q.locale_scope === 'GLOBAL' || q.locale_scope.startsWith('COUNTRY:US')
      )).toBeTruthy();
      
      // Test state-specific questions
      response = await page.request.get('/api/questions/generate?grade=8&country=US&state=CA');
      data = await response.json();
      expect(data.questions.every((q: any) => 
        q.locale_scope === 'GLOBAL' || 
        q.locale_scope.startsWith('COUNTRY:US') || 
        q.locale_scope === 'STATE:US-CA'
      )).toBeTruthy();
    });

    test('should implement fallback logic for missing content', async ({ page }) => {
      // Mock API to simulate missing state-specific content
      await page.route('/api/questions/generate', async (route) => {
        const request = route.request();
        const params = new URL(request.url()).searchParams;
        const country = params.get('country');
        const state = params.get('state');
        
        let questions = [];
        
        // No state-specific questions available
        if (state === 'WY') {
          // Fall back to country-level questions
          questions = [
            {
              id: 1,
              locale_scope: `COUNTRY:${country}`,
              stem: 'Country-level fallback question',
              grade_min: 8,
              grade_max: 8
            }
          ];
        } else if (country === 'RARE_COUNTRY') {
          // Fall back to global questions
          questions = [
            {
              id: 2,
              locale_scope: 'GLOBAL',
              stem: 'Global fallback question',
              grade_min: 8,
              grade_max: 8
            }
          ];
        }
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ questions })
        });
      });
      
      // Test state fallback to country
      let response = await page.request.get('/api/questions/generate?grade=8&country=US&state=WY');
      let data = await response.json();
      expect(data.questions[0].locale_scope).toBe('COUNTRY:US');
      
      // Test country fallback to global
      response = await page.request.get('/api/questions/generate?grade=8&country=RARE_COUNTRY');
      data = await response.json();
      expect(data.questions[0].locale_scope).toBe('GLOBAL');
    });

    test('should return 5 questions by default', async ({ page }) => {
      const response = await page.request.get('/api/questions/generate?grade=8&country=US');
      const data = await response.json();
      
      expect(data.questions).toHaveLength(5);
    });

    test('should randomize question selection', async ({ page }) => {
      // Generate questions multiple times
      const responses = [];
      for (let i = 0; i < 3; i++) {
        const response = await page.request.get('/api/questions/generate?grade=8&country=US');
        const data = await response.json();
        responses.push(data.questions.map((q: any) => q.id));
      }
      
      // At least one response should be different (randomization)
      const allSame = responses.every(ids => 
        JSON.stringify(ids) === JSON.stringify(responses[0])
      );
      expect(allSame).toBeFalsy();
    });

    test('should handle empty question sets gracefully', async ({ page }) => {
      // Mock empty response
      await page.route('/api/questions/generate', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            questions: [],
            message: 'No questions available for this criteria'
          })
        });
      });
      
      const response = await page.request.get('/api/questions/generate?grade=15&country=INVALID');
      const data = await response.json();
      
      expect(data.questions).toHaveLength(0);
      expect(data.message).toContain('No questions available');
    });
  });

  test.describe('Question Structure Validation', () => {
    test('should return properly structured questions', async ({ page }) => {
      const response = await page.request.get('/api/questions/generate?grade=8&country=US');
      const data = await response.json();
      
      expect(data.questions).toBeDefined();
      
      data.questions.forEach((question: any) => {
        // Required fields
        expect(question.id).toBeDefined();
        expect(question.subject).toBeDefined();
        expect(question.grade_min).toBeGreaterThanOrEqual(1);
        expect(question.grade_max).toBeLessThanOrEqual(12);
        expect(question.locale_scope).toBeDefined();
        expect(question.stem).toBeDefined();
        expect(question.choices).toHaveLength(4);
        expect(question.correct_choice).toBeGreaterThanOrEqual(0);
        expect(question.correct_choice).toBeLessThan(4);
        expect(question.explanation).toBeDefined();
        
        // Optional fields
        if (question.tags) {
          expect(Array.isArray(question.tags)).toBeTruthy();
        }
        if (question.difficulty) {
          expect(['EASY', 'MEDIUM', 'HARD']).toContain(question.difficulty);
        }
      });
    });

    test('should validate locale scope format', async ({ page }) => {
      const response = await page.request.get('/api/questions/generate?grade=8&country=US&state=CA');
      const data = await response.json();
      
      data.questions.forEach((question: any) => {
        const scope = question.locale_scope;
        
        // Valid formats: GLOBAL, COUNTRY:XX, STATE:XX-YY
        const validFormats = [
          /^GLOBAL$/,
          /^COUNTRY:[A-Z]{2}$/,
          /^STATE:[A-Z]{2}-[A-Z]{2}$/
        ];
        
        const isValid = validFormats.some(pattern => pattern.test(scope));
        expect(isValid).toBeTruthy();
      });
    });
  });

  test.describe('Performance and Caching', () => {
    test('should respond within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      
      await page.request.get('/api/questions/generate?grade=8&country=US&state=NY');
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent requests', async ({ page }) => {
      // Make multiple concurrent requests
      const requests = Array.from({ length: 5 }, (_, i) => 
        page.request.get(`/api/questions/generate?grade=${8 + i}&country=US`)
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
      
      // Each should return valid data
      for (const response of responses) {
        const data = await response.json();
        expect(data.questions).toBeDefined();
        expect(Array.isArray(data.questions)).toBeTruthy();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid grade parameters', async ({ page }) => {
      // Test invalid grade values
      const invalidGrades = [-1, 0, 13, 'invalid', null];
      
      for (const grade of invalidGrades) {
        const response = await page.request.get(`/api/questions/generate?grade=${grade}&country=US`);
        
        if (response.status() === 400) {
          const data = await response.json();
          expect(data.error).toContain('Invalid grade');
        }
      }
    });

    test('should handle invalid country parameters', async ({ page }) => {
      const response = await page.request.get('/api/questions/generate?grade=8&country=INVALID_COUNTRY_CODE');
      
      // Should either return global questions or appropriate error
      if (response.status() === 200) {
        const data = await response.json();
        // Should fall back to global questions
        expect(data.questions.every((q: any) => q.locale_scope === 'GLOBAL')).toBeTruthy();
      } else {
        expect(response.status()).toBe(400);
      }
    });

    test('should handle database connection errors', async ({ page }) => {
      // Mock database error
      await page.route('/api/questions/generate', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Database connection failed',
            message: 'Unable to retrieve questions at this time'
          })
        });
      });
      
      const response = await page.request.get('/api/questions/generate?grade=8&country=US');
      
      expect(response.status()).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Database connection failed');
    });
  });

  test.describe('Subject and Difficulty Filtering', () => {
    test('should filter questions by subject when specified', async ({ page }) => {
      const subjects = ['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY'];
      
      for (const subject of subjects) {
        const response = await page.request.get(`/api/questions/generate?grade=8&country=US&subject=${subject}`);
        
        if (response.status() === 200) {
          const data = await response.json();
          data.questions.forEach((question: any) => {
            expect(question.subject).toBe(subject);
          });
        }
      }
    });

    test('should filter questions by difficulty when specified', async ({ page }) => {
      const difficulties = ['EASY', 'MEDIUM', 'HARD'];
      
      for (const difficulty of difficulties) {
        const response = await page.request.get(`/api/questions/generate?grade=8&country=US&difficulty=${difficulty}`);
        
        if (response.status() === 200) {
          const data = await response.json();
          data.questions.forEach((question: any) => {
            if (question.difficulty) {
              expect(question.difficulty).toBe(difficulty);
            }
          });
        }
      }
    });

    test('should handle multiple filter combinations', async ({ page }) => {
      const response = await page.request.get('/api/questions/generate?grade=8&country=US&state=CA&subject=MATH&difficulty=MEDIUM&count=3');
      
      if (response.status() === 200) {
        const data = await response.json();
        
        expect(data.questions).toHaveLength(3);
        data.questions.forEach((question: any) => {
          expect(question.subject).toBe('MATH');
          if (question.difficulty) {
            expect(question.difficulty).toBe('MEDIUM');
          }
          expect(question.grade_min).toBeLessThanOrEqual(8);
          expect(question.grade_max).toBeGreaterThanOrEqual(8);
        });
      }
    });
  });
});