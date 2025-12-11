# Project Setup Guide

This guide walks you through setting up a new project from this template.

## Prerequisites

Before starting, ensure you have:

- [ ] **Node.js 18+** - [Download](https://nodejs.org/)
- [ ] **pnpm** - Install: `npm install -g pnpm`
- [ ] **Convex Account** - [Sign up](https://convex.dev) (free tier available)
- [ ] **GitHub Account** - For ADW integration
- [ ] **Claude Code CLI** - [Install](https://docs.anthropic.com/claude-code)
- [ ] **GitHub CLI** - `brew install gh` or [Download](https://cli.github.com/)

---

## Setup Steps

### Step 1: Clone and Initialize

```bash
# Copy template to new project
cp -r convex-agentic-template my-new-project
cd my-new-project

# Initialize git repository
git init

# Copy environment file
cp .env.sample .env
```

### Step 2: Install Dependencies

```bash
cd app
pnpm install
```

### Step 3: Initialize Convex (Interactive)

This step opens your browser to log in to Convex and create a project:

```bash
npx convex dev
```

**What happens:**
1. Opens browser for Convex login/signup
2. Prompts you to create or select a project
3. Deploys schema to Convex
4. Starts watching for changes

> **Keep this terminal running!** Open a new terminal for the next steps.

### Step 4: Set Auth Secret (New Terminal)

**CRITICAL**: Authentication won't work without this step.

```bash
cd app
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
```

This sets a server-side secret used to sign authentication tokens.

### Step 5: Seed Test User

**Required for E2E tests** - creates the standard test account:

```bash
npx convex run seed:seed '{}'
```

This creates:
- **Email:** `test@mail.com`
- **Password:** `password123`

### Step 6: Verify Setup

Run these commands to confirm everything is configured:

```bash
# Check AUTH_SECRET is set
npx convex env list
# Should show: AUTH_SECRET=...

# Check test user exists
npx convex data users
# Should show: test@mail.com
```

### Step 7: Start Development

You need two terminals running:

**Terminal 1 - Convex Backend:**
```bash
cd app
npx convex dev
```

**Terminal 2 - Next.js Frontend:**
```bash
cd app
pnpm dev
```

Or use the combined start script:
```bash
./scripts/start.sh
```

### Step 8: Test Login

1. Visit http://localhost:3000
2. Log in with test credentials:
   - Email: `test@mail.com`
   - Password: `password123`
3. You should see the dashboard

---

## Optional: GitHub & ADW Setup

### Push to GitHub

```bash
# Create GitHub repository (requires gh CLI)
gh repo create my-new-project --private --source=. --remote=origin

# Or add existing remote
git remote add origin https://github.com/username/my-new-project.git

# Initial commit
git add .
git commit -m "Initial commit from convex-agentic-template"
git push -u origin main
```

### Configure ADW

Set your GitHub repo URL:

```bash
export GITHUB_REPO_URL="https://github.com/username/my-new-project"
```

Test ADW with an issue:

```bash
cd adws
uv run adw_plan_build.py 1
```

---

## Setup Checklist

Use this checklist to ensure complete setup:

- [ ] `.env` file created from `.env.sample`
- [ ] Dependencies installed (`pnpm install`)
- [ ] Convex initialized (`npx convex dev` ran successfully)
- [ ] `AUTH_SECRET` set via `npx convex env set`
- [ ] Test user seeded (`npx convex run seed:seed '{}'`)
- [ ] Can log in with `test@mail.com` / `password123`
- [ ] GitHub repository created (optional)
- [ ] ADW configured with `GITHUB_REPO_URL` (optional)

---

## Troubleshooting

### "Could not create account" or Auth Not Working

`AUTH_SECRET` is not set. Run:
```bash
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
```

### "Test user does not exist"

Run the seed script:
```bash
npx convex run seed:seed '{}'
```

### "Convex not connected"

Ensure `npx convex dev` is running in a terminal.

### Import Error: "No default export for Password"

Check `app/convex/auth.ts` uses the named import:
```typescript
// Correct
import { Password } from "@convex-dev/auth/providers/Password";

// Wrong
import Password from "@convex-dev/auth/providers/Password";
```

### Can't find `npx convex` command

Ensure you're in the `app/` directory and dependencies are installed:
```bash
cd app
pnpm install
```

---

## Next Steps

After setup is complete:

1. **Read `app/CONVEX.md`** - Understand the backend architecture
2. **Explore `app/convex/schema.ts`** - Modify for your domain
3. **Update `.claude/commands/prime.md`** - Add your key files
4. **Configure `scripts/start.sh`** - Customize dev server startup
5. **Create your first feature** - Open a GitHub issue and run ADW

---

*For more details, see the [README.md](README.md) and [app/CONVEX.md](app/CONVEX.md).*
