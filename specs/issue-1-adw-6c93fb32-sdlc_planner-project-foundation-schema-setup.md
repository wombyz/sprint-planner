# Feature: Project Foundation & Schema Setup

## Feature Description
Update the existing Convex project with Sprint Planner-specific schema including projects table with GitHub integration fields and reviews table for video critique workflow management. This is the foundation chunk that establishes the database structure for the entire Sprint Planner application.

## User Story
As a developer using Sprint Planner
I want a properly configured database schema with projects and reviews tables
So that I can store GitHub repository information and video critique sessions

## Problem Statement
The current schema.ts has a basic projects table that lacks the Sprint Planner-specific fields needed for GitHub integration (githubOwner, githubRepo, githubBranch, etc.) and doesn't include the reviews table required for the video critique workflow. Without these, the application cannot store the data structures needed for its core functionality.

## Solution Statement
Update the schema.ts file to add Sprint Planner-specific fields to the projects table (GitHub integration fields, architectureLegend cache) and add the reviews table with all required status states for the video critique workflow. Create appropriate indexes for efficient querying and update the CONVEX.md documentation to reflect the implemented schema.

## Pre-Implementation Analysis

### Environment Requirements
- API keys needed: None - this is schema-only work
- External services: Convex deployment (already configured)
- New environment variables: None

### Blockers & Risks
- Known limitations: None identified
- Potential blockers: None identified - this is foundational work with no dependencies
- Dependencies on other features/fixes: None (this is the foundation chunk)

### Test Feasibility
- Unit testable: Schema validation via `npx convex typecheck`
- E2E testable: Not applicable - schema-only changes with no UI
- Manual verification required: Verifying tables are visible in Convex dashboard
- Mock requirements: None - no external API calls

## Relevant Files
Use these files to implement the feature:

- `app/convex/schema.ts`: The main schema definition file that needs to be updated with Sprint Planner-specific fields for projects table and new reviews table
- `app/CONVEX.md`: Backend documentation that already contains the target schema documentation and needs to be verified/kept in sync

### Files Already Reviewed
- `README.md`: Provides system architecture overview showing the data flow and table relationships
- `app/CONVEX.md`: Already has complete documentation for the target schema with all fields and indexes defined - this serves as the specification

## Implementation Plan

### Phase 1: Foundation
Review the existing schema.ts and CONVEX.md to understand the gap between current implementation and documented target state.

### Phase 2: Core Implementation
1. Update the projects table in schema.ts to add:
   - Remove `userId` field (projects are not user-scoped per the documentation)
   - Add `githubOwner` (required string)
   - Add `githubRepo` (required string)
   - Add `githubBranch` (required string)
   - Add `githubAccessToken` (optional string for private repos)
   - Add `lastSyncedCommit` (optional string)
   - Add `architectureLegend` (optional string for cached legend)
   - Update indexes to `by_name` and `by_owner_repo`

2. Add the reviews table with:
   - `projectId` (required - reference to projects)
   - `title` (required string)
   - `status` (union of all workflow states)
   - `codeSnapshotCommit` (optional string)
   - `architectureLegendSnapshot` (optional string)
   - `videoStorageId` (optional storage reference)
   - `videoGeminiUri` (optional string)
   - `customInstructions` (optional string)
   - `repairManifest` (optional string)
   - `createdAt` and `updatedAt` timestamps
   - Indexes: `by_project_status` and `by_project_updated`

### Phase 3: Integration
Deploy the schema to Convex and verify the tables are created correctly with all indexes.

## Step by Step Tasks

### Task 1: Update projects table schema
- Open `app/convex/schema.ts`
- Modify the projects table definition to match the CONVEX.md specification:
  - Remove `userId` field
  - Remove `status` field
  - Keep `name` (required)
  - Keep `description` (optional)
  - Add `githubOwner: v.string()` (required)
  - Add `githubRepo: v.string()` (required)
  - Add `githubBranch: v.string()` (required)
  - Add `githubAccessToken: v.optional(v.string())`
  - Add `lastSyncedCommit: v.optional(v.string())`
  - Add `architectureLegend: v.optional(v.string())`
  - Keep `createdAt` and `updatedAt`
- Update indexes:
  - Remove `by_user`, `by_status`, `by_user_status`
  - Add `.index("by_name", ["name"])`
  - Add `.index("by_owner_repo", ["githubOwner", "githubRepo"])`

### Task 2: Add reviews table schema
- In `app/convex/schema.ts`, add the reviews table after projects:
```typescript
reviews: defineTable({
  projectId: v.id("projects"),
  title: v.string(),
  status: v.union(
    v.literal("draft"),
    v.literal("syncing_code"),
    v.literal("code_analyzed"),
    v.literal("uploading_video"),
    v.literal("analyzing_video"),
    v.literal("manifest_generated"),
    v.literal("completed")
  ),
  codeSnapshotCommit: v.optional(v.string()),
  architectureLegendSnapshot: v.optional(v.string()),
  videoStorageId: v.optional(v.id("_storage")),
  videoGeminiUri: v.optional(v.string()),
  customInstructions: v.optional(v.string()),
  repairManifest: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_project_status", ["projectId", "status"])
  .index("by_project_updated", ["projectId", "updatedAt"]),
```

### Task 3: Run Convex typecheck
- Execute `cd app && npx convex typecheck` to validate the schema
- Fix any type errors that arise

### Task 4: Deploy schema to Convex
- Execute `cd app && npx convex dev` to deploy the schema
- This will create/update the tables in the Convex database

### Task 5: Verify CONVEX.md documentation
- Review `app/CONVEX.md` to ensure it matches the implemented schema
- The documentation already has the target schema, so verify no updates are needed
- If any discrepancies exist between implementation and docs, update CONVEX.md

### Task 6: Run validation commands
- Execute all validation commands to confirm zero regressions

## Testing Strategy

### Unit Tests
- No unit tests needed for schema-only changes
- Schema validation is handled by Convex typecheck

### Edge Cases
- Convex handles schema validation automatically
- Index creation is validated during deployment

### E2E Tests Required
- None required - this is a schema-only foundation chunk with no UI changes

## Test Data Strategy
### Data Dependencies
- N/A - schema-only changes, no E2E tests needed

### Mock Data Approach
- N/A - tests can use real data created during test flow when future features are implemented

### Cost Implications
- N/A - no API calls in this chunk

## Acceptance Criteria
- [ ] `npx convex typecheck` passes with no errors
- [ ] Schema deployed successfully via `npx convex dev`
- [ ] Projects table has all Sprint Planner fields: name, description, githubOwner, githubRepo, githubBranch, githubAccessToken, lastSyncedCommit, architectureLegend, createdAt, updatedAt
- [ ] Projects table has indexes: by_name, by_owner_repo
- [ ] Reviews table exists with all fields: projectId, title, status, codeSnapshotCommit, architectureLegendSnapshot, videoStorageId, videoGeminiUri, customInstructions, repairManifest, createdAt, updatedAt
- [ ] Reviews table has all status values: draft, syncing_code, code_analyzed, uploading_video, analyzing_video, manifest_generated, completed
- [ ] Reviews table has indexes: by_project_status, by_project_updated
- [ ] CONVEX.md documentation matches implemented schema

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- `cd /Users/liamottley/dev/sprint-planner/app && npx convex typecheck` - Validate schema types are correct
- `cd /Users/liamottley/dev/sprint-planner/app && npx convex dev --once` - Deploy schema and verify successful deployment

## Notes
- The CONVEX.md documentation already contains the complete target schema specification. This serves as the source of truth for what needs to be implemented.
- The existing projects table in schema.ts has a `userId` field and `status` field that are not in the target schema - these should be removed as they don't apply to the Sprint Planner domain model.
- No frontend changes are needed for this chunk - it's purely database schema setup.
- Future chunks will build CRUD operations and UI on top of this schema foundation.
