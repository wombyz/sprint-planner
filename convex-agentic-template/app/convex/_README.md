# Convex Backend

This directory contains all Convex backend code: schema, queries, mutations, actions, and internal functions.

## Directory Structure

```
convex/
├── _README.md           # This file
├── _generated/          # Auto-generated types (DO NOT EDIT)
├── schema.ts            # Database schema definition (READ THIS FIRST)
├── auth.ts              # Authentication configuration
├── http.ts              # HTTP routes (webhooks, etc.)
│
├── users.ts             # User queries/mutations
├── projects.ts          # Project queries/mutations
├── [domain].ts          # Domain-specific functions
│
└── lib/                 # Shared utilities
    ├── utils.ts         # Common helpers
    └── validators.ts    # Shared validators
```

## File Naming Conventions

| File Pattern | Purpose |
|--------------|---------|
| `schema.ts` | Database schema definition |
| `[domain].ts` | Queries/mutations for a domain (e.g., `users.ts`, `projects.ts`) |
| `[domain]Actions.ts` | Actions (Node.js runtime) for a domain |
| `lib/*.ts` | Shared utilities and helpers |
| `_*.ts` | Internal files (not exported to client) |

## Function Types

### Queries (Read-only)
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### Mutations (Write operations)
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
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

### Actions (Node.js runtime - for external APIs)
```typescript
"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const callExternalAPI = action({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    // Can use Node.js APIs, npm packages, external services
    const response = await fetch("https://api.example.com/...");
    return await response.json();
  },
});
```

### Internal Functions (Not callable from client)
```typescript
import { internalQuery, internalMutation, internalAction } from "./_generated/server";

export const internalHelper = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Only callable from other Convex functions
  },
});
```

## Best Practices

### 1. Always Validate Authentication
```typescript
import { getAuthUserId } from "@convex-dev/auth/server";

export const myMutation = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    // ...
  },
});
```

### 2. Use Indexes for Queries
```typescript
// GOOD - Uses index
const projects = await ctx.db
  .query("projects")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();

// BAD - Full table scan
const projects = await ctx.db
  .query("projects")
  .filter((q) => q.eq(q.field("userId"), userId))
  .collect();
```

### 3. Batch Operations When Possible
```typescript
// GOOD - Parallel fetches
const [user, projects, settings] = await Promise.all([
  ctx.db.get(userId),
  ctx.db.query("projects").withIndex("by_user", q => q.eq("userId", userId)).collect(),
  ctx.db.query("settings").withIndex("by_user", q => q.eq("userId", userId)).first(),
]);

// BAD - Sequential fetches
const user = await ctx.db.get(userId);
const projects = await ctx.db.query("projects")...
const settings = await ctx.db.query("settings")...
```

### 4. Handle Timestamps Consistently
```typescript
// In mutations, always update timestamps
await ctx.db.patch(id, {
  ...updates,
  updatedAt: Date.now(),
});

// In creates, set both
await ctx.db.insert("table", {
  ...data,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

### 5. Use Proper Error Messages
```typescript
// GOOD - Descriptive errors
if (!project) throw new Error(`Project not found: ${projectId}`);
if (project.userId !== userId) throw new Error("Not authorized to access this project");

// BAD - Generic errors
if (!project) throw new Error("Error");
```

## Common Patterns

### Pagination
```typescript
export const list = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const results = await ctx.db
      .query("projects")
      .order("desc")
      .paginate({ cursor: args.cursor ?? null, numItems: limit });
    return results;
  },
});
```

### Soft Deletes
```typescript
// Schema
status: v.union(v.literal("active"), v.literal("deleted")),

// Query - exclude deleted
.withIndex("by_status", (q) => q.eq("status", "active"))

// "Delete" mutation
await ctx.db.patch(id, { status: "deleted", updatedAt: Date.now() });
```

### File Storage
```typescript
// Generate upload URL
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

## Testing Convex Functions

See `../tests/unit/convex/` for unit tests and `../tests/e2e/` for E2E tests.

```typescript
// Unit test example
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("create project", async () => {
  const t = convexTest(schema);
  // ... test implementation
});
```
