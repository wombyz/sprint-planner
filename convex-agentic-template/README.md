# Agentic Convex Template

An AI-optimized project template for building real-time applications with **Convex** backend and **Next.js** frontend. Includes a complete **AI Developer Workflow (ADW)** system that automates development from GitHub issues to pull requests.

## What is This?

This template gives you:

1. **Convex Backend** - Real-time database, serverless functions, file storage
2. **Next.js Frontend** - React app with App Router, Tailwind, shadcn/ui
3. **ADW System** - AI agents that implement features from GitHub issues
4. **Clear Conventions** - Optimized structure for AI coding agents

```
GitHub Issue → AI Planning → AI Implementation → Tests → Pull Request
```

---

## What is Convex?

[Convex](https://convex.dev) is a backend-as-a-service that provides:

| Feature | Description |
|---------|-------------|
| **Real-time Database** | Data changes automatically sync to all connected clients |
| **Serverless Functions** | Queries, mutations, and actions with full TypeScript support |
| **File Storage** | Built-in blob storage for images, documents |
| **Authentication** | First-party auth with @convex-dev/auth |

### Why Convex for Agentic Development?

1. **Type Safety** - Schema defines types, functions auto-complete correctly
2. **No Migrations** - Schema changes deploy automatically
3. **Single Source of Truth** - Schema.ts defines the entire data model
4. **Real-time by Default** - No WebSocket management needed

### Key Concepts

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                │
│         useQuery() → auto-subscribes to data changes            │
│         useMutation() → optimistic updates                      │
├─────────────────────────────────────────────────────────────────┤
│                           Convex                                 │
│  ┌──────────────┬──────────────┬──────────────┐                 │
│  │   Queries    │  Mutations   │   Actions    │                 │
│  │  (read-only) │   (writes)   │  (Node.js)   │                 │
│  │  cached,     │  transact-   │  external    │                 │
│  │  reactive    │  ional       │  API calls   │                 │
│  └──────────────┴──────────────┴──────────────┘                 │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────┐                │
│  │           Database (schema.ts)               │                │
│  │      Automatic indexes, ACID transactions    │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
.
├── README.md                    # This file
├── .env.sample                  # Environment template
├── .gitignore                   # Git ignore rules
│
├── app/                         # Next.js + Convex application
│   ├── CONVEX.md                # ⭐ Backend documentation (READ THIS)
│   ├── convex/                  # Convex backend
│   │   ├── schema.ts            # ⭐ Database schema (source of truth)
│   │   ├── _README.md           # Convex patterns guide
│   │   ├── auth.ts              # Authentication config
│   │   └── [domain].ts          # Domain functions
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── shared/              # Shared components
│   │   └── features/            # Feature components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities
│   ├── types/                   # TypeScript types
│   └── tests/                   # Test files
│       ├── README.md            # ⭐ Testing conventions
│       ├── helpers/             # Test utilities
│       ├── unit/convex/         # Convex function tests
│       └── e2e/                 # E2E browser tests
│
├── adws/                        # AI Developer Workflow system
│   ├── README.md                # ADW documentation
│   ├── adw_plan_build.py        # Main orchestrator
│   ├── adw_plan_build_test.py   # Full pipeline with tests
│   └── ...
│
├── .claude/                     # Claude Code configuration
│   ├── commands/                # Slash commands
│   │   ├── prime.md             # Context initialization
│   │   ├── test.md              # Run tests
│   │   ├── start.md             # Start servers
│   │   └── ...
│   └── hooks/                   # Lifecycle hooks
│
├── specs/                       # Feature specifications
├── scripts/                     # Utility scripts
└── .github/ISSUE_TEMPLATE/      # GitHub issue templates
```

### Key Files for AI Agents

| File | Purpose | When to Read |
|------|---------|--------------|
| `app/CONVEX.md` | Backend documentation, schema reference | Before ANY backend changes |
| `app/convex/schema.ts` | Database schema definition | When adding/modifying tables |
| `app/tests/README.md` | Testing conventions | When writing tests |
| `.claude/commands/prime.md` | Context initialization | At start of session |

---

## Quick Start

> **Detailed instructions**: See [SETUP.md](SETUP.md) for step-by-step setup with troubleshooting.

### Prerequisites

Before starting, you need:

- **Node.js 18+** and **pnpm**
- **Convex Account** - [Sign up free](https://convex.dev)
- **Claude Code CLI** - [Install](https://docs.anthropic.com/claude-code)
- **GitHub CLI** - `brew install gh`

### 1. Clone and Setup

```bash
# Copy template to new project
cp -r convex-agentic-template my-new-project
cd my-new-project

# Initialize git
git init

# Copy environment file
cp .env.sample .env
```

### 2. Configure Environment

Edit `.env` with your credentials:

```bash
# Required for ADW
ANTHROPIC_API_KEY=sk-ant-...

# Convex (set automatically by npx convex dev)
CONVEX_DEPLOYMENT=your-deployment-name

# Optional
GITHUB_PAT=ghp_...                   # If using different GitHub account
```

### 3. Initialize Convex

```bash
cd app

# Install dependencies
pnpm install

# Initialize Convex (opens browser for login, keep running!)
npx convex dev
```

### 4. Configure Convex Auth (New Terminal)

**CRITICAL**: Authentication won't work without this step!

```bash
cd app

# Set AUTH_SECRET (required for password authentication)
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"

# Seed test user (required for E2E tests)
npx convex run seed:seed '{}'
```

This creates the test account: `test@mail.com` / `password123`

### 5. Start Development

```bash
# From project root
./scripts/start.sh

# Or manually:
# Terminal 1: cd app && npx convex dev
# Terminal 2: cd app && pnpm dev
```

Visit http://localhost:3000 and log in with the test account.

### 6. Setup ADW (Optional)

```bash
# Push to GitHub
git remote add origin <your-repo-url>
git push -u origin main

# Create a GitHub issue and watch ADW implement it!
cd adws && uv run adw_plan_build.py 1
```

---

## Convex Best Practices

### 1. Schema Design

```typescript
// convex/schema.ts
export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("member")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"]),  // ← Always add indexes for query fields

  projects: defineTable({
    userId: v.id("users"),          // ← Reference other tables with v.id()
    name: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),  // ← Compound index
});
```

### 2. Always Use Indexes

```typescript
// ✅ GOOD - Uses index, O(log n)
const projects = await ctx.db
  .query("projects")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();

// ❌ BAD - Full table scan, O(n)
const projects = await ctx.db
  .query("projects")
  .filter((q) => q.eq(q.field("userId"), userId))
  .collect();
```

### 3. Authentication Pattern

```typescript
// convex/projects.ts
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Always check auth first
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("projects", {
      userId,
      name: args.name,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### 4. Parallel Fetches

```typescript
// ✅ GOOD - Parallel execution
const [user, projects, settings] = await Promise.all([
  ctx.db.get(userId),
  ctx.db.query("projects").withIndex("by_user", q => q.eq("userId", userId)).collect(),
  ctx.db.query("settings").withIndex("by_user", q => q.eq("userId", userId)).first(),
]);

// ❌ BAD - Sequential, slower
const user = await ctx.db.get(userId);
const projects = await ctx.db.query("projects")...
```

### 5. Timestamps

```typescript
// Always set both on create
await ctx.db.insert("projects", {
  ...data,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Always update updatedAt on patch
await ctx.db.patch(id, {
  ...updates,
  updatedAt: Date.now(),
});
```

---

## Testing

### Test Structure

```
tests/
├── helpers/              # Shared utilities
│   ├── factories.ts      # createTestUser(), createTestProject()
│   ├── auth.ts           # login(), TEST_USER
│   └── mocks.ts          # mockTime(), createAnthropicMock()
├── unit/convex/          # Convex function tests
│   └── projects.test.ts  # Tests for convex/projects.ts
└── e2e/                  # Browser tests
    ├── run_test.js       # E2E runner
    └── auth.test.js      # Authentication flows
```

### Running Tests

```bash
cd app

# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# E2E tests (requires servers running)
node tests/e2e/run_test.js
```

### Test Credentials

| Field | Value |
|-------|-------|
| Email | test@mail.com |
| Password | password123 |

---

## ADW System

### How It Works

```
1. Create GitHub Issue
   ↓
2. ADW classifies issue (bug/feature/chore)
   ↓
3. Planning agent analyzes codebase
   ↓
4. Implementation agent writes code
   ↓
5. Tests run automatically
   ↓
6. Pull request created
```

### Commands

```bash
cd adws

# Process single issue
uv run adw_plan_build.py 1

# Full pipeline with tests
uv run adw_plan_build_test.py 1

# Continuous monitoring
uv run adw_triggers/trigger_cron.py
```

### Claude Code Commands

| Command | Description |
|---------|-------------|
| `/prime` | Initialize context (read key files) |
| `/test` | Run test suite |
| `/start` | Start dev servers |
| `/feature` | Feature implementation workflow |
| `/bug` | Bug fix workflow |

---

## Common Tasks

### Adding a New Table

1. Edit `app/convex/schema.ts`:
```typescript
myTable: defineTable({
  userId: v.id("users"),
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"]),
```

2. Create `app/convex/myTable.ts` with queries/mutations

3. **Update `app/CONVEX.md`** with the new table documentation

4. Add tests in `app/tests/unit/convex/myTable.test.ts`

### Adding a New Feature

1. Create GitHub issue with requirements
2. Run `uv run adw_plan_build.py <issue-number>`
3. Review generated plan in `specs/`
4. Review and merge PR

### Debugging

```bash
# Convex logs
cd app && npx convex logs

# Convex dashboard
cd app && npx convex dashboard

# Type check
cd app && npx convex typecheck
```

---

## Environment Variables

### Local Environment (`.env` file)

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for ADW |
| `CONVEX_DEPLOYMENT` | Yes | Convex project deployment name |
| `GITHUB_PAT` | No | GitHub token (defaults to `gh auth`) |
| `OPENAI_API_KEY` | No | For Whisper transcription |
| `GOOGLE_GEMINI_API_KEY` | No | For Gemini features |

### Convex Server Environment (set via `npx convex env set`)

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Random secret for signing auth tokens. Generate with: `openssl rand -base64 32` |

**Set AUTH_SECRET:**
```bash
cd app
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
```

> **Note:** `CONVEX_SITE_URL` is automatically set by Convex.

---

## Troubleshooting

### "Could not create account" / Auth Not Working

**Cause:** `AUTH_SECRET` is not set as a Convex server environment variable.

**Fix:**
```bash
cd app
npx convex env set AUTH_SECRET "$(openssl rand -base64 32)"
```

### "Test user does not exist"

**Cause:** Test user hasn't been seeded.

**Fix:**
```bash
cd app
npx convex run seed:seed '{}'
```

### Import Error: "No default export for Password"

**Cause:** Wrong import syntax in `auth.ts`.

**Fix:** Use named import:
```typescript
// Correct
import { Password } from "@convex-dev/auth/providers/Password";

// Wrong
import Password from "@convex-dev/auth/providers/Password";
```

### "Convex not connected"

- Ensure `npx convex dev` is running
- Check `CONVEX_DEPLOYMENT` in `.env`
- Look for errors in Convex terminal

### Type Errors

```bash
# Regenerate types
cd app && npx convex dev

# Check types
cd app && npx convex typecheck
```

### Tests Failing

- Ensure `AUTH_SECRET` is set
- Ensure test user is seeded: `npx convex run seed:seed '{}'`
- Check test credentials: `test@mail.com` / `password123`
- Run single test: `pnpm test -t "test name"`

### ADW Not Working

- Check `ANTHROPIC_API_KEY` is set
- Verify `gh auth login` is authenticated
- Check issue has correct format

---

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex Discord](https://convex.dev/community)
- [Next.js Documentation](https://nextjs.org/docs)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)

---

*Built for Agentic Engineering - where AI agents handle implementation while humans provide direction.*
