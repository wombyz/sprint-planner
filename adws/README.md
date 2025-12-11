# AI Developer Workflow (ADW) System

ADW automates software development by integrating GitHub issues with Claude Code CLI to classify issues, generate plans, implement solutions, and create pull requests.

## Quick Start

### 1. Set Environment Variables

```bash
export GITHUB_REPO_URL="https://github.com/owner/repository"
export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CLAUDE_CODE_PATH="/path/to/claude"  # Optional, defaults to "claude"
export GITHUB_PAT="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Optional, only if using different account than 'gh auth login'
```

### 2. Install Prerequisites

```bash
# GitHub CLI
brew install gh              # macOS
# or: sudo apt install gh    # Ubuntu/Debian
# or: winget install --id GitHub.cli  # Windows

# Claude Code CLI
# Follow instructions at https://docs.anthropic.com/en/docs/claude-code

# Python dependency manager (uv)
curl -LsSf https://astral.sh/uv/install.sh | sh  # macOS/Linux
# or: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"  # Windows

# Authenticate GitHub
gh auth login
```

### 3. Setup Convex (Required for Test Phase)

The test phase requires Convex to be properly configured:

```bash
cd app

# Install dependencies
pnpm install

# Authenticate with Convex (opens browser)
npx convex dev

# Set AUTH_SECRET for authentication (in a separate terminal)
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"

# Seed test user (required for E2E tests)
npx convex run seed:seed '{}'
```

**Important:** `npx convex dev` must be running during test execution. The test user credentials are:
- Email: `test@mail.com`
- Password: `password123`

### 4. Run ADW

```bash
cd adws/

# Process a single issue manually (plan + build)
uv run adw_plan_build.py 123

# Process a single issue with full pipeline (plan + build + test)
uv run adw_plan_build_test.py 123

# Run individual phases
uv run adw_plan.py 123     # Planning phase only
uv run adw_build.py        # Build phase only (requires existing plan)
uv run adw_test.py 123     # Test phase only

# Run continuous monitoring (polls every 20 seconds)
uv run adw_triggers/trigger_cron.py

# Start webhook server (for instant GitHub events)
uv run adw_triggers/trigger_webhook.py
```

## Script Usage Guide

### adw_plan_build.py - Complete Workflow

Executes the complete ADW workflow for a specific GitHub issue by chaining the planning and building phases.

```bash
# Basic usage
uv run adw_plan_build.py 456

# What it does:
# 1. Fetches issue #456 from GitHub
# 2. Creates feature branch
# 3. Classifies issue type (/chore, /bug, /feature)
# 4. Generates implementation plan
# 5. Implements the solution
# 6. Creates commits and pull request
```

### adw_plan_build_test.py - Full Pipeline

Executes the complete ADW pipeline including testing for a specific GitHub issue.

```bash
# Basic usage
uv run adw_plan_build_test.py 456

# With specific ADW ID
uv run adw_plan_build_test.py 456 a1b2c3d4

# What it does:
# 1. Runs planning phase (adw_plan.py)
# 2. Runs implementation phase (adw_build.py)
# 3. Runs testing phase (adw_test.py)
# 4. All phases are chained via piped state
```

### adw_plan.py - Planning Phase

Handles the initial planning phase of the workflow.

```bash
# Basic usage
uv run adw_plan.py 456

# What it does:
# 1. Fetches issue details from GitHub
# 2. Classifies issue type
# 3. Creates feature branch
# 4. Generates implementation plan
# 5. Commits plan and creates PR

# Outputs state JSON for chaining with build phase
```

### adw_build.py - Implementation Phase

Implements the solution based on an existing plan.

```bash
# Basic usage (requires existing plan)
uv run adw_build.py

# Can also be chained:
uv run adw_plan.py 456 | uv run adw_build.py

# What it does:
# 1. Finds existing plan from state or by searching
# 2. Implements the solution based on plan
# 3. Commits implementation
# 4. Pushes changes and updates PR
```

### adw_test.py - Test Phase

Runs the application test suite and reports results.

```bash
# Basic usage
uv run adw_test.py 456

# Skip E2E tests
uv run adw_test.py 456 --skip-e2e

# What it does:
# 1. Fetches issue details (if not in state)
# 2. Runs application test suite
# 3. Reports results to issue
# 4. Creates commit with test results
# 5. Pushes changes and updates PR
```

### adw_triggers/trigger_cron.py - Automated Monitoring

Continuously monitors GitHub for new issues or "adw" comments.

```bash
# Start monitoring
uv run adw_triggers/trigger_cron.py

# Processes issues when:
# - New issue has no comments
# - Latest comment on any issue is exactly "adw"

# Example log output:
# 2024-01-15 10:30:45 - Starting ADW cron trigger
# 2024-01-15 10:30:46 - Issue #123 has no comments - processing
# 2024-01-15 10:30:47 - Issue #456 - latest comment is 'adw' - processing
```

### adw_triggers/trigger_webhook.py - GitHub Webhook Server

Receives real-time GitHub events for instant processing.

```bash
# Start webhook server (default port 8001)
uv run adw_triggers/trigger_webhook.py

# Configure GitHub webhook:
# URL: https://your-server.com/gh-webhook
# Events: Issues, Issue comments

# Setup a proxy server to forward requests to the webhook server
```

**Endpoints:**
- `/gh-webhook` - Receives GitHub events
- `/health` - Health check endpoint

## How ADW Works

1. **Issue Classification**: Analyzes GitHub issue and determines type:
   - `/chore` - Maintenance, documentation, refactoring
   - `/bug` - Bug fixes and corrections
   - `/feature` - New features and enhancements

2. **Planning**: `sdlc_planner` agent creates implementation plan with:
   - Technical approach
   - Step-by-step tasks
   - File modifications
   - Testing requirements

3. **Implementation**: `sdlc_implementor` agent executes the plan:
   - Analyzes codebase
   - Implements changes
   - Runs tests
   - Ensures quality

4. **Integration**: Creates git commits and pull request:
   - Semantic commit messages
   - Links to original issue
   - Implementation summary

## Common Usage Scenarios

### Process a bug report
```bash
# User reports bug in issue #789
uv run adw_plan_build.py 789
# ADW analyzes, creates fix, and opens PR
```

### Run full pipeline
```bash
# Complete pipeline with testing
uv run adw_plan_build_test.py 789
# ADW plans, builds, and tests the solution
```

### Run individual phases
```bash
# Plan only
uv run adw_plan.py 789

# Build based on existing plan
uv run adw_build.py

# Test the implementation
uv run adw_test.py 789
```

### Enable automatic processing
```bash
# Start cron monitoring
uv run adw_triggers/trigger_cron.py
# New issues are processed automatically
# Users can comment "adw" to trigger processing
```

### Deploy webhook for instant response
```bash
# Start webhook server
uv run adw_triggers/trigger_webhook.py
# Configure in GitHub settings
# Issues processed immediately on creation
```

## Troubleshooting

### Environment Issues
```bash
# Check required variables
env | grep -E "(GITHUB|ANTHROPIC|CLAUDE)"

# Verify GitHub auth
gh auth status

# Test Claude Code
claude --version
```

### Common Errors

**"Claude Code CLI is not installed"**
```bash
which claude  # Check if installed
# Reinstall from https://docs.anthropic.com/en/docs/claude-code
```

**"Missing GITHUB_PAT"** (Optional - only needed if using different account than 'gh auth login')
```bash
export GITHUB_PAT=$(gh auth token)
```

**"Agent execution failed"**
```bash
# Check agent output
cat agents/*/sdlc_planner/raw_output.jsonl | tail -1 | jq .
```

### Debug Mode
```bash
export ADW_DEBUG=true
uv run adw_plan_build.py 123  # Verbose output
```

## Configuration

### ADW Tracking
Each workflow run gets a unique 8-character ID (e.g., `a1b2c3d4`) that appears in:
- Issue comments: `a1b2c3d4_ops: ✅ Starting ADW workflow`
- Output files: `agents/a1b2c3d4/sdlc_planner/raw_output.jsonl`
- Git commits and PRs

### Model Selection
Edit `adw_modules/data_types.py` to change model:
- `model="opus"` - Most capable model (default) - Claude Opus 4.5
- `model="sonnet"` - Faster, lower cost alternative

### Test Retry Behavior

The test phase includes automatic retry and resolution logic:

| Test Type | Max Attempts | Resolution Command |
|-----------|--------------|-------------------|
| Unit Tests | 4 | `/resolve_failed_test` |
| E2E Tests | 4 | `/resolve_failed_e2e_test` |

**Smart Retry Logic:**
- Tracks errors across attempts to detect progress
- Different errors between attempts = progress being made
- Parsing errors handled separately from real failures
- Continues retrying if fixing one bug reveals another

**Error Types:**
- `PARSING_ERROR`: JSON format issues (may indicate false negative)
- `TEST_FAILURE`: Actual assertion failures
- `TIMEOUT_ERROR`: Test took too long (often data pollution)
- `DATA_POLLUTION`: Previous test runs left garbage data
- `SYSTEM_ERROR`: Infrastructure issues (server down, connection refused)

**False Negative Detection:**
When a test output contains success indicators ("all tests passed") but JSON parsing fails,
the system marks it as `FORMAT_RETRY_NEEDED` and retries without invoking the resolver,
avoiding false negatives caused by celebratory agent output.

### Modular Architecture
The system uses a modular architecture with composable scripts:

- **State Management**: `ADWState` class enables chaining workflows via JSON piping
- **Git Operations**: Centralized git operations in `git_ops.py`  
- **Workflow Operations**: Core business logic in `workflow_ops.py`
- **Agent Integration**: Standardized Claude Code CLI interface in `agent.py`

### Script Chaining
Scripts can be chained using pipes to pass state:
```bash
# Chain planning and building
uv run adw_plan.py 123 | uv run adw_build.py

# Chain full pipeline
uv run adw_plan.py 123 | uv run adw_build.py | uv run adw_test.py

# Or use the convenience script
uv run adw_plan_build_test.py 123

# State is automatically passed between scripts
```

### Output Structure
```
agents/
├── a1b2c3d4/
│   ├── sdlc_planner/
│   │   └── raw_output.jsonl
│   └── sdlc_implementor/
│       └── raw_output.jsonl
adw_modules/
├── agent.py
├── data_types.py
├── github.py
├── git_ops.py
├── state.py
├── utils.py
└── workflow_ops.py
```

## Security Best Practices

- Store tokens as environment variables, never in code
- Use GitHub fine-grained tokens with minimal permissions
- Set up branch protection rules
- Require PR reviews for ADW changes
- Monitor API usage and set billing alerts

## Technical Details

### Core Components
- `adw_modules/agent.py` - Claude Code CLI integration
- `adw_modules/data_types.py` - Pydantic models for type safety
- `adw_modules/github.py` - GitHub API operations
- `adw_modules/git_ops.py` - Git operations (branching, commits, PRs)
- `adw_modules/state.py` - State management for workflow chaining
- `adw_modules/workflow_ops.py` - Core workflow operations (planning, building)
- `adw_modules/utils.py` - Utility functions
- `adw_plan_build.py` - Main workflow orchestration (plan & build)
- `adw_plan_build_test.py` - Full pipeline orchestration (plan & build & test)
- `adw_plan.py` - Planning phase workflow
- `adw_build.py` - Implementation phase workflow
- `adw_test.py` - Testing phase workflow

### Branch Naming
```
{type}-{issue_number}-{adw_id}-{slug}
```
Example: `feat-456-e5f6g7h8-add-user-authentication`

## Planning Checklist for E2E Tests

When planning features that include E2E tests, answer these questions:

### 1. What data does this feature's E2E test need?
- Does the test need existing projects, tasks, or images?
- Does it need completed tasks with generated images?
- Does it need tasks in specific states (pending, generating, failed)?

### 2. Does that data require expensive operations?
- Would generating this data incur Gemini API costs (~$0.039/image)?
- Would it take significant time (>30 seconds)?
- Does it depend on external services?

### 3. What mock data helpers exist or need to be created?
Available helpers in `app/tests/e2e/run_test.js`:
- `createMockTaskData` - Completed task with mock images (supports `withStorageIds` option)
- `createMockProject` - Test project
- `createMockPendingTask` - Task in pending state
- `createMockGeneratingTask` - Task in generating state
- `createMockFailedTask` - Task with failed images
- `createMockBrandingPack` - Branding pack

If needed helpers don't exist, add them to:
- `app/convex/testHelpers.ts` (Convex mutations)
- `app/tests/e2e/run_test.js` (JavaScript wrappers)

### 4. Does the feature require storageId?
Some features depend on `storageId` being present on images:
- **Remix button** - Requires `storageId` to be enabled
- **Download button** - Requires `storageId` to generate download URL
- **Image display** - Requires `storageId` to fetch image URL

If the feature requires `storageId`, use `withStorageIds: true`:
```javascript
const mockTask = await createMockTaskData(page, projectId, 'ideation', {
  withStorageIds: true, // Creates real storage entries with placeholder images
});
```

### 5. What is the cleanup strategy?
- Each test should clean up its own data
- Use `cleanupMockTaskData`, `cleanupMockProject`, etc.
- Consider test isolation - tests should not share state

### Reference Documentation
- `.claude/commands/e2e/TEST_DATA_GUIDELINES.md` - Comprehensive patterns
- `app/tests/e2e/results_views.test.js` - Example of mock data usage
