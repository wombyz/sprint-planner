const { chromium } = require("playwright");

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // Enable console logging from the page
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    console.log("Navigating to login...");
    // Sprint Planner runs on port 6000 to avoid conflicts with other local apps
    await page.goto("http://localhost:6000/login", { waitUntil: 'networkidle' });

    console.log("Waiting for form...");
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    console.log("Filling email...");
    await page.fill('input[name="email"]', "test@mail.com");

    console.log("Filling password...");
    await page.fill('input[name="password"]', "password123");

    console.log("Clicking submit...");
    await page.click('button[type="submit"]');

    console.log("Waiting for response...");
    await page.waitForTimeout(5000);

    console.log("Current URL:", page.url());

    // Check for error in the page
    const errorElement = await page.locator('p.text-red-400').textContent().catch(() => null);
    console.log("Error text:", errorElement);

    // Take screenshot
    await page.screenshot({ path: "/tmp/debug_auth.png", fullPage: true });
    console.log("Screenshot saved");

    // Wait to see what happens
    console.log("Waiting 10 seconds to observe...");
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
