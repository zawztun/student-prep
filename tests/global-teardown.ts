import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Clean up test data
    await cleanupTestDatabase();
    
    // Clean up authentication files
    await cleanupAuthFiles();
    
    // Clean up temporary files
    await cleanupTempFiles();
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid failing the test suite
  }
}

async function cleanupTestDatabase() {
  console.log('🗄️ Cleaning up test database...');
  
  // In a real implementation, this would:
  // 1. Clean up test data from database
  // 2. Reset database state
  // 3. Close database connections
  
  // Mock implementation for now
  delete process.env.TEST_DATA;
  
  console.log('✅ Test database cleanup completed');
}

async function cleanupAuthFiles() {
  console.log('🔐 Cleaning up authentication files...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const authDir = path.join(__dirname, 'auth');
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      for (const file of files) {
        const filePath = path.join(authDir, file);
        fs.unlinkSync(filePath);
      }
      fs.rmdirSync(authDir);
    }
    
    console.log('✅ Authentication files cleanup completed');
  } catch (error) {
    console.log('⚠️ Authentication files cleanup skipped:', error.message);
  }
}

async function cleanupTempFiles() {
  console.log('📁 Cleaning up temporary files...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Clean up any temporary test files
    const tempDirs = [
      path.join(__dirname, '../test-results'),
      path.join(__dirname, '../playwright-report')
    ];
    
    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        // Only clean up if not in CI (preserve artifacts for debugging)
        if (!process.env.CI) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }
    }
    
    console.log('✅ Temporary files cleanup completed');
  } catch (error) {
    console.log('⚠️ Temporary files cleanup skipped:', error.message);
  }
}

export default globalTeardown;