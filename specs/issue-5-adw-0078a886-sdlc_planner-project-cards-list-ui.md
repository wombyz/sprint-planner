# Feature: Project Cards & List UI

## Feature Description
Display projects in the dashboard using a responsive grid of cards that show key project information. Each card displays the project name, GitHub repository (owner/repo), last synced commit hash (truncated), review count, and last updated timestamp. Cards are clickable and navigate to the project detail page. The grid is responsive with 1-3 columns based on screen size, and includes loading skeleton states and real-time updates via Convex subscriptions.

## User Story
As a Sprint Planner user
I want to see my projects displayed as cards in a responsive grid
So that I can quickly view project status and navigate to project details

## Problem Statement
The current dashboard page has a basic project listing implementation. It needs to be enhanced with proper ProjectCard and ProjectGrid components that display all required project information (name, GitHub repo, last synced commit, review count, last updated) in a clean, reusable component structure with loading skeleton states.

## Solution Statement
Create two new components:
1. `ProjectCard` - A reusable card component that displays project information with proper styling following the existing glass/dark-mode design patterns
2. `ProjectGrid` - A container component that handles the responsive grid layout and loading states

The components will connect to the existing `api.projects.list` query and add a new `api.projects.listWithReviewCount` query to include review counts for each project. The implementation will follow existing patterns for styling (glass effects, dark mode colors) and state management (Convex useQuery).

## Pre-Implementation Analysis

### Environment Requirements
- API keys needed: None
- External services: None
- New environment variables: None

### Blockers & Risks
- Known limitations: None identified
- Potential blockers: None identified
- Dependencies on other features/fixes: Depends on existing projects.ts and reviews.ts queries (chunk-2 and chunk-3) which are already implemented

### Test Feasibility
- Unit testable: ProjectCard props rendering, date formatting, hash truncation
- E2E testable: Grid layout, loading states, card click navigation, responsive behavior
- Manual verification required: Visual appearance of glass effects, hover states
- Mock requirements: Mock project data for testing card rendering without needing real database entries

## Relevant Files
Use these files to implement the feature:

- `app/convex/projects.ts` - Contains existing project queries/mutations. Need to add `listWithReviewCount` query that joins projects with review counts.
- `app/convex/reviews.ts` - Contains existing review queries. Reference for querying reviews by project.
- `app/convex/schema.ts` - Database schema for projects and reviews tables. Reference for field types.
- `app/app/(dashboard)/page.tsx` - Current dashboard page that needs to integrate the new ProjectGrid component.
- `app/components/layout/Sidebar.tsx` - Reference for existing styling patterns and navigation.
- `app/components/shared/EmptyState.tsx` - Reference for component structure and styling patterns.
- `app/app/globals.css` - Contains glass effects and dark mode color definitions.
- `app/lib/utils.ts` - Contains `cn` utility for className merging.
- `.claude/commands/test_e2e.md` - Reference for how to create and run E2E tests.
- `.claude/commands/e2e/test_dashboard_layout.md` - Reference for E2E test format and structure.

### New Files
- `app/components/features/projects/ProjectCard.tsx` - New card component for displaying individual project info
- `app/components/features/projects/ProjectGrid.tsx` - New grid container component with loading states
- `app/components/features/projects/ProjectCardSkeleton.tsx` - New skeleton loading component for cards
- `.claude/commands/e2e/test_project_cards.md` - E2E test specification for project cards feature

## Implementation Plan

### Phase 1: Foundation
1. Create the `listWithReviewCount` query in `projects.ts` that fetches projects along with their review counts
2. Create the `ProjectCardSkeleton` component for loading states

### Phase 2: Core Implementation
1. Create the `ProjectCard` component with all required fields:
   - Project name
   - GitHub repo (owner/repo)
   - Last synced commit (truncated to 7 chars)
   - Review count
   - Last updated timestamp (relative format)
2. Create the `ProjectGrid` component with responsive grid layout
3. Implement click navigation to project detail page

### Phase 3: Integration
1. Update the dashboard page to use the new `ProjectGrid` component
2. Remove the inline project card implementation from the dashboard page
3. Create E2E test specification

## Step by Step Tasks

### Step 1: Add listWithReviewCount Query
- Open `app/convex/projects.ts`
- Add a new query `listWithReviewCount` that:
  - Fetches all projects for the authenticated user
  - For each project, counts the number of reviews using `ctx.db.query("reviews")`
  - Returns projects with an additional `reviewCount` field
  - Sorts by updatedAt descending
- Ensure the query handles edge cases (no reviews, deleted projects)

### Step 2: Create ProjectCardSkeleton Component
- Create `app/components/features/projects/ProjectCardSkeleton.tsx`
- Implement skeleton loading state matching the ProjectCard layout:
  - Animated pulse effect using `animate-pulse`
  - Same dimensions and spacing as the actual card
  - Glass styling to match the design system

### Step 3: Create ProjectCard Component
- Create `app/components/features/projects/ProjectCard.tsx`
- Props interface should include:
  - `id: Id<"projects">` - Project ID for navigation
  - `name: string` - Project name
  - `githubOwner: string` - GitHub owner
  - `githubRepo: string` - GitHub repo name
  - `lastSyncedCommit?: string` - Optional commit hash
  - `reviewCount: number` - Number of reviews
  - `updatedAt: number` - Timestamp for last updated
- Implement:
  - FolderKanban icon (consistent with existing UI)
  - Project name with truncation
  - GitHub repo in `owner/repo` format with gray text
  - Last synced commit truncated to 7 characters (show "Not synced" if null)
  - Review count with label
  - Relative time display for updatedAt (e.g., "2 hours ago")
  - Glass hover effect styling
  - Click handler using Next.js router for navigation to `/projects/[id]`

### Step 4: Create ProjectGrid Component
- Create `app/components/features/projects/ProjectGrid.tsx`
- Accept props:
  - `projects: ProjectWithReviewCount[] | undefined` - Projects data or undefined during loading
  - `isLoading?: boolean` - Optional explicit loading state
- Implement:
  - Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
  - Gap spacing consistent with existing design (gap-4)
  - Loading state showing 3 skeleton cards
  - Map over projects to render ProjectCard components
  - Pass all required data to ProjectCard

### Step 5: Update Dashboard Page
- Open `app/app/(dashboard)/page.tsx`
- Import the new `ProjectGrid` component
- Replace the existing useQuery call with `api.projects.listWithReviewCount`
- Replace the inline grid and card rendering with `<ProjectGrid projects={projects} />`
- Keep the existing:
  - Page header with title
  - "New Project" button
  - EmptyState component for when no projects exist
- Ensure loading, empty, and populated states all work correctly

### Step 6: Create E2E Test Specification
- Create `.claude/commands/e2e/test_project_cards.md`
- Follow the template from `test_dashboard_layout.md`
- Test steps should include:
  - Login with test credentials
  - Verify loading skeleton appears
  - Verify project cards display all required fields
  - Verify responsive grid layout (desktop and mobile)
  - Verify card click navigation works
- Define success criteria matching acceptance criteria

### Step 7: Run Validation Commands
- Run `cd app && npx tsc --noEmit` to verify TypeScript compilation
- Run `cd app && npm run build` to verify production build
- Read `.claude/commands/test_e2e.md` and execute the new E2E test to validate functionality

## Testing Strategy

### Unit Tests
- `ProjectCard.test.tsx`:
  - Renders project name correctly
  - Renders GitHub repo in owner/repo format
  - Truncates commit hash to 7 characters
  - Shows "Not synced" when no commit
  - Displays review count
  - Formats updatedAt as relative time
  - Click triggers navigation
- `ProjectCardSkeleton.test.tsx`:
  - Renders with animate-pulse class
  - Has correct structure matching card layout
- `ProjectGrid.test.tsx`:
  - Renders skeleton cards when loading
  - Renders ProjectCard for each project
  - Applies responsive grid classes

### Edge Cases
- Project with no lastSyncedCommit (null/undefined)
- Project with 0 reviews
- Project with very long name (truncation)
- Project with very long repo name (truncation)
- Empty projects list (should show EmptyState)
- Single project (grid still works)
- Many projects (pagination not required per spec but grid handles)

### E2E Tests Required
- `test_project_cards.md` - Validates project cards display and interaction

If creating a new E2E test, specify:
- New E2E test file: `.claude/commands/e2e/test_project_cards.md`
- What it validates: Project card rendering, grid layout responsiveness, loading states, and navigation

## Test Data Strategy

### Data Dependencies
- At least one project with reviews to validate review count display
- At least one project with a synced commit to validate commit hash display
- Optionally a project without synced commit to validate "Not synced" display

### Mock Data Approach
- Use the existing test user (test@mail.com / password123)
- Create a test project via the `api.projects.create` mutation during test setup
- Create test reviews via `api.reviews.create` mutation to test review count
- Clean up created data after test

### Cost Implications
- N/A - No external API calls. All operations are local Convex mutations/queries.

See `.claude/commands/e2e/TEST_DATA_GUIDELINES.md` for available test helpers and patterns.

## Acceptance Criteria
- [x] Cards display project name
- [x] Cards display GitHub repo in owner/repo format
- [x] Cards display last synced commit (truncated to 7 chars) or "Not synced"
- [x] Cards display review count
- [x] Cards display last updated timestamp in relative format
- [x] Grid is responsive (1 column mobile, 2 columns tablet, 3 columns desktop)
- [x] Loading skeleton shows during data fetch
- [x] Cards are clickable and navigate to project detail page
- [x] Real-time updates work via Convex subscription (automatic with useQuery)

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- `cd app && npx tsc --noEmit` - Verify TypeScript types compile without errors
- `cd app && npm run build` - Verify production build succeeds
- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_project_cards.md` to validate project cards functionality works

## Notes
- The project detail page (`/projects/[id]`) may not exist yet. The navigation should still work; it will either 404 or show a placeholder until that feature is implemented.
- Relative time formatting can use a simple implementation or a library like `date-fns`. Given the minimal use case, a simple implementation is preferred to avoid adding dependencies.
- The existing `listByProject` query in reviews.ts fetches all reviews for counting, but for efficiency in the listWithReviewCount query, we can use a simpler count approach.
- Follow the existing glass/glassmorphism design pattern for card styling to maintain visual consistency.
- The lucide-react icons (FolderKanban, GitBranch, MessageSquare, Clock) are already available in the project.
