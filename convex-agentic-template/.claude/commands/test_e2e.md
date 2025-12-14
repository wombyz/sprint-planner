# E2E Test Runner

Execute end-to-end (E2E) tests using Playwright browser automation (MCP Server). If any errors occur and assertions fail mark the test as failed and explain exactly what went wrong.

## Variables

adw_id: $1 if provided, otherwise generate a random 8 character hex string
agent_name: $2 if provided, otherwise use 'test_e2e'
e2e_test_file: $3
application_url: $4 if provided, otherwise use http://localhost:3000

## Setup - CRITICAL

**Servers MUST be running before tests can execute.**

### Verify Servers Are Ready

Before running any test, check if servers are healthy:
```bash
curl -s http://localhost:3000/login | grep -q "Loading" && echo "NOT READY - Convex not connected" || echo "READY"
```

If NOT READY, start the servers:

**Option 1: Use start script (recommended)**
```bash
./scripts/start.sh
```
Wait 10 seconds for servers to be ready.

**Option 2: Start manually (in separate terminals)**
```bash
# Terminal 1: Start Convex backend FIRST
cd app && npx convex dev

# Terminal 2: Start Next.js frontend AFTER Convex shows "ready"
cd app && npm run dev
```

### Server Health Check Criteria
A healthy server state means:
1. `http://localhost:3000/login` responds with 200 OK
2. Page does NOT show "Loading..." (indicates Convex not connected)
3. Page DOES show a login form with `<input` elements

## Test File Locations

Tests are located in `app/tests/e2e/`:
- `projects_crud.test.js` - Projects CRUD backend
- `app_shell_layout.test.js` - App shell and layout
- `authentication.test.js` - Authentication flows

## Test Credentials

Use standardized test account: **test@mail.com / password123**

## Mock Data Helpers

For tests that require pre-existing data (e.g., completed tasks, generated images), use mock data helpers instead of real API calls. This avoids costs and speeds up tests.

### Available Helpers in `run_test.js`

```javascript
// Create mock completed task with images (ideation or design)
await createMockTaskData(page, projectId, 'ideation', {
  numberOfIdeas: 3,
  variationsPerIdea: 2,
});

// Clean up mock task after test
await cleanupMockTaskData(page, taskId);
```

### Pattern for Self-Sufficient Tests

```javascript
await runTest('my_test', async ({ page }) => {
  await login(page);

  // Setup: Create mock data
  const mockTask = await createMockTaskData(page, projectId, 'ideation');

  try {
    // Test assertions...
  } finally {
    // Cleanup: Always remove test data
    await cleanupMockTaskData(page, mockTask.taskId);
  }
});
```

### When to Use Mock Data

- **Results display tests**: Use `createMockTaskData` to create completed tasks
- **Image grid tests**: Mock data provides placeholders without real images
- **Task state tests**: Use appropriate mock helpers for pending/failed/etc.

See `.claude/commands/e2e/TEST_DATA_GUIDELINES.md` for comprehensive patterns.

## Instructions

- FIRST: Verify servers are running using the health check above
- Read the `e2e_test_file`
- Digest the `User Story` to first understand what we're validating
- IMPORTANT: Execute the `Test Steps` detailed in the `e2e_test_file` using Playwright browser automation
- Review the `Success Criteria` and if any of them fail, mark the test as failed and explain exactly what went wrong
- Review the steps that say '**Verify**...' and if they fail, mark the test as failed and explain exactly what went wrong
- Capture screenshots as specified
- IMPORTANT: Return results in the format requested by the `Output Format`
- Initialize Playwright browser in headed mode for visibility
- Use the `application_url`
- Allow time for async operations and element visibility
- IMPORTANT: After taking each screenshot, save it to `Screenshot Directory` with descriptive names. Use absolute paths to move the files to the `Screenshot Directory` with the correct name.
- Capture and report any errors encountered
- Ultra think about the `Test Steps` and execute them in order
- If you encounter an error, mark the test as failed immediately and explain exactly what went wrong and on what step it occurred. For example: '(Step 1) Failed to find element with selector "query-input" on page "http://localhost:3000"'
- Use `pwd` or equivalent to get the absolute path to the codebase for writing and displaying the correct paths to the screenshots


## Screenshot Directory

<absolute path to codebase>/agents/<adw_id>/<agent_name>/img/<directory name based on test file name>/*.png

Each screenshot should be saved with a descriptive name that reflects what is being captured. The directory structure ensures that:
- Screenshots are organized by ADW ID (workflow run)
- They are stored under the specified agent name (e.g., e2e_test_runner_0, e2e_test_resolver_iter1_0)
- Each test has its own subdirectory based on the test file name (e.g., test_basic_query -> basic_query/)

## Report

- Exclusively return the JSON output as specified in the test file
- Capture any unexpected errors
- IMPORTANT: Ensure all screenshots are saved in the `Screenshot Directory`

### Output Format

```json
{
  "test_name": "Test Name Here",
  "status": "passed|failed",
  "screenshots": [
    "<absolute path to codebase>/agents/<adw_id>/<agent_name>/img/<test name>/01_<descriptive name>.png",
    "<absolute path to codebase>/agents/<adw_id>/<agent_name>/img/<test name>/02_<descriptive name>.png",
    "<absolute path to codebase>/agents/<adw_id>/<agent_name>/img/<test name>/03_<descriptive name>.png"
  ],
  "error": null
}
```

## CRITICAL: Output Format Compliance

**Your response MUST be ONLY a valid JSON object. No other text is allowed.**

### ❌ WRONG - Will cause test failure:
- "🎉 All tests passed! {json...}"
- "Here are the results: ```json {json} ```"
- Any text before or after the JSON
- Markdown code fences around the JSON
- Celebration text mixed with JSON

### ✅ CORRECT - Raw JSON only:
```
{"test_name": "...", "status": "passed", "screenshots": [...], "error": null}
```

**IMPORTANT:** The test framework parses your output with `JSON.parse()`. Any non-JSON content will cause a parsing error and the test will be marked as FAILED even if it actually passed.

**DO NOT:**
- Add markdown code fences
- Write celebration messages
- Include explanatory text
- Wrap the JSON in any way

**JUST OUTPUT THE RAW JSON OBJECT.**
