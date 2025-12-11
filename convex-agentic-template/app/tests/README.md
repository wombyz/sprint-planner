# Test Infrastructure

> **FOR AI AGENTS**: This file defines all testing conventions. Follow these patterns exactly.

## Prerequisites

Before running tests, ensure the following setup is complete:

### 1. Convex Backend Running

```bash
cd app
npx convex dev
```

### 2. Convex Auth Configured

The `AUTH_SECRET` environment variable must be set in Convex:

```bash
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
```

### 3. Test User Seeded

E2E tests require the standard test user to exist:

```bash
npx convex run seed:seed '{}'
```

This creates the test account:
- **Email:** `test@mail.com`
- **Password:** `password123`

### 4. Next.js Server Running (for E2E tests)

```bash
pnpm dev
```

Or use the combined start script from project root:

```bash
./scripts/start.sh
```

---

## Directory Structure

```
tests/
├── README.md              # This file - read first!
├── setup.ts               # Global test setup
├── helpers/               # Shared test utilities
│   ├── index.ts           # Re-exports all helpers
│   ├── auth.ts            # Authentication helpers
│   ├── factories.ts       # Test data factories
│   └── mocks.ts           # Mock implementations
│
├── unit/                  # Unit tests
│   ├── convex/            # Convex function tests
│   │   ├── users.test.ts
│   │   ├── projects.test.ts
│   │   └── [domain].test.ts
│   └── lib/               # Utility function tests
│       └── [util].test.ts
│
└── e2e/                   # End-to-end tests
    ├── run_test.js        # E2E test runner
    ├── auth.test.ts       # Authentication flows
    ├── [feature].test.ts  # Feature tests
    └── screenshots/       # Test screenshots (gitignored)
```

## Naming Conventions

### Test Files
- Unit tests: `[module].test.ts` (e.g., `users.test.ts`)
- E2E tests: `[feature].test.ts` (e.g., `auth.test.ts`)
- Place in matching directory: `tests/unit/convex/users.test.ts` for `convex/users.ts`

### Test Names
```typescript
describe("users", () => {
  describe("current", () => {
    it("should return null when not authenticated", async () => {});
    it("should return user when authenticated", async () => {});
  });

  describe("updateProfile", () => {
    it("should update user name", async () => {});
    it("should throw when not authenticated", async () => {});
  });
});
```

Format: `should [expected behavior] when [condition]`

## Unit Tests (Convex)

Using `convex-test` for isolated Convex function testing.

### Setup
```typescript
// tests/unit/convex/projects.test.ts
import { convexTest } from "convex-test";
import { expect, describe, it, beforeEach } from "vitest";
import { api, internal } from "../../../convex/_generated/api";
import schema from "../../../convex/schema";

describe("projects", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema);
  });

  describe("create", () => {
    it("should create project for authenticated user", async () => {
      // Create test user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Mock authentication
      const asUser = t.withIdentity({ subject: userId });

      // Call mutation
      const projectId = await asUser.mutation(api.projects.create, {
        name: "Test Project",
      });

      // Verify
      const project = await t.run(async (ctx) => {
        return await ctx.db.get(projectId);
      });

      expect(project).not.toBeNull();
      expect(project?.name).toBe("Test Project");
      expect(project?.userId).toBe(userId);
    });

    it("should throw when not authenticated", async () => {
      await expect(
        t.mutation(api.projects.create, { name: "Test" })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
```

### Testing Patterns

#### Testing Queries
```typescript
it("should return user projects", async () => {
  // Setup
  const userId = await createTestUser(t);
  await createTestProject(t, userId, { name: "Project 1" });
  await createTestProject(t, userId, { name: "Project 2" });

  // Execute
  const asUser = t.withIdentity({ subject: userId });
  const projects = await asUser.query(api.projects.list, {});

  // Verify
  expect(projects).toHaveLength(2);
});
```

#### Testing Mutations
```typescript
it("should update project", async () => {
  // Setup
  const userId = await createTestUser(t);
  const projectId = await createTestProject(t, userId);

  // Execute
  const asUser = t.withIdentity({ subject: userId });
  await asUser.mutation(api.projects.update, {
    id: projectId,
    name: "Updated Name",
  });

  // Verify
  const project = await t.run(async (ctx) => ctx.db.get(projectId));
  expect(project?.name).toBe("Updated Name");
});
```

#### Testing Authorization
```typescript
it("should not allow updating other user's project", async () => {
  // Setup
  const user1 = await createTestUser(t, { email: "user1@test.com" });
  const user2 = await createTestUser(t, { email: "user2@test.com" });
  const projectId = await createTestProject(t, user1);

  // Execute & Verify
  const asUser2 = t.withIdentity({ subject: user2 });
  await expect(
    asUser2.mutation(api.projects.update, { id: projectId, name: "Hacked" })
  ).rejects.toThrow("Not authorized");
});
```

## E2E Tests

Using Playwright for browser-based E2E tests.

### Test Structure
```typescript
// tests/e2e/auth.test.ts
import { test, expect } from "@playwright/test";
import { login, createTestUser } from "../helpers";

test.describe("Authentication", () => {
  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});
```

### E2E Test Credentials

**Standard Test Account:**
- Email: `test@mail.com`
- Password: `password123`

This account should exist in the test database.

### Screenshot Guidelines
```typescript
// Take screenshot at key points
await page.screenshot({
  path: `tests/e2e/screenshots/${testName}_01_initial.png`,
});

// After action
await page.screenshot({
  path: `tests/e2e/screenshots/${testName}_02_after_submit.png`,
});
```

## Test Data Factories

### Location: `tests/helpers/factories.ts`

```typescript
import { convexTest } from "convex-test";

export async function createTestUser(
  t: ReturnType<typeof convexTest>,
  overrides: Partial<{ email: string; name: string }> = {}
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: overrides.email ?? `test-${Date.now()}@example.com`,
      name: overrides.name ?? "Test User",
      role: "member",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

export async function createTestProject(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  overrides: Partial<{ name: string; status: string }> = {}
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("projects", {
      userId,
      name: overrides.name ?? "Test Project",
      status: overrides.status ?? "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}
```

## Running Tests

```bash
# All unit tests
pnpm test

# Watch mode
pnpm test:watch

# Specific file
pnpm test tests/unit/convex/users.test.ts

# E2E tests (requires server running)
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui
```

## CI Integration

Tests run automatically on:
- Pull request creation/update
- Push to main branch

### Required Checks
1. `pnpm test` - Unit tests must pass
2. `pnpm build` - Build must succeed
3. `npx convex typecheck` - Convex types must be valid

## Mocking Guidelines

### DO Mock
- External API calls (LLMs, payment providers, etc.)
- Time-sensitive operations (`Date.now()`)
- File uploads/downloads in unit tests

### DON'T Mock
- Convex database operations (use convex-test)
- React components in E2E tests
- Authentication in E2E tests (use real flows)

### Mock Example
```typescript
// Mock external API
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ text: "Mocked response" }],
      }),
    };
  },
}));
```

## Debugging Tests

### Unit Tests
```bash
# Run with verbose output
pnpm test --reporter=verbose

# Run single test
pnpm test -t "should create project"
```

### E2E Tests
```bash
# Run headed (see browser)
pnpm test:e2e --headed

# Slow motion
pnpm test:e2e --slow-mo=1000

# Debug mode
pnpm test:e2e --debug
```

---

> **Remember**: Good tests are documentation. Write tests that explain what the code should do.
