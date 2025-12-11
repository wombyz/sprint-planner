# E2E Test Data Guidelines

This document outlines strategies for managing test data in E2E tests, ensuring tests are self-sufficient, cost-effective, and maintainable.

## Core Principles

1. **Tests Should Be Self-Sufficient**: Each test must create its own required data and clean up afterward
2. **Avoid External Dependencies**: Tests should not depend on pre-existing database state
3. **Minimize API Costs**: Use mock data for features that would otherwise require expensive API calls
4. **Ensure Reproducibility**: Tests should produce consistent results regardless of environment state

## When to Use Mock Data vs Real Data

### Use Mock Data When:

| Scenario | Example | Reason |
|----------|---------|--------|
| Expensive API calls | Gemini image generation | ~$0.04/image adds up quickly |
| Slow operations | Batch generation (60 images) | 2-5 minute waits slow CI/CD |
| External dependencies | Third-party APIs | Rate limits, flakiness, costs |
| Testing UI rendering | Results grid layouts | Only need data structure, not actual content |
| Testing error states | Failed task display | Easier to create specific failure scenarios |

### Use Real Data When:

| Scenario | Example | Reason |
|----------|---------|--------|
| Testing CRUD operations | Create project via UI | Validates actual mutation flow |
| Testing user interactions | Form submissions | Validates real validation logic |
| Testing file uploads | Face/branding uploads | Validates storage integration |
| Simple, fast operations | Project creation | No significant cost or time impact |

## Available Test Helpers

### Convex Test Helpers (`app/convex/testHelpers.ts`)

```typescript
// Create a completed task with mock images (no API calls)
createMockCompletedTask({
  projectId: Id<"projects">,
  taskType: "ideation" | "design",
  numberOfIdeas?: number,        // For ideation (default: 3)
  variationsPerIdea?: number,    // For ideation (default: 2)
  numberOfVariations?: number,   // For design (default: 4)
})

// Create a project for testing
createMockProject({
  title: string,
  videoPlan?: string,
})

// Create a face reference for testing
createMockFace({
  name: string,
})

// Create a branding pack for testing
createMockBrandingPack({
  name: string,
  primaryColor?: string,
  secondaryColor?: string,
})

// Create task in pending state (for cancellation tests)
createMockPendingTask({
  projectId: Id<"projects">,
  taskType: "ideation" | "design",
})

// Create task in generating state (for progress tests)
createMockGeneratingTask({
  projectId: Id<"projects">,
  taskType: "ideation" | "design",
  completedImages?: number,
})

// Create task with failed images (for error display tests)
createMockFailedTask({
  projectId: Id<"projects">,
  taskType: "ideation" | "design",
  failedCount?: number,
})

// Clean up a specific task and related data
cleanupMockTask({ taskId: Id<"tasks"> })

// Clean up all test data created in a session
cleanupAllMockData({ sessionId: string })
```

### JavaScript Test Utilities (`app/tests/e2e/run_test.js`)

```javascript
const {
  createMockTaskData,      // Create mock task via browser page
  cleanupMockTaskData,     // Clean up mock task via browser page
  createMockProject,       // Create mock project via browser page
  cleanupMockProject,      // Clean up mock project via browser page
  login,                   // Login with test credentials
  runTest,                 // Run test with auto-cleanup
} = require('./run_test.js');

// Example usage in a test:
await runTest('my_test', async ({ page }) => {
  await login(page);

  // Create mock data
  const mockTask = await createMockTaskData(page, projectId, 'ideation');

  try {
    // Run test assertions...
  } finally {
    // Always clean up
    await cleanupMockTaskData(page, mockTask.taskId);
  }
});
```

## How to Add New Mock Data Helpers

### 1. Add Convex Mutation in `testHelpers.ts`

```typescript
export const createMockNewEntity = mutation({
  args: {
    // Define required arguments
    name: v.string(),
    // Optional arguments with defaults
    optionalField: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Create the entity
    const entityId = await ctx.db.insert("entityTable", {
      userId,
      name: args.name,
      optionalField: args.optionalField ?? "default value",
      createdAt: Date.now(),
    });

    return { entityId };
  },
});
```

### 2. Add Cleanup Mutation

```typescript
export const cleanupMockNewEntity = mutation({
  args: {
    entityId: v.id("entityTable"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify ownership
    const entity = await ctx.db.get(args.entityId);
    if (!entity || entity.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete related data first, then the entity
    await ctx.db.delete(args.entityId);

    return { deleted: true };
  },
});
```

### 3. Add JavaScript Wrapper in `run_test.js`

```javascript
async function createMockNewEntity(page, options = {}) {
  return await page.evaluate(
    async ({ name }) => {
      const convex = window.__CONVEX_CLIENT__;
      const api = window.__CONVEX_API__;
      return await convex.mutation(api.testHelpers.createMockNewEntity, { name });
    },
    { name: options.name || 'Test Entity' }
  );
}
```

### 4. Export the New Helper

```javascript
module.exports = {
  // ... existing exports
  createMockNewEntity,
  cleanupMockNewEntity,
};
```

## Cost Implications Reference

| Operation | Est. Cost | Notes |
|-----------|-----------|-------|
| Gemini image generation | ~$0.039/image | Ideation batch (60 images) = ~$2.34 |
| Gemini brief generation | ~$0.001/brief | Negligible |
| Convex operations | Free (dev) | No cost for mutations/queries |
| File storage | Free (dev) | Convex dev tier |

### Cost-Saving Strategies

1. **Mock expensive operations**: Use `createMockCompletedTask` instead of real generation
2. **Batch test data creation**: Create all needed data upfront, run multiple tests, cleanup once
3. **Use minimal data**: 2-3 mock images usually sufficient to test grid layouts

## Cleanup Strategies

### Per-Test Cleanup (Recommended)

```javascript
await runTest('my_test', async ({ page }) => {
  let mockTaskId;

  try {
    // Setup
    mockTaskId = await createMockTaskData(page, projectId, 'ideation');

    // Test assertions...

  } finally {
    // Cleanup (runs even if test fails)
    if (mockTaskId) {
      await cleanupMockTaskData(page, mockTaskId);
    }
  }
});
```

### Session-Based Cleanup

For tests that create many entities:

```javascript
const sessionId = `test_${Date.now()}`;

// Create data with session tracking
await createMockProject(page, { sessionId });
await createMockTaskData(page, projectId, 'ideation', { sessionId });

// Cleanup all at once
await cleanupAllMockData(page, sessionId);
```

### Manual Cleanup (Development)

If tests leave orphaned data:

```bash
# Check for test data in Convex dashboard
# Look for entities with "Mock" or "Test" in names
# Delete manually or run cleanup script
```

## Test Data Pattern Examples

### Pattern 1: Results Views Testing

```javascript
// Need: Completed task with images
// Strategy: Use createMockCompletedTask

await login(page);
const project = await getFirstProject(page);
const mockTask = await createMockTaskData(page, project._id, 'ideation', {
  numberOfIdeas: 3,
  variationsPerIdea: 2,
});

// Navigate to results page and test...

await cleanupMockTaskData(page, mockTask.taskId);
```

### Pattern 2: Task Cancellation Testing

```javascript
// Need: Task in pending or generating state
// Strategy: Use createMockPendingTask

const mockTask = await createMockPendingTask(page, project._id, 'ideation');

// Click cancel button and verify...

await cleanupMockTaskData(page, mockTask.taskId);
```

### Pattern 3: Error Handling Testing

```javascript
// Need: Task with failed images
// Strategy: Use createMockFailedTask

const mockTask = await createMockFailedTask(page, project._id, 'design', {
  failedCount: 3,
});

// Verify error display and retry options...

await cleanupMockTaskData(page, mockTask.taskId);
```

### Pattern 4: Project Deletion Testing

```javascript
// Need: Project with tasks and images
// Strategy: Create project + task together

const mockProject = await createMockProject(page, { title: 'Delete Test' });
const mockTask = await createMockTaskData(page, mockProject.projectId, 'ideation');

// Test deletion cascade...

// Note: Project deletion should cascade to tasks/images
// Only cleanup project if deletion test fails
```

## Features Requiring Storage References

Some features require `storageId` to be present on images for them to function correctly. When testing these features, you must use `withStorageIds: true` when creating mock data.

### Features That Require storageId

| Feature | Component | Requirement |
|---------|-----------|-------------|
| **Remix button** | `ImageDetailPanel.tsx` | `storageId` must exist for button to be enabled |
| **Download button** | `ImageDetailPanel.tsx` | `storageId` needed to generate download URL |
| **Image display** | `ImageCard.tsx` | `storageId` needed to fetch image URL |

### Using withStorageIds

When testing storage-dependent features, pass `withStorageIds: true` to create real (placeholder) storage entries:

```javascript
// Creates mock task with real storageIds (tiny 1x1 PNG placeholders)
const mockTask = await createMockTaskData(page, projectId, 'ideation', {
  numberOfIdeas: 2,
  variationsPerIdea: 2,
  withStorageIds: true, // Required for Remix/Download testing
});
```

### Cost and Performance Notes

- **Storage cost**: Placeholder images are 67 bytes each - negligible storage cost
- **No API costs**: Creates real Convex storage entries but does NOT call Gemini API
- **Cleanup**: Storage entries are cleaned up when the mock task is deleted

### Default Behavior

By default, `withStorageIds` is `false` for backward compatibility. Tests that only need to verify data structure (e.g., grid layouts, task status display) can omit this option to save on storage operations.

```javascript
// Default: no storageIds (faster, minimal storage operations)
const mockTask = await createMockTaskData(page, projectId, 'ideation');

// With storageIds: enables Remix, Download, and image display testing
const mockTask = await createMockTaskData(page, projectId, 'ideation', {
  withStorageIds: true,
});
```

## Checklist for Test Authors

Before writing an E2E test, answer these questions:

- [ ] What data does this test need to exist?
- [ ] Can the test create this data quickly and cheaply?
- [ ] If expensive operations needed, is there a mock helper available?
- [ ] If no mock helper exists, should one be added?
- [ ] **Does the feature require storageId?** (Remix, Download, Image display)
- [ ] How will the test clean up after itself?
- [ ] What happens if the test fails mid-execution?

## Related Documentation

- [E2E Testing README](../../../README.md#e2e-testing)
- [Test Runner Utilities](../../../app/tests/e2e/run_test.js)
- [Convex Test Helpers](../../../app/convex/testHelpers.ts)
