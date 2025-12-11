# Resolve Failed E2E Test

Fix a specific failing E2E test using the provided failure details.

## Error Type Handling

Before attempting to fix, classify the error type:

### Parsing/Format Errors
If error contains "parse", "JSON", "format", "FORMAT_RETRY_NEEDED":
- The test may have actually PASSED
- Check if the test output contains success indicators ("passed", "all tests passed")
- If yes: ensure the `/test_e2e` output is pure JSON (no markdown, no celebration text)
- The test framework will retry automatically for format issues
- If called to fix this: verify the test actually passes when run correctly

### Timeout/Data Pollution Errors
If error mentions "timeout", "excessive time", "126+ existing", "orphan":
- This is a test infrastructure issue, not a code bug
- Focus on improving cleanup efficiency
- Consider adding bulk delete operations
- Add timeout guards to cleanup functions
- See `.claude/commands/e2e/CLEANUP_GUIDELINES.md` for patterns

### System Errors
If error mentions "crash", "connection", "server", "ECONNREFUSED":
- Check if servers are running (Next.js dev server, Convex backend)
- Verify the application URL is accessible
- This may resolve on retry without code changes

### Actual Test Failures
If error describes a specific assertion failure:
- This is a real bug in the implementation
- Debug the code, not the test infrastructure
- Check recent git changes
- Verify the implementation matches the spec

## Instructions

1. **Analyze the E2E Test Failure**
   - Review the JSON data in the `Test Failure Input`, paying attention to:
     - `test_name`: The name of the failing test
     - `test_path`: The path to the test file (you will need this for re-execution)
     - `error`: The specific error that occurred
     - `screenshots`: Any captured screenshots showing the failure state
   - Understand what the test is trying to validate from a user interaction perspective

2. **Understand Test Execution**
   - Read `.claude/commands/test_e2e.md` to understand how E2E tests are executed
   - Read the test file specified in the `test_path` field from the JSON
   - Note the test steps, user story, and success criteria

3. **Reproduce the Failure**
   - IMPORTANT: Use the `test_path` from the JSON to re-execute the specific E2E test
   - Follow the execution pattern from `.claude/commands/test_e2e.md`
   - Observe the browser behavior and confirm you can reproduce the exact failure
   - Compare the error you see with the error reported in the JSON

4. **Fix the Issue**
   - Based on your reproduction, identify the root cause
   - Make minimal, targeted changes to resolve only this E2E test failure
   - Consider common E2E issues:
     - Element selector changes
     - Timing issues (elements not ready)
     - UI layout changes
     - Application logic modifications
   - Ensure the fix aligns with the user story and test purpose

5. **Validate the Fix**
   - Re-run the same E2E test step by step using the `test_path` to confirm it now passes
   - IMPORTANT: The test must complete successfully before considering it resolved
   - Do NOT run other tests or the full test suite
   - Focus only on fixing this specific E2E test

## Test Failure Input

$ARGUMENTS

## Report

Provide a concise summary of:
- Root cause identified (e.g., missing element, timing issue, incorrect selector)
- Specific fix applied
- Confirmation that the E2E test now passes after your fix