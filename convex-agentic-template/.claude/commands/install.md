# Install & Verify Setup

> Initialize a new project from this template and verify all prerequisites.

## Pre-checks

Before installation, verify the following:

1. Check if `.env` exists in the project root. If not, instruct the user to create it:
   ```bash
   cp .env.sample .env
   ```

2. Check if `app/node_modules` exists. If not, dependencies need to be installed.

## Installation Steps

### 1. Initialize Git (if needed)

```bash
git init
```

### 2. Install Dependencies

```bash
cd app && pnpm install
```

### 3. Copy Environment Files

```bash
./scripts/copy_dot_env.sh
```

## Verification Steps

After installation, verify the setup is complete:

### 1. Check Convex Configuration

Run: `cd app && npx convex env list`

- Look for `AUTH_SECRET` in the output
- If missing, instruct the user:
  ```bash
  npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
  ```

### 2. Check Test User

Run: `cd app && npx convex data users --limit 5`

- Look for `test@mail.com` in the output
- If missing, instruct the user:
  ```bash
  npx convex run seed:seed '{}'
  ```

### 3. Check Convex Files Exist

Verify these files exist:
- `app/convex/auth.ts` - Authentication config
- `app/convex/http.ts` - HTTP routes for auth
- `app/convex/seed.ts` - Test user seeding
- `app/convex/schema.ts` - Database schema

## Read Context

Read these files to understand the project:

```
.claude/commands/prime.md
```

## Report

After verification, output:

1. **Setup Status Summary:**
   - `.env` file: ✅/❌
   - Dependencies installed: ✅/❌
   - AUTH_SECRET configured: ✅/❌
   - Test user seeded: ✅/❌
   - All Convex files present: ✅/❌

2. **If any checks failed**, provide specific commands to fix them.

3. **Remind the user to:**
   - Update `.claude/commands/prime.md` with key project files
   - Configure `scripts/start.sh` for their app
   - Set up GitHub repository for ADW:
     ```bash
     git remote add origin <your-repo-url>
     git push -u origin main
     ```
   - Run `npx convex dev` in a terminal to start the backend
