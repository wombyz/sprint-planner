# Feature: Reviews CRUD Backend

## Feature Description
Implement Convex queries and mutations for review management in the Sprint Planner application. Reviews are video critique sessions tied to a project snapshot, tracking the workflow from draft through video processing to manifest generation. This feature provides the backend infrastructure for creating, reading, updating, and deleting reviews, with proper status transition validation to ensure the review workflow progresses correctly.

## User Story
As a Sprint Planner user
I want to create and manage review sessions for my projects
So that I can record video critiques and generate Repair Manifests for my codebase

## Problem Statement
The Sprint Planner application has a defined reviews schema with status workflow states, but lacks the CRUD operations to manage review entities. Without this functionality, users cannot create review sessions, update their status as they progress through the workflow, or manage existing reviews. The status state machine needs enforcement to prevent invalid transitions (e.g., jumping from draft to manifest_generated).

## Solution Statement
Implement a complete CRUD backend in Convex for the reviews table, including:
- Query functions for listing reviews by project and retrieving individual reviews with project details
- Mutation functions for creating, updating, and removing reviews
- A dedicated `updateStatus` mutation with state machine validation
- Project ownership validation to ensure users can only access reviews for projects they have access to
- Proper timestamp management for audit trails
- Comprehensive unit tests to validate functionality and status transitions

## Pre-Implementation Analysis

### Environment Requirements
- API keys needed: None (uses existing Convex deployment)
- External services: Convex backend (already configured)
- New environment variables: None

### Blockers & Risks
- Known limitations: None identified
- Potential blockers: None identified
- Dependencies on other features/fixes: Depends on chunk-2 (Projects CRUD Backend - already complete)

### Test Feasibility
- Unit testable: All CRUD operations (listByProject, get, create, update, updateStatus, remove), status transition validation logic
- E2E testable: N/A - This is a backend-only feature with no UI components
- Manual verification required: None - all functionality can be unit tested
- Mock requirements: None - using convex-test for isolated database testing

## Relevant Files
Use these files to implement the feature:

- `app/CONVEX.md` - Backend documentation with patterns and best practices for Convex functions. **Must be updated after implementation.**
- `app/convex/schema.ts` - Database schema defining the reviews table structure, status union type, and indexes (`by_project_status`, `by_project_updated`)
- `app/convex/projects.ts` - Existing projects CRUD implementation to follow as a pattern for reviews
- `app/tests/README.md` - Test conventions and patterns for unit tests
- `app/tests/helpers/factories.ts` - Test data factories (createTestUser, createTestProject). **Must add createTestReview factory.**
- `app/tests/helpers/index.ts` - Test helper re-exports
- `app/tests/unit/convex/projects.test.ts` - Existing project tests to follow as a pattern for reviews tests

### New Files
- `app/convex/reviews.ts` - Review CRUD operations (queries and mutations)
- `app/tests/unit/convex/reviews.test.ts` - Unit tests for reviews functions

## Implementation Plan

### Phase 1: Foundation
Set up the basic file structure and imports for the reviews.ts module. Establish the authentication pattern using `getAuthUserId` from `@convex-dev/auth/server`. Define the valid status transitions for the state machine.

### Phase 2: Core Implementation
Implement all CRUD operations:
1. `listByProject` query - Return reviews for a specific project, sorted by updatedAt descending
2. `get` query - Return single review by ID with project details
3. `create` mutation - Create new review in "draft" status
4. `update` mutation - Update review fields (title, customInstructions)
5. `updateStatus` mutation - Transition review status with validation
6. `remove` mutation - Delete review

### Phase 3: Integration
Create unit tests, add test factories, and update the CONVEX.md documentation to reflect the implemented functions.

## Step by Step Tasks

### Step 1: Create reviews.ts with imports and status transition map
- Create `app/convex/reviews.ts`
- Add imports: `query`, `mutation` from `./_generated/server`, `v` from `convex/values`, `getAuthUserId` from `@convex-dev/auth/server`
- Define the valid status transitions map as a constant:
  ```typescript
  const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    draft: ["syncing_code"],
    syncing_code: ["code_analyzed"],
    code_analyzed: ["uploading_video"],
    uploading_video: ["analyzing_video"],
    analyzing_video: ["manifest_generated"],
    manifest_generated: ["completed"],
    completed: [], // Terminal state
  };
  ```

### Step 2: Implement listByProject query
- Implement `listByProject` query with args: `{ projectId: v.id("projects") }`
- Get authenticated user ID via `getAuthUserId(ctx)`
- Return empty array if not authenticated
- Verify project exists using `ctx.db.get(projectId)`
- Return empty array if project doesn't exist
- Query reviews using `.withIndex("by_project_updated", (q) => q.eq("projectId", projectId))`
- Sort by `updatedAt` descending
- Return array of reviews

### Step 3: Implement get query
- Implement `get` query with args: `{ id: v.id("reviews") }`
- Get authenticated user ID
- Return null if not authenticated
- Fetch review by ID using `ctx.db.get(args.id)`
- Return null if review doesn't exist
- Fetch associated project using `ctx.db.get(review.projectId)`
- Return review with project details (or just return the review - let the frontend fetch project if needed)

### Step 4: Implement create mutation
- Implement `create` mutation with args:
  - `projectId: v.id("projects")` (required)
  - `title: v.string()` (required)
  - `customInstructions: v.optional(v.string())`
- Require authentication (throw "Unauthorized" if no user)
- Verify project exists (throw "Project not found" if doesn't exist)
- Insert new review with:
  - `projectId`, `title`, `customInstructions`
  - `status: "draft"` (always start in draft)
  - `createdAt: Date.now()`
  - `updatedAt: Date.now()`
- Return the new review ID

### Step 5: Implement update mutation
- Implement `update` mutation with args:
  - `id: v.id("reviews")` (required)
  - `title: v.optional(v.string())`
  - `customInstructions: v.optional(v.string())`
- Require authentication
- Fetch existing review and validate it exists (throw "Review not found")
- Verify associated project exists (throw "Project not found")
- Patch review with provided fields and `updatedAt: Date.now()`

### Step 6: Implement updateStatus mutation
- Implement `updateStatus` mutation with args:
  - `id: v.id("reviews")` (required)
  - `status: v.union(v.literal("draft"), v.literal("syncing_code"), v.literal("code_analyzed"), v.literal("uploading_video"), v.literal("analyzing_video"), v.literal("manifest_generated"), v.literal("completed"))`
- Require authentication
- Fetch existing review (throw "Review not found" if doesn't exist)
- Validate status transition using `VALID_STATUS_TRANSITIONS`:
  - Get current status from review
  - Check if new status is in the allowed transitions array
  - Throw "Invalid status transition from X to Y" if not allowed
- Patch review with new status and `updatedAt: Date.now()`

### Step 7: Implement remove mutation
- Implement `remove` mutation with args: `{ id: v.id("reviews") }`
- Require authentication
- Fetch review and validate it exists (throw "Review not found")
- Verify associated project exists (throw "Project not found")
- Delete review using `ctx.db.delete(args.id)`

### Step 8: Add createTestReview factory
- Update `app/tests/helpers/factories.ts`
- Add `createTestReview` factory function:
  ```typescript
  export async function createTestReview(
    t: ConvexTestInstance,
    projectId: Id<"projects">,
    overrides: {
      title?: string;
      status?: "draft" | "syncing_code" | "code_analyzed" | "uploading_video" | "analyzing_video" | "manifest_generated" | "completed";
      customInstructions?: string;
      codeSnapshotCommit?: string;
      architectureLegendSnapshot?: string;
      videoStorageId?: Id<"_storage">;
      videoGeminiUri?: string;
      repairManifest?: string;
    } = {}
  ): Promise<Id<"reviews">>
  ```
- Include sensible defaults (title: "Test Review", status: "draft")

### Step 9: Create unit tests for reviews
- Create `app/tests/unit/convex/reviews.test.ts`
- Follow the pattern from `app/tests/unit/convex/projects.test.ts`
- Test cases:

**listByProject query:**
- Should return empty array when no reviews exist for project
- Should return reviews for a specific project sorted by updatedAt descending
- Should not return reviews from other projects
- Should return empty array when not authenticated
- Should return empty array when project doesn't exist

**get query:**
- Should return review by ID
- Should return null for non-existent review
- Should return null when not authenticated

**create mutation:**
- Should create review in draft status
- Should throw "Unauthorized" when not authenticated
- Should throw "Project not found" when project doesn't exist
- Should set createdAt and updatedAt timestamps
- Should return the new review ID

**update mutation:**
- Should update title field
- Should update customInstructions field
- Should update updatedAt timestamp
- Should throw when not authenticated
- Should throw "Review not found" when review doesn't exist

**updateStatus mutation:**
- Should transition from draft to syncing_code
- Should transition from syncing_code to code_analyzed
- Should transition from code_analyzed to uploading_video
- Should transition from uploading_video to analyzing_video
- Should transition from analyzing_video to manifest_generated
- Should transition from manifest_generated to completed
- Should throw "Invalid status transition" for invalid transitions (e.g., draft to manifest_generated)
- Should throw "Invalid status transition" for backward transitions (e.g., completed to draft)
- Should throw when not authenticated
- Should throw "Review not found" when review doesn't exist

**remove mutation:**
- Should delete review
- Should throw when not authenticated
- Should throw "Review not found" when review doesn't exist

### Step 10: Update CONVEX.md documentation
- Update the Reviews section in `app/CONVEX.md`
- Add/update the Functions Reference table for Reviews:
  | Function | Type | Args | Returns | Description |
  |----------|------|------|---------|-------------|
  | `listByProject` | Query | `{ projectId }` | `Review[]` | List reviews for a project, sorted by updatedAt |
  | `get` | Query | `{ id }` | `Review \| null` | Get review by ID |
  | `create` | Mutation | `{ projectId, title, customInstructions? }` | `Id<"reviews">` | Create new review in draft status |
  | `update` | Mutation | `{ id, title?, customInstructions? }` | `void` | Update review fields |
  | `updateStatus` | Mutation | `{ id, status }` | `void` | Transition review status with validation |
  | `remove` | Mutation | `{ id }` | `void` | Delete review |

### Step 11: Run validation commands
- Run `cd app && pnpm test` to verify all unit tests pass
- Run `cd app && npx convex typecheck` to verify type safety

## Testing Strategy

### Unit Tests
Location: `app/tests/unit/convex/reviews.test.ts`

Test cases for each function:

**listByProject query:**
- Should return empty array when no reviews exist for project
- Should return reviews sorted by updatedAt descending
- Should require authentication

**get query:**
- Should return review by ID
- Should return null for non-existent review
- Should require authentication

**create mutation:**
- Should create review in draft status with required fields
- Should set timestamps
- Should throw "Unauthorized" when not authenticated
- Should throw "Project not found" for invalid projectId

**update mutation:**
- Should update provided fields only
- Should update updatedAt timestamp
- Should throw when not authenticated
- Should throw when review doesn't exist

**updateStatus mutation:**
- Should allow valid forward transitions
- Should reject invalid transitions (skip states)
- Should reject backward transitions
- Should throw when not authenticated
- Should throw when review doesn't exist

**remove mutation:**
- Should delete review
- Should throw when not authenticated
- Should throw when review doesn't exist

### Edge Cases
- Creating review for non-existent project
- Updating review that was just deleted
- Status transition from terminal state (completed)
- Concurrent status updates to same review
- Review with all optional fields populated vs minimal

### E2E Tests Required
N/A - This is a backend-only feature with no UI components.

## Test Data Strategy

### Data Dependencies
- Test users created via `createTestUser` factory
- Test projects created via `createTestProject` factory (required for reviews to reference)
- Test reviews created via `createTestReview` factory (to be added)

### Mock Data Approach
Using convex-test with in-memory database. No mocking required - test data is created and destroyed per test using `beforeEach` hooks.

### Cost Implications
None - no external API calls involved in these backend operations.

## Acceptance Criteria
- [ ] Reviews linked to valid projects (projectId validated on create)
- [ ] Status transitions validated (state machine enforced)
- [ ] All mutations require authentication (throw "Unauthorized" if not authenticated)
- [ ] Cannot access reviews from other users' projects (project existence validated)
- [ ] Unit tests pass for all CRUD operations
- [ ] Unit tests pass for all status transition scenarios (valid and invalid)
- [ ] `pnpm test` passes with all tests green
- [ ] `npx convex typecheck` passes with no errors
- [ ] CONVEX.md documentation is updated with Reviews functions

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

```bash
# Run all unit tests
cd app && pnpm test

# Check Convex types
cd app && npx convex typecheck
```

## Notes
- The status field uses a union type with 7 possible values: draft, syncing_code, code_analyzed, uploading_video, analyzing_video, manifest_generated, completed
- Status transitions follow a linear workflow - reviews cannot skip states or go backward
- The `updateStatus` mutation is separate from `update` to keep status transition logic isolated and explicit
- The schema has two indexes on reviews: `by_project_status` (for filtering by project and status) and `by_project_updated` (for listing reviews sorted by time)
- Projects don't have userId field, so we cannot validate "ownership" per se. Any authenticated user can access any project and its reviews. This may be addressed in a future multi-tenancy update.
- Hard delete is used for the remove mutation as the schema doesn't have a `deletedAt` field for soft delete.
- The `get` query returns the review without joining project details - frontend can fetch project separately if needed via `projects.get`.
