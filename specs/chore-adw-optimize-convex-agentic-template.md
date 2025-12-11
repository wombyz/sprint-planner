# Chore: Optimize Convex Agentic Template for Seamless Setup

## Chore Description

Analyze issues encountered during sprint-planner chunks 1-4 and update the Convex-Agentic-Template to prevent these issues in future projects. The template should include:

1. **Human Setup Guide** - Clear step-by-step instructions for initial project setup (Convex account, auth secrets, test user seeding)
2. **AI Context Documentation** - Comprehensive documentation so AI agents understand the full setup requirements
3. **Pre-configured Auth Files** - Ready-to-use authentication files with correct import syntax
4. **Test Infrastructure** - Seed scripts and E2E test prerequisites documented

### Issues Identified from Sprint-Planner Chunks 1-4

Based on agent logs analysis, these were the recurring issues:

| Issue | Root Cause | Impact | Fix |
|-------|------------|--------|-----|
| **E2E tests failing - "test user does not exist"** | No seed script run, no documentation on test prerequisites | 4+ retry loops | Add seed script + document prerequisites |
| **Auth not working - "Could not create account"** | `AUTH_SECRET` not set as Convex env var | Multiple failed test iterations | Document Convex env vars clearly |
| **Import error - "No default export for Password"** | Wrong import syntax in auth.ts | Build failures | Fix template auth.ts with correct syntax |
| **Convex CLI not authenticated** | No documentation on first-time Convex setup | Blocked development | Add human setup guide |
| **Missing http.ts** | Auth routes not configured | Auth completely non-functional | Add http.ts to template |

## Relevant Files

### Template Files to Update

- `convex-agentic-template/README.md` - Add comprehensive human setup guide with numbered steps
- `convex-agentic-template/.env.sample` - Add Convex auth env var documentation
- `convex-agentic-template/app/CONVEX.md` - Add auth setup requirements section
- `convex-agentic-template/app/convex/schema.ts` - Already good, no changes needed
- `convex-agentic-template/app/tests/README.md` - Add test prerequisites section

### New Files to Create

- `convex-agentic-template/app/convex/auth.ts` - Pre-configured auth with correct imports
- `convex-agentic-template/app/convex/http.ts` - HTTP routes for auth endpoints
- `convex-agentic-template/app/convex/seed.ts` - Test user seeding script
- `convex-agentic-template/SETUP.md` - Detailed human setup checklist (separate from README)
- `convex-agentic-template/.claude/commands/install.md` - Claude command for initial setup verification

## Step by Step Tasks

### Step 1: Create Core Authentication Files

Create the missing Convex authentication infrastructure files that caused failures:

- Create `app/convex/auth.ts` with correct named import syntax:
  ```typescript
  import { convexAuth } from "@convex-dev/auth/server";
  import { Password } from "@convex-dev/auth/providers/Password";  // Named import, NOT default

  export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [Password],
  });
  ```

- Create `app/convex/http.ts` for auth HTTP routes:
  ```typescript
  import { httpRouter } from "convex/server";
  import { auth } from "./auth";

  const http = httpRouter();
  auth.addHttpRoutes(http);

  export default http;
  ```

### Step 2: Create Test User Seed Script

Create `app/convex/seed.ts` that:

- Creates test user `test@mail.com` with password `password123`
- Uses Scrypt from lucia to hash password (same as @convex-dev/auth)
- Creates both `users` record and `authAccounts` record
- Is idempotent (checks if user exists first)
- Can be run via `npx convex run seed:seed '{}'`

### Step 3: Create Human Setup Guide (SETUP.md)

Create `convex-agentic-template/SETUP.md` with clear numbered steps:

```markdown
# Project Setup Guide

## Prerequisites
- Node.js 18+
- pnpm
- Convex account (https://convex.dev)
- GitHub account
- Claude Code CLI installed

## Setup Steps

### 1. Clone and Initialize
```bash
cp -r convex-agentic-template my-new-project
cd my-new-project
git init
cp .env.sample .env
```

### 2. Install Dependencies
```bash
cd app
pnpm install
```

### 3. Initialize Convex (Interactive - Opens Browser)
```bash
npx convex dev
# This will:
# - Open browser for Convex login
# - Create a new project
# - Sync schema
# Keep this terminal running!
```

### 4. Set Auth Secret (In New Terminal)
```bash
cd app
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
```

### 5. Seed Test User
```bash
npx convex run seed:seed '{}'
```

### 6. Verify Setup
```bash
npx convex env list
# Should show: AUTH_SECRET=...
npx convex data users
# Should show: test@mail.com
```

### 7. Start Development
```bash
# Terminal 1: cd app && npx convex dev
# Terminal 2: cd app && pnpm dev
# Or: ./scripts/start.sh
```

Visit http://localhost:3000 and login with:
- Email: test@mail.com
- Password: password123
```

### Step 4: Update .env.sample

Add Convex auth environment variable documentation:

```bash
# ===========================================
# CONVEX AUTH (Required - set via Convex CLI)
# ===========================================
# These are SERVER-SIDE environment variables set via `npx convex env set`
# NOT in this .env file. See SETUP.md for instructions.
#
# AUTH_SECRET - Generate with: openssl rand -base64 32
#   npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
#
# CONVEX_SITE_URL - Automatically set by Convex (built-in)
```

### Step 5: Update README.md

Update the Quick Start section to:

1. Reference SETUP.md for detailed instructions
2. Add "Prerequisites" section listing what human must do first
3. Add "Convex Auth Setup" step before "Start Development"
4. Update Environment Variables table to separate local vs Convex server env vars
5. Add Troubleshooting section for common auth issues

### Step 6: Update app/CONVEX.md

Add new "Setup Requirements" section under Authentication:

```markdown
### Setup Requirements

**CRITICAL**: Before authentication will work, you must:

1. **Set AUTH_SECRET** (required):
   ```bash
   npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
   ```

2. **Seed test user** (required for E2E tests):
   ```bash
   npx convex run seed:seed '{}'
   ```
   Creates: `test@mail.com` / `password123`

**Note:** `CONVEX_SITE_URL` is automatically set by Convex.
```

### Step 7: Create/Update app/tests/README.md

Add Prerequisites section at the top:

```markdown
## Prerequisites

Before running tests, ensure:

### 1. Convex Backend Running
```bash
cd app && npx convex dev
```

### 2. Auth Secret Configured
```bash
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
```

### 3. Test User Seeded
```bash
npx convex run seed:seed '{}'
```
Creates: test@mail.com / password123

### 4. Next.js Running (for E2E)
```bash
pnpm dev
```
```

### Step 8: Create /install Command

Create `.claude/commands/install.md` that:

1. Checks if `pnpm install` has been run
2. Checks if Convex is configured (looks for .env.local with CONVEX_DEPLOYMENT)
3. Checks if AUTH_SECRET is set via `npx convex env list`
4. Checks if test user exists via `npx convex data users`
5. Reports what's missing and provides commands to fix

### Step 9: Update ADW Documentation

Update `adws/README.md` to add Convex setup prerequisites:

```markdown
### 3. Setup Convex (Required for Test Phase)

The test phase requires Convex to be properly configured:

```bash
cd app
pnpm install
npx convex dev  # Keep running
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
npx convex run seed:seed '{}'
```

**Important:** `npx convex dev` must be running during test execution.
```

### Step 10: Validate All Changes

Run validation commands to ensure template is complete and correct.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `cd convex-agentic-template/app/convex && cat auth.ts` - Verify auth.ts exists with correct import
- `cd convex-agentic-template/app/convex && cat http.ts` - Verify http.ts exists
- `cd convex-agentic-template/app/convex && cat seed.ts` - Verify seed.ts exists
- `cd convex-agentic-template && cat SETUP.md` - Verify human setup guide exists
- `cd convex-agentic-template && cat README.md | grep -A5 "AUTH_SECRET"` - Verify README mentions auth setup
- `cd convex-agentic-template && cat .env.sample | grep -A3 "CONVEX AUTH"` - Verify env sample has auth section
- `cd convex-agentic-template/app && cat CONVEX.md | grep -A10 "Setup Requirements"` - Verify CONVEX.md has setup section
- `cd convex-agentic-template/app/tests && cat README.md | grep -A10 "Prerequisites"` - Verify tests README has prerequisites
- `cd convex-agentic-template/.claude/commands && cat install.md` - Verify install command exists

## Notes

### Key Learnings from Sprint-Planner

1. **Convex Auth requires server-side env vars** - `AUTH_SECRET` must be set via `npx convex env set`, NOT in `.env.local`

2. **Password provider uses named export** - Import as `{ Password }` not `Password`

3. **E2E tests need seeded data** - Test user must exist before running E2E tests

4. **http.ts is required** - Without it, auth routes don't work

5. **`npx convex dev` must be running** - For tests and development, Convex dev server must be active

### Template Philosophy

The template should be "clone and go" with minimal human intervention:

- **For Humans**: Clear numbered checklist in SETUP.md
- **For AI Agents**: All context in README.md, CONVEX.md, and tests/README.md
- **For ADW**: Prerequisites documented in adws/README.md

### Test User Convention

All templates should use:
- Email: `test@mail.com`
- Password: `password123`

This is documented in multiple places so both humans and AI agents know the credentials.
