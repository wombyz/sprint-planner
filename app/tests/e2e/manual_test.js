const { chromium } = require("playwright");

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    console.log("Navigating to login...");
    // Sprint Planner runs on port 6000 to avoid conflicts with other local apps
    await page.goto("http://localhost:6000/login");
    await page.waitForTimeout(2000);

    console.log("Filling form...");
    await page.fill('input[name="email"]', "test@mail.com");
    await page.fill('input[name="password"]', "password123");

    console.log("Submitting...");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);

    console.log("Current URL:", page.url());

    // Check if we navigated to dashboard
    if (page.url().includes("/login")) {
      console.log("Still on login page - trying sign up flow...");

      // Click the toggle to switch to sign up mode
      const toggleButton = page.locator('button:has-text("Sign Up")').last();
      await toggleButton.click();
      await page.waitForTimeout(1000);

      // The form should now be in sign up mode, just submit again
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4000);

      console.log("After signup URL:", page.url());

      // If still on login, the user might already exist, try logging in again
      if (page.url().includes("/login")) {
        console.log("Sign up may have failed, trying login one more time...");
        const toggleBack = page.locator('button:has-text("Sign In")').last();
        await toggleBack.click();
        await page.waitForTimeout(1000);

        await page.click('button[type="submit"]');
        await page.waitForTimeout(4000);
        console.log("Final URL:", page.url());
      }
    } else {
      console.log("Successfully navigated to:", page.url());
    }

    await page.screenshot({ path: "/tmp/test_result.png", fullPage: true });
    console.log("Screenshot saved to /tmp/test_result.png");

  } catch (error) {
    console.error("Error:", error.message);
    await page.screenshot({ path: "/tmp/test_error.png", fullPage: true });
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
