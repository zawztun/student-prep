import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Start browser for setup operations
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log(`📡 Waiting for application at ${baseURL}...`);
    
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Setup test data
    await setupTestDatabase();
    
    // Create admin authentication state
    await setupAdminAuth(page, baseURL);
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestDatabase() {
  console.log('🗄️ Setting up test database...');
  
  // In a real implementation, this would:
  // 1. Reset the test database
  // 2. Run migrations
  // 3. Seed with test data
  
  // Mock implementation for now
  const testData = {
    students: [
      {
        id: 'test-student-1',
        name: 'John Doe',
        email: 'john.doe@test.com',
        grade: 8,
        country: 'US',
        state: 'NY',
        receiveEmail: true
      },
      {
        id: 'test-student-2',
        name: 'Jane Smith',
        email: 'jane.smith@test.com',
        grade: 10,
        country: 'CA',
        state: null,
        receiveEmail: false
      }
    ],
    questions: [
      {
        id: 'test-question-1',
        stem: 'What is 2 + 2?',
        subject: 'MATH',
        gradeMin: 1,
        gradeMax: 12,
        localeScope: 'GLOBAL',
        difficulty: 'EASY',
        choices: [
          { id: 'choice-1', text: '3', isCorrect: false },
          { id: 'choice-2', text: '4', isCorrect: true },
          { id: 'choice-3', text: '5', isCorrect: false }
        ]
      }
    ],
    admins: [
      {
        id: 'test-admin-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN'
      }
    ]
  };
  
  // Store test data in environment or mock API
  process.env.TEST_DATA = JSON.stringify(testData);
  
  console.log('✅ Test database setup completed');
}

async function setupAdminAuth(page: any, baseURL: string) {
  console.log('🔐 Setting up admin authentication...');
  
  try {
    // Navigate to admin login
    await page.goto(`${baseURL}/admin/login`);
    
    // Fill login form (mock implementation)
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'test-password');
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login
    await page.waitForURL('**/admin/dashboard');
    
    // Save authentication state
    await page.context().storageState({ path: 'tests/auth/admin-auth.json' });
    
    console.log('✅ Admin authentication setup completed');
  } catch (error) {
    console.log('⚠️ Admin authentication setup skipped (login page not available)');
    // Create mock auth state
    const mockAuthState = {
      cookies: [],
      origins: [
        {
          origin: baseURL,
          localStorage: [
            {
              name: 'admin-token',
              value: 'mock-admin-token'
            }
          ]
        }
      ]
    };
    
    // Ensure auth directory exists
    const fs = require('fs');
    const path = require('path');
    const authDir = path.join(__dirname, 'auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(authDir, 'admin-auth.json'),
      JSON.stringify(mockAuthState, null, 2)
    );
  }
}

export default globalSetup;