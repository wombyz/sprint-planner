/**
 * Authentication Helpers
 *
 * Utilities for testing authentication flows
 */

import type { Page } from "@playwright/test";

// Standard test credentials
export const TEST_USER = {
  email: "test@mail.com",
  password: "password123",
};

/**
 * Login via the UI (for E2E tests)
 */
export async function login(
  page: Page,
  credentials: { email: string; password: string } = TEST_USER
): Promise<void> {
  await page.goto("/login");

  // Fill credentials
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}

/**
 * Logout via the UI (for E2E tests)
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login
  await page.waitForURL("**/login", { timeout: 5000 });
}

/**
 * Check if user is authenticated (E2E)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for dashboard access
  await page.goto("/dashboard");
  const url = page.url();
  return !url.includes("/login");
}

/**
 * Create a test user identity for Convex unit tests
 */
export function createTestIdentity(userId: string) {
  return {
    subject: userId,
    tokenIdentifier: `test|${userId}`,
  };
}
