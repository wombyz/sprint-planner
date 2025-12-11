# E2E Test Cleanup Guidelines

## Problem

E2E tests create data (ideas, projects, tasks, etc.) that persists between test runs. Over time, this can accumulate to 100+ orphaned records, causing:
- Slow test startup (cleanup takes too long)
- Test timeouts
- Inconsistent test behavior
- Data pollution affecting subsequent tests

## Evidence

**Issue #92:** Test cleanup found 126+ orphaned ideas from previous test runs, causing the cleanup to timeout and the test to fail.

## Best Practices

### 1. Always Clean Up After Yourself

Each test should delete any data it creates:

```javascript
await runTest('my_test', async ({ page }) => {
  let testProject = null;

  try {
    // Create test data
    testProject = await createMockProject(page);

    // Run assertions
    await expect(page.locator('.project-title')).toBeVisible();

  } finally {
    // ALWAYS delete test data, even on failure
    if (testProject) {
      await cleanupMockProject(page, testProject.projectId);
    }
  }
});
```

### 2. Use Unique Identifiers

Prefix test data with identifiable patterns for easy cleanup:

```javascript
// Good: Identifiable test data
const project = await createMockProject(page, {
  title: `[E2E-${adwId}] Test Project ${Date.now()}`,
});

// This allows targeted bulk cleanup:
await page.evaluate(async (prefix) => {
  const { api } = window.convex;
  await api.projects.deleteByPrefix({ prefix });
}, `[E2E-${adwId}]`);
```

### 3. Limit Cleanup Scope

Don't delete ALL data - only your test's data:

```javascript
// ❌ WRONG - Dangerous and slow
await deleteAllIdeas();
await deleteAllProjects();

// ✅ CORRECT - Targeted and fast
await deleteProjectById(testProjectId);
await deleteIdeasByPrefix('[E2E-abc123]');
```

### 4. Cleanup Before AND After

- **Before:** Clean up any stale data from crashed previous runs
- **After:** Clean up data created during this run

```javascript
await runTest('my_test', async ({ page }) => {
  // Before: Clean up any stale test data from our ADW ID
  await cleanupStaleTestData(page, adwId);

  // Test code...
  const project = await createMockProject(page);

  try {
    // Assertions...
  } finally {
    // After: Clean up data created during this run
    await cleanupMockProject(page, project.projectId);
  }
});
```

### 5. Set Reasonable Timeouts

Cleanup operations should timeout after 30 seconds max. If cleanup takes longer, fail fast and report the issue:

```javascript
async function cleanupWithTimeout(page, cleanupFn, timeoutMs = 30000) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Cleanup timeout')), timeoutMs)
  );

  try {
    await Promise.race([cleanupFn(page), timeoutPromise]);
  } catch (error) {
    console.warn(`Cleanup failed or timed out: ${error.message}`);
    // Don't throw - let test continue/report
  }
}
```

### 6. Use Cascade Deletes

When deleting a project, use cascade delete to remove all related data:

```javascript
// The cleanupMockProject helper handles cascade delete
await cleanupMockProject(page, projectId);

// This deletes:
// - The project
// - All tasks for that project
// - All generated ideas for those tasks
// - All generated images for those tasks
// - All storage files for those images
```

## Available Cleanup Helpers

From `app/tests/e2e/run_test.js`:

| Helper | Purpose |
|--------|---------|
| `cleanupMockProject(page, projectId)` | Delete project with cascade |
| `cleanupMockTaskData(page, taskId)` | Delete task with images/ideas |
| `cleanupMockBrandingPack(page, packId)` | Delete branding pack |

From `app/convex/testHelpers.ts`:

| Mutation | Purpose |
|----------|---------|
| `cleanupMockProject` | Backend cascade delete |
| `cleanupMockTask` | Backend task cleanup |
| `cleanupMockBrandingPack` | Backend branding cleanup |

## Bulk Cleanup Patterns

For cleaning up data pollution from crashed tests:

```javascript
// Clean up all test data for a specific ADW run
async function cleanupStaleTestData(page, adwId) {
  await page.evaluate(async (id) => {
    const { api } = window.convex;

    // Get all test projects for this ADW
    const projects = await api.projects.list();
    const testProjects = projects.filter(p =>
      p.title?.includes(`[E2E-${id}]`)
    );

    // Delete each (cascade handles related data)
    for (const project of testProjects) {
      await api.testHelpers.cleanupMockProject({ projectId: project._id });
    }
  }, adwId);
}
```

## Avoiding Data Pollution

1. **Never share test data between tests** - Each test creates its own data
2. **Use unique IDs** - Include ADW ID and timestamp in test data names
3. **Always use try/finally** - Ensure cleanup runs even on test failure
4. **Limit batch operations** - Don't create more data than necessary
5. **Monitor cleanup performance** - If cleanup takes >10s, investigate

## Troubleshooting

### "126+ existing ideas from previous test runs"

**Cause:** Previous test runs crashed without cleanup
**Fix:**
1. Add a pre-test cleanup step to remove stale data
2. Make cleanup more robust with proper prefixing

### "Test timeout during cleanup"

**Cause:** Too many records to delete, or deletion is slow
**Fix:**
1. Ensure cascade deletes are used (single operation)
2. Add timeout guards
3. Use bulk delete operations instead of one-by-one

### "Inconsistent test behavior"

**Cause:** Tests picking up data from previous runs
**Fix:**
1. Use unique identifiers for all test data
2. Filter queries in tests by test-specific prefixes
3. Add pre-test cleanup
