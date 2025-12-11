# Convex Backend Documentation

> **CRITICAL FOR AI AGENTS**: This file is the single source of truth for the Convex backend.
> Always read this file before making any backend changes.
> Always UPDATE this file after making backend changes.

## Table of Contents

1. [What is Convex?](#what-is-convex)
2. [Architecture Overview](#architecture-overview)
3. [Schema Reference](#schema-reference)
4. [Functions Reference](#functions-reference)
5. [Authentication](#authentication)
6. [File Storage](#file-storage)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## What is Convex?

Convex is a backend-as-a-service that provides:

- **Real-time Database**: Automatic subscriptions - UI updates instantly when data changes
- **Type-Safe Functions**: Queries, mutations, and actions with full TypeScript support
- **File Storage**: Built-in blob storage for images, documents, etc.
- **Authentication**: First-party auth support with @convex-dev/auth
- **Serverless Functions**: No infrastructure to manage

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Query** | Read-only function, auto-subscribed by React hooks |
| **Mutation** | Write function, modifies database |
| **Action** | Node.js runtime function for external API calls |
| **Internal** | Functions only callable from other Convex functions |
| **Schema** | Type-safe database schema definition |

### How Real-Time Works

```
Client subscribes to query → Convex tracks dependencies →
Data changes → Query re-runs → Client receives update automatically
```

No WebSocket management, no polling - it just works.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js App Router + React + Tailwind + shadcn/ui              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  useQuery(api.projects.list)  →  Real-time subscription         │
│  useMutation(api.projects.create)  →  Optimistic updates        │
│  useAction(api.llm.generate)  →  External API calls             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                         CONVEX                                   │
│  ┌──────────────┬──────────────┬──────────────┐                 │
│  │   Queries    │  Mutations   │   Actions    │                 │
│  │  (read-only) │   (writes)   │  (Node.js)   │                 │
│  └──────────────┴──────────────┴──────────────┘                 │
│                         │                                        │
│                         ▼                                        │
│  ┌─────────────────────────────────────────────┐                │
│  │              Database (schema.ts)            │                │
│  │  Real-time, ACID transactions, auto-indexed │                │
│  └─────────────────────────────────────────────┘                │
│                         │                                        │
│  ┌─────────────────────────────────────────────┐                │
│  │           File Storage (_storage)            │                │
│  │         Images, documents, blobs             │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schema Reference

> **Location**: `convex/schema.ts`

### Tables

#### `users`
Extended authentication table with profile fields.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Display name |
| `email` | `string` | No | Email address |
| `emailVerificationTime` | `number` | No | When email was verified |
| `avatarStorageId` | `Id<"_storage">` | No | Profile image |
| `role` | `"admin" \| "member" \| "viewer"` | No | User role |
| `createdAt` | `number` | No | Creation timestamp |
| `updatedAt` | `number` | No | Last update timestamp |

**Indexes:**
- `by_email` - Query users by email

#### `projects`
GitHub repositories linked for code analysis and review.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Project name (e.g., "ThumbForge") |
| `description` | `string` | No | Project description |
| `githubOwner` | `string` | Yes | GitHub owner (e.g., "liamottley") |
| `githubRepo` | `string` | Yes | GitHub repo name (e.g., "thumbforge") |
| `githubBranch` | `string` | Yes | Branch to sync (default: "main") |
| `githubAccessToken` | `string` | No | Encrypted PAT for private repos |
| `lastSyncedCommit` | `string` | No | Last synced commit SHA |
| `architectureLegend` | `string` | No | Cached Architecture Legend Markdown |
| `createdAt` | `number` | Yes | Creation timestamp |
| `updatedAt` | `number` | Yes | Last update timestamp |

**Indexes:**
- `by_name` - Query projects by name
- `by_owner_repo` - Query projects by GitHub owner and repo

#### `reviews`
Video critique sessions tied to a project snapshot.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectId` | `Id<"projects">` | Yes | Parent project reference |
| `title` | `string` | Yes | Review session title |
| `status` | `union` | Yes | Workflow status (see below) |
| `codeSnapshotCommit` | `string` | No | Git commit hash at time of review |
| `architectureLegendSnapshot` | `string` | No | Copy of legend at review time |
| `videoStorageId` | `Id<"_storage">` | No | Convex storage ID for video |
| `videoGeminiUri` | `string` | No | Gemini File API URI |
| `customInstructions` | `string` | No | User's focus instructions |
| `repairManifest` | `string` | No | Generated Repair Manifest Markdown |
| `createdAt` | `number` | Yes | Creation timestamp |
| `updatedAt` | `number` | Yes | Last update timestamp |

**Status Values:**
- `draft` - Review created, not started
- `syncing_code` - Fetching GitHub repo
- `code_analyzed` - Architecture Legend generated
- `uploading_video` - Video being uploaded
- `analyzing_video` - Video processing in Gemini
- `manifest_generated` - Repair Manifest ready
- `completed` - Review finalized

**Indexes:**
- `by_project_status` - Query reviews by project and status
- `by_project_updated` - Query reviews by project, ordered by update time

### Adding New Tables

```typescript
// In schema.ts, add:
myTable: defineTable({
  userId: v.id("users"),           // Foreign key
  name: v.string(),                 // Required string
  count: v.optional(v.number()),    // Optional number
  tags: v.array(v.string()),        // Array of strings
  metadata: v.optional(v.object({   // Optional nested object
    key: v.string(),
    value: v.any(),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_name", ["name"]),
```

---

## Functions Reference

### Users (`convex/users.ts`)

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `current` | Query | - | `User \| null` | Get current authenticated user |
| `getById` | Query | `{ id }` | `User \| null` | Get user by ID |
| `updateProfile` | Mutation | `{ name?, avatarStorageId? }` | `void` | Update current user's profile |

### Projects (`convex/projects.ts`)

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `list` | Query | - | `Project[]` | List all projects |
| `get` | Query | `{ id }` | `Project \| null` | Get project by ID |
| `create` | Mutation | `{ name, description?, githubOwner, githubRepo, githubBranch?, githubAccessToken? }` | `Id<"projects">` | Create new project linked to GitHub repo |
| `update` | Mutation | `{ id, name?, description?, githubBranch?, githubAccessToken?, lastSyncedCommit?, architectureLegend? }` | `void` | Update project |
| `remove` | Mutation | `{ id }` | `void` | Delete project and associated reviews |

### Reviews (`convex/reviews.ts`)

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `listByProject` | Query | `{ projectId }` | `Review[]` | List reviews for a project, sorted by updatedAt descending |
| `get` | Query | `{ id }` | `Review \| null` | Get review by ID |
| `create` | Mutation | `{ projectId, title, customInstructions? }` | `Id<"reviews">` | Create new review in draft status |
| `update` | Mutation | `{ id, title?, customInstructions? }` | `void` | Update review fields |
| `updateStatus` | Mutation | `{ id, status }` | `void` | Transition review status with validation |
| `remove` | Mutation | `{ id }` | `void` | Delete review |

### Actions (`convex/actions/`)

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `githubSync.syncRepoAndAnalyze` | Action | `{ projectId }` | `{ commit, legendLength }` | Sync GitHub repo and generate Architecture Legend |
| `videoProcess.processVideo` | Action | `{ reviewId, videoStorageId }` | `{ uri, state }` | Upload video to Gemini File API |
| `generateManifest.generateManifest` | Action | `{ reviewId }` | `{ manifestLength }` | Generate Repair Manifest from video + Legend |

### Storage (`convex/storage.ts`)

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `generateUploadUrl` | Mutation | - | `string` | Get URL for file upload |
| `getUrl` | Query | `{ storageId }` | `string \| null` | Get URL for stored file |

---

## Authentication

Using `@convex-dev/auth` with password authentication.

### Configuration

```typescript
// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
});
```

### Getting Current User

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";

export const myFunction = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null; // Not authenticated

    const user = await ctx.db.get(userId);
    return user;
  },
});
```

### Requiring Authentication

```typescript
export const protectedMutation = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // ... rest of function
  },
});
```

### Frontend Usage

```typescript
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

function LoginForm() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn("password", { email, password, flow: "signIn" });
  };
  // ...
}
```

---

## File Storage

Convex provides built-in file storage via `_storage` table.

### Upload Flow

```typescript
// 1. Generate upload URL (mutation)
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// 2. Upload file from frontend
const uploadUrl = await generateUploadUrl();
const response = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});
const { storageId } = await response.json();

// 3. Save storageId to your table
await saveFile({ storageId, name: file.name });
```

### Get File URL

```typescript
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

### Delete File

```typescript
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});
```

---

## Best Practices

### 1. Index Usage

```typescript
// ✅ GOOD - Uses index, fast
const projects = await ctx.db
  .query("projects")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();

// ❌ BAD - Full table scan, slow
const projects = await ctx.db
  .query("projects")
  .filter((q) => q.eq(q.field("userId"), userId))
  .collect();
```

### 2. Parallel Fetches

```typescript
// ✅ GOOD - Parallel execution
const [user, projects] = await Promise.all([
  ctx.db.get(userId),
  ctx.db.query("projects").withIndex("by_user", q => q.eq("userId", userId)).collect(),
]);

// ❌ BAD - Sequential, slower
const user = await ctx.db.get(userId);
const projects = await ctx.db.query("projects")...
```

### 3. Optimistic Updates

```typescript
// Frontend - shows result before server confirms
const createProject = useMutation(api.projects.create)
  .withOptimisticUpdate((localStore, args) => {
    const existing = localStore.getQuery(api.projects.list, {});
    if (existing) {
      localStore.setQuery(api.projects.list, {}, [
        ...existing,
        { _id: "temp", ...args, status: "draft" },
      ]);
    }
  });
```

### 4. Error Handling

```typescript
// ✅ GOOD - Descriptive, actionable errors
if (!project) {
  throw new Error(`Project not found: ${args.id}`);
}
if (project.userId !== userId) {
  throw new Error("Not authorized to modify this project");
}

// ❌ BAD - Generic, unhelpful
if (!project) throw new Error("Error");
```

### 5. Timestamps

```typescript
// Always update timestamps
await ctx.db.patch(id, {
  ...updates,
  updatedAt: Date.now(),
});

// Always set both on create
await ctx.db.insert("projects", {
  ...data,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

---

## Common Patterns

### Pagination

```typescript
export const list = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("projects")
      .order("desc")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: args.limit ?? 20,
      });

    return {
      items: results.page,
      nextCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});
```

### Soft Deletes

```typescript
// Schema
status: v.union(v.literal("active"), v.literal("deleted")),

// Query active only
.withIndex("by_status", (q) => q.eq("status", "active"))

// "Delete" = mark as deleted
await ctx.db.patch(id, { status: "deleted", updatedAt: Date.now() });
```

### Aggregations

```typescript
// Count items
const count = (await ctx.db
  .query("projects")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect()).length;

// Note: For large datasets, consider storing counts separately
```

### Scheduled Functions

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup old data",
  { hours: 24 },
  internal.cleanup.removeOldData
);

export default crons;
```

---

## Troubleshooting

### "Document not found"
- Check if the ID is valid and exists
- Check if the document was deleted
- Check if you're querying the right table

### "Unauthorized"
- Verify user is authenticated: `getAuthUserId(ctx)`
- Check the user has permission for the operation
- Verify the auth token hasn't expired

### "Too many reads" / Performance Issues
- Add missing indexes to schema
- Use `.withIndex()` instead of `.filter()`
- Use `Promise.all()` for parallel fetches
- Paginate large result sets

### Type Errors
- Run `npx convex dev` to regenerate types
- Ensure schema.ts matches your queries/mutations
- Check that argument validators match usage

### Real-time Not Updating
- Verify you're using `useQuery` (not a manual fetch)
- Check that the query arguments are stable (memoize if needed)
- Ensure the mutation is modifying the data the query depends on

---

## Quick Reference

### Import Patterns

```typescript
// Server-side (in convex/)
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Client-side (in app/)
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
```

### CLI Commands

```bash
npx convex dev          # Start dev server (auto-sync)
npx convex deploy       # Deploy to production
npx convex typecheck    # Check types without deploying
npx convex logs         # View function logs
npx convex dashboard    # Open web dashboard
```

---

> **REMEMBER**: Update this file when you modify the Convex backend!
