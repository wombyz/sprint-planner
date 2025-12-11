/**
 * Authentication E2E Tests
 *
 * Tests for login, logout, and authentication flows.
 */

const { runTest, TEST_USER, BASE_URL } = require("./run_test");

// Test: Successful Login
async function testSuccessfulLogin() {
  return await runTest("Successful Login", async ({ page, expect, screenshot }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await screenshot("01_login_page");

    // Fill in credentials
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await screenshot("02_credentials_filled");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await screenshot("03_dashboard");

    // Verify we're on dashboard
    await expect.toHaveURL("/dashboard");
  });
}

// Test: Login with Invalid Credentials
async function testInvalidLogin() {
  return await runTest("Invalid Login", async ({ page, expect, screenshot }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill in wrong credentials
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForSelector('[role="alert"], .error, .text-red', {
      timeout: 5000,
    });
    await screenshot("01_error_shown");

    // Should still be on login page
    await expect.toHaveURL("/login");
  });
}

// Test: Logout
async function testLogout() {
  return await runTest("Logout", async ({ page, login, expect, screenshot }) => {
    // Login first
    await login();
    await screenshot("01_logged_in");

    // Find and click logout button
    // Adjust selector based on your UI
    const userMenuSelector = '[data-testid="user-menu"], .user-menu, button:has-text("Account")';
    await page.click(userMenuSelector);

    const logoutSelector = '[data-testid="logout"], button:has-text("Log out"), button:has-text("Sign out")';
    await page.click(logoutSelector);

    // Wait for redirect to login
    await page.waitForURL("**/login", { timeout: 5000 });
    await screenshot("02_logged_out");

    await expect.toHaveURL("/login");
  });
}

// Test: Protected Route Redirect
async function testProtectedRouteRedirect() {
  return await runTest("Protected Route Redirect", async ({ page, expect, screenshot }) => {
    // Try to access dashboard without logging in
    await page.goto(`${BASE_URL}/dashboard`);

    // Should redirect to login
    await page.waitForURL("**/login", { timeout: 5000 });
    await screenshot("01_redirected_to_login");

    await expect.toHaveURL("/login");
  });
}

// Run all tests
async function runAllTests() {
  const results = [];

  console.log("Running authentication E2E tests...\n");

  const tests = [
    testSuccessfulLogin,
    testInvalidLogin,
    testLogout,
    testProtectedRouteRedirect,
  ];

  for (const test of tests) {
    const result = await test();
    results.push(result);

    const status = result.status === "passed" ? "✅" : "❌";
    console.log(`${status} ${result.test_name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log("\n--- Results ---");
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  console.log(`Passed: ${passed}, Failed: ${failed}`);

  // Output JSON for ADW
  console.log("\n--- JSON Output ---");
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Run if executed directly
if (require.main === module) {
  runAllTests().then((results) => {
    const failed = results.some((r) => r.status === "failed");
    process.exit(failed ? 1 : 0);
  });
}

module.exports = {
  testSuccessfulLogin,
  testInvalidLogin,
  testLogout,
  testProtectedRouteRedirect,
  runAllTests,
};
