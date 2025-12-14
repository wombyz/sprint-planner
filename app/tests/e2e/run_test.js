/**
 * E2E Test Runner
 *
 * Standalone test runner using Playwright for E2E tests.
 * Used by ADW system for automated E2E testing.
 *
 * Usage:
 *   node tests/e2e/run_test.js <test_file>
 *
 * Example:
 *   node tests/e2e/run_test.js auth.test.js
 */

const { chromium } = require("playwright");
const path = require("path");

// Configuration
// NOTE: Sprint Planner runs on port 3000 by default
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const HEADLESS = process.env.HEADLESS !== "false";
const SLOW_MO = parseInt(process.env.SLOW_MO || "0", 10);

// Test credentials
const TEST_USER = {
  email: "test@mail.com",
  password: "password123",
};

/**
 * Verify we're testing the correct application
 * This helps catch issues when multiple local apps are running
 */
async function verifyApplication(page) {
  console.log(`\n🔍 Verifying application at ${BASE_URL}...`);

  try {
    const response = await page.goto(`${BASE_URL}/login`, { timeout: 10000 });

    if (!response || !response.ok()) {
      throw new Error(`Failed to reach ${BASE_URL}/login - Status: ${response?.status()}`);
    }

    // Check for Sprint Planner specific elements
    const hasEmailInput = await page.locator('input[name="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[name="password"]').count() > 0;
    const hasSubmitButton = await page.locator('button[type="submit"]').count() > 0;

    if (!hasEmailInput || !hasPasswordInput || !hasSubmitButton) {
      console.warn(`⚠️  WARNING: Login form structure doesn't match Sprint Planner`);
      console.warn(`   Expected: email input, password input, submit button`);
      console.warn(`   Found: email=${hasEmailInput}, password=${hasPasswordInput}, submit=${hasSubmitButton}`);
      console.warn(`   You may be testing the wrong application!`);
      console.warn(`   Check what's running on port ${BASE_URL.split(':').pop()}: lsof -i :${BASE_URL.split(':').pop()}`);
    } else {
      console.log(`✅ Application verified - Sprint Planner detected at ${BASE_URL}`);
    }

    return { verified: hasEmailInput && hasPasswordInput && hasSubmitButton };
  } catch (error) {
    console.error(`❌ Application verification failed: ${error.message}`);
    console.error(`   Is Sprint Planner running? Try: ./scripts/start.sh`);
    throw error;
  }
}

/**
 * Login helper
 */
async function login(page, credentials = TEST_USER) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login page - dashboard is at root /
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 });
}

/**
 * Wait for Convex to be connected
 */
async function waitForConvex(page, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const loading = await page.locator("text=Loading...").count();
    if (loading === 0) return true;
    await page.waitForTimeout(500);
  }
  throw new Error("Convex connection timeout");
}

/**
 * Take a screenshot with a descriptive name
 */
async function screenshot(page, name, outputDir = "screenshots") {
  const dir = path.join(__dirname, outputDir);
  const fs = require("fs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}_${name.replace(/\s+/g, "_")}.png`;
  const filepath = path.join(dir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

/**
 * Main test runner
 */
async function runTest(testName, testFn) {
  const browser = await chromium.launch({
    headless: HEADLESS,
    slowMo: SLOW_MO,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  const result = {
    test_name: testName,
    status: "passed",
    screenshots: [],
    error: null,
  };

  try {
    // Provide helpers to test
    await testFn({
      page,
      login: (creds) => login(page, creds),
      waitForConvex: () => waitForConvex(page),
      screenshot: async (name) => {
        const path = await screenshot(page, name);
        result.screenshots.push(path);
        return path;
      },
      expect: createExpect(page),
    });
  } catch (error) {
    result.status = "failed";
    result.error = error.message;

    // Take failure screenshot
    try {
      const failPath = await screenshot(page, `FAILED_${testName}`);
      result.screenshots.push(failPath);
    } catch (screenshotError) {
      // Ignore screenshot errors
    }
  } finally {
    await browser.close();
  }

  return result;
}

/**
 * Simple expect helper
 */
function createExpect(page) {
  return {
    toHaveURL: async (expected) => {
      const actual = page.url();
      if (!actual.includes(expected)) {
        throw new Error(`Expected URL to include "${expected}", got "${actual}"`);
      }
    },
    toBeVisible: async (selector) => {
      const visible = await page.locator(selector).isVisible();
      if (!visible) {
        throw new Error(`Expected "${selector}" to be visible`);
      }
    },
    toHaveText: async (selector, expected) => {
      const actual = await page.locator(selector).textContent();
      if (!actual?.includes(expected)) {
        throw new Error(
          `Expected "${selector}" to have text "${expected}", got "${actual}"`
        );
      }
    },
    toHaveCount: async (selector, expected) => {
      const count = await page.locator(selector).count();
      if (count !== expected) {
        throw new Error(
          `Expected "${selector}" to have count ${expected}, got ${count}`
        );
      }
    },
  };
}

// Export for use in test files
module.exports = {
  runTest,
  login,
  verifyApplication,
  waitForConvex,
  screenshot,
  TEST_USER,
  BASE_URL,
};

// If run directly, show usage
if (require.main === module) {
  console.log(`
E2E Test Runner

Usage:
  node run_test.js <test_file>

Environment Variables:
  BASE_URL  - Application URL (default: http://localhost:6000)
  HEADLESS  - Run headless (default: true)
  SLOW_MO   - Slow motion ms (default: 0)

Example:
  node run_test.js auth.test.js
  HEADLESS=false node run_test.js auth.test.js
  BASE_URL=http://localhost:8080 node run_test.js auth.test.js

⚠️  PORT CONFLICT WARNING:
  Sprint Planner runs on port 3000 by default.
  If you have multiple local apps running, verify you're testing
  the correct one by checking: lsof -i :3000
  `);
}
