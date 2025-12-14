# E2E Test Specification Template

> Use this template to create E2E test specifications. Copy and rename for each test.

## Test: {Feature Name}

### Overview
Brief description of what this test validates.

### Prerequisites
- Server must be running on **port 6000** (Sprint Planner default)
- **VERIFY** you're testing the correct app: `lsof -i :6000` and check login page structure
- Test user must exist (credentials: test@mail.com / password123)
- Any required seed data

### Test File
`app/tests/e2e/{feature_name}.test.js`

### Test Steps

#### Step 1: Setup
1. Navigate to the application
2. Log in with test credentials
3. Ensure clean state (if needed)

#### Step 2: {Action Name}
1. Perform action X
2. Verify result Y
3. Check expected state Z

#### Step 3: Verification
1. Verify final state
2. Check for no errors
3. Validate data persistence

### Success Criteria
- [ ] All test steps pass
- [ ] No console errors
- [ ] Expected UI state achieved
- [ ] Data correctly persisted (if applicable)

### Test Data
Describe any test data needed:
- Mock data helpers to use
- Expected inputs/outputs

### Cleanup
Steps to clean up test data after the test.

### Notes
Any additional context or edge cases to consider.

---

## Creating the Test Runner

Create a corresponding test file at `app/tests/e2e/{feature_name}.test.js`:

```javascript
const { chromium } = require('playwright');

// NOTE: Sprint Planner runs on port 6000 to avoid conflicts with other local apps
// ALWAYS verify you're testing the correct app: lsof -i :6000
const BASE_URL = process.env.BASE_URL || 'http://localhost:6000';
const TEST_USER = {
  email: 'test@mail.com',
  password: 'password123'
};

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Step 1: Setup
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Step 2: Your test actions
    // ...

    // Step 3: Verification
    // ...

    console.log('✅ Test passed!');
    return { success: true };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };

  } finally {
    await browser.close();
  }
}

runTest();
```
