# Feature: Projects CRUD Backend

## Feature Description
Implement Convex queries and mutations for project management in the Sprint Planner application. This feature provides the backend infrastructure for creating, reading, updating, and deleting projects linked to GitHub repositories. Projects serve as the primary entity for organizing video critique sessions and code analysis workflows.

## User Story
As a Sprint Planner user
I want to create and manage projects linked to my GitHub repositories
So that I can organize video critique sessions and generate Repair Manifests for my codebase

## Problem Statement
The Sprint Planner application requires a backend data layer to persist and manage project entities. Currently, there is no implementation of the project CRUD operations defined in the schema. Without this functionality, users cannot create, view, update, or delete projects, which are essential for the video critique workflow.

## Solution Statement
Implement a complete CRUD (Create, Read, Update, Delete) backend in Convex for the projects table. This includes:
- Query functions for listing and retrieving projects with proper indexing
- Mutation functions for creating, updating, and removing projects
- Authentication checks to ensure users can only access their own data
- Proper timestamp management for audit trails
- Comprehensive unit tests to validate functionality

## Pre-Implementation Analysis

### Environment Requirements
- API keys needed: None (uses existing Convex deployment)
- External services: Convex backend (already configured)
- New environment variables: None

### Blockers & Risks
- Known limitations: None identified
- Potential blockers: None identified
- Dependencies on other features/fixes: Depends on chunk-1 (schema setup - already complete)

### Test Feasibility
- Unit testable: All CRUD operations (list, get, create, update, remove queries/mutations)
- E2E testable: N/A - This is a backend-only feature with no UI components
- Manual verification required: None - all functionality can be unit tested
- Mock requirements: None - using convex-test for isolated database testing

## Relevant Files
Use these files to implement the feature:

- `app/CONVEX.md` - Backend documentation with patterns and best practices for Convex functions
- `app/convex/schema.ts` - Database schema defining the projects table structure and indexes
- `app/tests/README.md` - Test conventions and patterns for unit tests
- `app/tests/helpers/factories.ts` - Test data factories (createTestUser, createTestProject)
- `app/tests/helpers/index.ts` - Test helper re-exports
- `app/tests/unit/convex/projects.test.ts` - Existing test file (needs implementation to match new projects.ts)

### New Files
- `app/convex/projects.ts` - Project CRUD operations (queries and mutations)

## Implementation Plan

### Phase 1: Foundation
Set up the basic file structure and imports for the projects.ts module. Establish the authentication pattern using `getAuthUserId` from `@convex-dev/auth/server`.

### Phase 2: Core Implementation
Implement all CRUD operations:
1. `list` query - Return all projects for authenticated user, sorted by updatedAt descending
2. `get` query - Return single project by ID with ownership validation
3. `create` mutation - Create new project with GitHub fields and timestamps
4. `update` mutation - Update project fields with authorization check
5. `remove` mutation - Hard delete project with authorization check

### Phase 3: Integration
Update the CONVEX.md documentation to reflect the implemented functions. Ensure all tests pass and the module integrates properly with the existing codebase.

## Step by Step Tasks

### Step 1: Create projects.ts with imports and list query
- Create `app/convex/projects.ts`
- Add imports: `query`, `mutation` from `./_generated/server`, `v` from `convex/values`, `getAuthUserId` from `@convex-dev/auth/server`
- Implement `list` query:
  - Get authenticated user ID via `getAuthUserId(ctx)`
  - Return empty array if not authenticated
  - Query projects table using `.withIndex()` if user-specific index exists, or filter by userId
  - Sort by `updatedAt` descending
  - Return array of projects

### Step 2: Implement get query
- Implement `get` query with args: `{ id: v.id("projects") }`
- Get authenticated user ID
- Fetch project by ID using `ctx.db.get(args.id)`
- Return null if project doesn't exist or user is not authenticated
- Optionally validate ownership (return null if user doesn't own the project)

### Step 3: Implement create mutation
- Implement `create` mutation with args:
  - `name: v.string()` (required)
  - `description: v.optional(v.string())`
  - `githubOwner: v.string()` (required)
  - `githubRepo: v.string()` (required)
  - `githubBranch: v.optional(v.string())` (default to "main")
  - `githubAccessToken: v.optional(v.string())`
- Require authentication (throw "Unauthorized" if no user)
- Insert new project with:
  - All provided fields
  - `githubBranch` defaulting to "main" if not provided
  - `createdAt: Date.now()`
  - `updatedAt: Date.now()`
- Return the new project ID

### Step 4: Implement update mutation
- Implement `update` mutation with args:
  - `id: v.id("projects")` (required)
  - `name: v.optional(v.string())`
  - `description: v.optional(v.string())`
  - `githubBranch: v.optional(v.string())`
  - `githubAccessToken: v.optional(v.string())`
  - `lastSyncedCommit: v.optional(v.string())`
  - `architectureLegend: v.optional(v.string())`
- Require authentication
- Fetch existing project and validate it exists
- (Note: Schema doesn't have userId field - projects are shared, no ownership check needed)
- Patch project with provided fields and `updatedAt: Date.now()`

### Step 5: Implement remove mutation
- Implement `remove` mutation with args: `{ id: v.id("projects") }`
- Require authentication
- Fetch project and validate it exists
- Delete project using `ctx.db.delete(args.id)`

### Step 6: Update test factories to match actual schema
- Review `app/tests/helpers/factories.ts`
- Update `createTestProject` factory to match actual schema (remove userId, add GitHub fields)
- Ensure factory creates valid test data

### Step 7: Update unit tests to match implementation
- Update `app/tests/unit/convex/projects.test.ts`
- Remove tests that assume userId ownership (schema doesn't have userId)
- Add tests for GitHub fields
- Ensure all test cases match the actual implementation:
  - `list`: return all projects (no user filtering since no userId in schema)
  - `get`: return project by ID
  - `create`: create with required GitHub fields
  - `update`: update project fields
  - `remove`: delete project

### Step 8: Update CONVEX.md documentation
- Update the Projects section in `app/CONVEX.md`
- Document all implemented functions with their args and return types
- Ensure documentation matches actual implementation

### Step 9: Run validation commands
- Run `cd app && pnpm test` to verify all unit tests pass
- Run `cd app && npx convex typecheck` to verify type safety

## Testing Strategy

### Unit Tests
Location: `app/tests/unit/convex/projects.test.ts`

Test cases for each function:

**list query:**
- Should return empty array when no projects exist
- Should return all projects sorted by updatedAt descending
- Should require authentication (return empty array or throw)

**get query:**
- Should return project by ID
- Should return null for non-existent project
- Should require authentication

**create mutation:**
- Should create project with all required fields
- Should set default githubBranch to "main" if not provided
- Should set createdAt and updatedAt timestamps
- Should throw "Unauthorized" when not authenticated
- Should return the new project ID

**update mutation:**
- Should update provided fields only
- Should update updatedAt timestamp
- Should throw when not authenticated
- Should throw when project doesn't exist

**remove mutation:**
- Should delete project
- Should throw when not authenticated
- Should throw when project doesn't exist

### Edge Cases
- Creating project with maximum length strings
- Updating with empty optional fields
- Deleting already deleted project
- Concurrent updates to same project

### E2E Tests Required
N/A - This is a backend-only feature with no UI components.

## Test Data Strategy

### Data Dependencies
- Test users created via `createTestUser` factory
- Test projects created via `createTestProject` factory with GitHub fields

### Mock Data Approach
Using convex-test with in-memory database. No mocking required - test data is created and destroyed per test using `beforeEach` hooks.

### Cost Implications
None - no external API calls involved in these backend operations.

## Acceptance Criteria
- [ ] All mutations require authentication (throw "Unauthorized" if not authenticated)
- [ ] Queries use indexes where available (`.withIndex()`)
- [ ] Unit tests cover happy path and auth failures
- [ ] `pnpm test` passes with all tests green
- [ ] `npx convex typecheck` passes with no errors
- [ ] CONVEX.md documentation is updated

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

```bash
# Run all unit tests
cd app && pnpm test

# Check Convex types
cd app && npx convex typecheck
```

## Notes
- The current schema does NOT have a `userId` field on the projects table. This means projects are shared/global, not user-specific. The tests and implementation should reflect this.
- If user-specific projects are needed, the schema will need to be updated in a future chunk to add a `userId` field and `by_user` index.
- The existing test file and factories assume userId ownership - these will need to be updated to match the actual schema.
- Hard delete is used for the remove mutation as the schema doesn't have a `status` field for soft delete.
- GitHub fields (`githubOwner`, `githubRepo`, `githubBranch`) are required in the schema and should be required in the create mutation.
