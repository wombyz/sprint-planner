# Application Validation Test Suite

Execute comprehensive validation tests for the Convex + Next.js application, returning results in a standardized JSON format for automated processing.

## Purpose

Proactively identify and fix issues in the application before they impact users or developers:
- Detect syntax errors, type mismatches, and import failures
- Identify broken tests or issues
- Verify build processes and dependencies
- Ensure Convex schema and functions are valid

## Variables

TEST_COMMAND_TIMEOUT: 5 minutes

## Important: Project Structure

```
project/
├── adws/                # ADW automation
├── specs/               # Feature specs
├── scripts/             # Utility scripts
├── .claude/             # Claude commands
└── app/                 # Next.js + Convex application
    ├── convex/          # Convex backend
    ├── components/      # React components
    ├── tests/           # Test files
    └── ...
```

**CRITICAL**: Before running any test:
1. Check if `$APP_DIR` environment variable is set
2. If set, use `cd $APP_DIR` to navigate to the app directory
3. If not set, fall back to `cd app` from the project root

## Instructions

- **FIRST**: Navigate to `${APP_DIR:-app}` subdirectory
- Execute each test in the sequence provided below
- Capture the result (passed/failed) and any error messages
- IMPORTANT: Return ONLY the JSON array with test results
  - Do not include any additional text, explanations, or markdown formatting
  - We'll immediately run JSON.parse() on the output
- If a test fails, include the error message and STOP processing
- Error Handling:
  - If a command returns non-zero exit code, mark as failed
  - Capture stderr output for error field
  - Timeout commands after `TEST_COMMAND_TIMEOUT`

## Test Execution Sequence (Convex + Next.js)

### 1. TypeScript Type Check
- Preparation: Verify app directory exists: `ls -la ${APP_DIR:-app}/`
- Command: `cd ${APP_DIR:-app} && pnpm tsc --noEmit`
- test_name: "typescript_check"
- test_purpose: "Validates TypeScript type correctness for frontend code"

### 2. ESLint Check
- Command: `cd ${APP_DIR:-app} && pnpm lint`
- test_name: "eslint_check"
- test_purpose: "Validates code quality and style guidelines"

### 3. Convex Type Check
- Command: `cd ${APP_DIR:-app} && npx convex typecheck`
- test_name: "convex_typecheck"
- test_purpose: "Validates Convex schema, queries, mutations, and actions have correct types"

### 4. Unit Tests
- Command: `cd ${APP_DIR:-app} && pnpm test`
- test_name: "unit_tests"
- test_purpose: "Runs Vitest unit tests including Convex function tests"

### 5. Next.js Build
- Command: `cd ${APP_DIR:-app} && pnpm build`
- test_name: "nextjs_build"
- test_purpose: "Validates complete Next.js production build including bundling and optimization"

## Report

- IMPORTANT: Return results exclusively as a JSON array
- Sort with failed tests (passed: false) at the top
- Include execution_command for reproducibility

### Output Structure

```json
[
  {
    "test_name": "string",
    "passed": boolean,
    "execution_command": "string",
    "test_purpose": "string",
    "error": "optional string"
  }
]
```

### Example Output

```json
[
  {
    "test_name": "convex_typecheck",
    "passed": false,
    "execution_command": "cd app && npx convex typecheck",
    "test_purpose": "Validates Convex schema, queries, mutations, and actions have correct types",
    "error": "convex/projects.ts:25: Type 'string' is not assignable to type 'Id<\"users\">'"
  },
  {
    "test_name": "typescript_check",
    "passed": true,
    "execution_command": "cd app && pnpm tsc --noEmit",
    "test_purpose": "Validates TypeScript type correctness for frontend code"
  }
]
```
