# Prime

> Execute the following sections to understand the codebase then summarize your understanding.

## Run

git ls-files

## Read

README.md
adws/README.md
app/CONVEX.md
app/convex/schema.ts
app/tests/README.md

## Important

### Convex Backend Documentation

The `app/CONVEX.md` file is the **single source of truth** for the Convex backend. It contains:
- Schema reference (all tables, fields, indexes)
- Functions reference (all queries, mutations, actions)
- Authentication patterns
- Best practices and common patterns

**You MUST:**
1. Read `app/CONVEX.md` before making any backend changes
2. Update `app/CONVEX.md` after making backend changes
3. Keep schema.ts and CONVEX.md in sync

### Test Infrastructure

See `app/tests/README.md` for testing conventions:
- Unit tests go in `app/tests/unit/convex/[module].test.ts`
- E2E tests go in `app/tests/e2e/[feature].test.js`
- Use factories from `app/tests/helpers/factories.ts`

### Key Patterns

- **Queries**: Read-only, auto-subscribed by frontend
- **Mutations**: Write operations, require auth check
- **Actions**: Node.js runtime for external APIs
- **Indexes**: Always use `.withIndex()` not `.filter()`
