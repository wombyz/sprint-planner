# MVP Implementation Plan: Sprint Planner

## Project Overview

**What**: A specialized "Repair Shop" tool that transforms video critiques into structured engineering tasks for AI coding agents.

**Why**: Liam Ottley's ADW pipeline achieves 90% coverage for core features, but the remaining 10% (UI fixes, edge cases, visual polish) requires manual translation from video feedback to code directives. Sprint Planner eliminates this "translation friction" by using Gemini 3's multimodal capabilities to correlate video critiques with exact code locations.

**Who**: Liam Ottley (single-user focus) - AI Engineer building 5+ apps/year who needs fast visual-to-technical translation for ADW handoffs.

## Tech Stack

**Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Shadcn UI, Framer Motion
**Backend**: Convex (Real-time Database, Serverless Functions, File Storage)
**Infrastructure**: Vercel (Frontend), Convex Cloud (Backend)
**APIs**:
- GitHub API (Octokit) - Repository sync and file fetching
- Google Gemini 3 API - Code analysis (Flash) and video synthesis (Pro)
- Gemini File API - Large video upload handling

## Core Features

1. **Project Management**: CRUD for apps tied to GitHub repos (owner/repo/branch/PAT)
2. **Code Sync & Legend Generation**: Fetch repo tree, build XML, generate Architecture Legend via Gemini Flash
3. **Video Upload Pipeline**: Resumable upload to Convex Storage → Gemini File API processing
4. **Manifest Synthesis**: Multimodal Gemini Pro call combining video + legend + instructions
5. **Review Wizard**: 3-step sticky workflow (Sync → Upload → Manifest)
6. **Review History**: Per-project session history with pause/resume capability
7. **Copy to Claude**: One-click manifest export for ADW integration

## Data Model

- **users**: Extended auth table (email, name, role, avatarStorageId, timestamps)
- **projects**: name, description, githubOwner, githubRepo, githubBranch, githubAccessToken, lastSyncedCommit, architectureLegend, timestamps
- **reviews**: projectId, title, status (7 states), codeSnapshotCommit, architectureLegendSnapshot, videoStorageId, videoGeminiUri, customInstructions, repairManifest, timestamps

## Architecture

Next.js 15 frontend communicates with Convex backend via real-time subscriptions. Projects link to GitHub repos; reviews are sessions within projects. The review workflow has 3 phases: (1) Code sync fetches repo via Octokit, builds XML, calls Gemini Flash for Legend; (2) Video upload streams to Convex Storage then Gemini File API; (3) Manifest synthesis calls Gemini Pro with video URI + Legend + instructions. Status field tracks progress through 7 states enabling sticky/resumable UX.

---

## Implementation Chunks

### Chunk 1: Project Foundation & Schema Setup

**Time**: 2 hours
**Dependencies**: None
**Type**: foundation

**Objective**: Update existing Convex project with Sprint Planner schema and establish project structure.

**Tasks**:
1. Update `app/convex/schema.ts` with projects table (Sprint Planner specific fields: githubOwner, githubRepo, githubBranch, githubAccessToken, lastSyncedCommit, architectureLegend)
2. Add reviews table with all status states and fields
3. Create indexes: by_name, by_owner_repo for projects; by_project_status, by_project_updated for reviews
4. Update `app/CONVEX.md` with new schema documentation
5. Run `npx convex dev` to deploy schema

**Deliverables**:
- Updated schema.ts with projects and reviews tables
- Schema deployed to Convex
- CONVEX.md updated

**Acceptance Criteria**:
- [ ] `npx convex typecheck` passes
- [ ] Tables visible in Convex dashboard
- [ ] All indexes created

**Files**:
- `app/convex/schema.ts`: Schema definition
- `app/CONVEX.md`: Backend documentation

---

### Chunk 2: Projects CRUD Backend

**Time**: 3 hours
**Dependencies**: chunk-1
**Type**: feature

**Objective**: Implement Convex queries and mutations for project management.

**Tasks**:
1. Create `app/convex/projects.ts` with:
   - `list` query: Return all projects for user, sorted by updatedAt
   - `get` query: Return single project by ID
   - `create` mutation: Create project with GitHub fields
   - `update` mutation: Update project fields
   - `remove` mutation: Delete project (soft delete via status or hard delete)
2. Implement auth checks using `getAuthUserId(ctx)`
3. Use `.withIndex()` for all queries
4. Add timestamp handling (createdAt/updatedAt)
5. Write unit tests in `app/tests/unit/convex/projects.test.ts`

**Deliverables**:
- Complete projects.ts with all CRUD operations
- Unit tests passing

**Acceptance Criteria**:
- [ ] All mutations require authentication
- [ ] Queries use indexes
- [ ] Unit tests cover happy path and auth failures
- [ ] `pnpm test` passes

**Files**:
- `app/convex/projects.ts`: Project functions
- `app/tests/unit/convex/projects.test.ts`: Unit tests
- `app/CONVEX.md`: Update functions reference

---

### Chunk 3: Reviews CRUD Backend

**Time**: 3 hours
**Dependencies**: chunk-2
**Type**: feature

**Objective**: Implement Convex queries and mutations for review management.

**Tasks**:
1. Create `app/convex/reviews.ts` with:
   - `listByProject` query: Return reviews for project, sorted by updatedAt
   - `get` query: Return single review with project details
   - `create` mutation: Create review in "draft" status
   - `update` mutation: Update review fields (title, customInstructions)
   - `updateStatus` mutation: Transition review status
   - `remove` mutation: Delete review
2. Validate project ownership before review operations
3. Implement status transition validation (e.g., can't go from draft to manifest_generated)
4. Write unit tests

**Deliverables**:
- Complete reviews.ts with all operations
- Status state machine logic
- Unit tests

**Acceptance Criteria**:
- [ ] Reviews linked to valid projects
- [ ] Status transitions validated
- [ ] Unit tests pass
- [ ] Cannot access reviews from other users' projects

**Files**:
- `app/convex/reviews.ts`: Review functions
- `app/tests/unit/convex/reviews.test.ts`: Unit tests
- `app/CONVEX.md`: Update functions reference

---

### Chunk 4: Dashboard Layout & Navigation

**Time**: 3 hours
**Dependencies**: chunk-1
**Type**: feature

**Objective**: Create main dashboard layout with navigation and project list shell.

**Tasks**:
1. Create app layout with:
   - Sidebar navigation (Projects, Settings)
   - Header with user info and logout
   - Main content area
2. Implement dark mode with Tailwind (default dark)
3. Create glassmorphism card utility class (`.glass`)
4. Set up JetBrains Mono font for code blocks
5. Create dashboard page shell at `app/(dashboard)/page.tsx`
6. Add empty state component for no projects

**Deliverables**:
- Dashboard layout with navigation
- Dark mode by default
- Glassmorphism styling utilities
- Empty state UI

**Acceptance Criteria**:
- [ ] Layout renders without errors
- [ ] Dark mode active by default
- [ ] Navigation links work
- [ ] Responsive on mobile/desktop

**Files**:
- `app/app/(dashboard)/layout.tsx`: Dashboard layout
- `app/app/(dashboard)/page.tsx`: Dashboard home
- `app/app/globals.css`: Glass utilities
- `app/components/shared/EmptyState.tsx`: Empty state component
- `app/tailwind.config.ts`: Font configuration

---

### Chunk 5: Project Cards & List UI

**Time**: 3 hours
**Dependencies**: chunk-2, chunk-4
**Type**: feature

**Objective**: Display projects in dashboard grid with cards showing key info.

**Tasks**:
1. Create `ProjectCard` component showing:
   - Project name
   - GitHub repo (owner/repo)
   - Last synced commit (truncated hash)
   - Review count
   - Last updated timestamp
2. Create `ProjectGrid` component with responsive grid layout
3. Connect to `api.projects.list` query
4. Add loading skeleton state
5. Implement click navigation to project detail

**Deliverables**:
- Project cards with all fields
- Responsive grid layout
- Loading states
- Real-time updates via Convex subscription

**Acceptance Criteria**:
- [ ] Cards display all required info
- [ ] Grid is responsive (1-3 columns)
- [ ] Loading skeleton shows during fetch
- [ ] Cards clickable to navigate

**Files**:
- `app/components/features/projects/ProjectCard.tsx`: Card component
- `app/components/features/projects/ProjectGrid.tsx`: Grid container
- `app/app/(dashboard)/page.tsx`: Integrate grid

---

### Chunk 6: Create Project Modal

**Time**: 3 hours
**Dependencies**: chunk-5
**Type**: feature

**Objective**: Modal form to create new projects with GitHub repo linking.

**Tasks**:
1. Create `CreateProjectModal` with Shadcn Dialog
2. Form fields:
   - Project name (required)
   - Description (optional)
   - GitHub Owner (required)
   - GitHub Repo (required)
   - GitHub Branch (default: main)
   - GitHub Access Token (optional, for private repos)
3. Form validation with error messages
4. Connect to `api.projects.create` mutation
5. Add "Add Project" button to dashboard
6. Close modal and refresh list on success

**Deliverables**:
- Functional create project modal
- Form validation
- Success/error toast notifications

**Acceptance Criteria**:
- [ ] All required fields validated
- [ ] PAT field obscured (password type)
- [ ] Project created and appears in list
- [ ] Modal closes on success
- [ ] Toast shows on success/error

**Files**:
- `app/components/features/projects/CreateProjectModal.tsx`: Modal component
- `app/app/(dashboard)/page.tsx`: Add trigger button

---

### Chunk 7: Project Detail Page

**Time**: 3 hours
**Dependencies**: chunk-6
**Type**: feature

**Objective**: Create project detail page showing project info and reviews list.

**Tasks**:
1. Create page at `app/(dashboard)/projects/[projectId]/page.tsx`
2. Display project header with:
   - Name and description
   - GitHub link (external)
   - Sync status (last commit, timestamp)
   - Edit/Delete actions
3. Create reviews list section with:
   - List of reviews sorted by date
   - Status badge per review
   - "New Review" button
4. Connect to queries: `api.projects.get`, `api.reviews.listByProject`
5. Handle loading and error states

**Deliverables**:
- Project detail page
- Reviews list
- Navigation back to dashboard

**Acceptance Criteria**:
- [ ] Project info displays correctly
- [ ] Reviews list shows with status
- [ ] New Review button navigates correctly
- [ ] Breadcrumb navigation works

**Files**:
- `app/app/(dashboard)/projects/[projectId]/page.tsx`: Project page
- `app/components/features/projects/ProjectHeader.tsx`: Header component
- `app/components/features/reviews/ReviewList.tsx`: Reviews list

---

### Chunk 8: Edit/Delete Project

**Time**: 2 hours
**Dependencies**: chunk-7
**Type**: feature

**Objective**: Enable editing and deleting projects from detail page.

**Tasks**:
1. Create `EditProjectModal` with pre-filled form
2. Connect to `api.projects.update` mutation
3. Create `DeleteProjectDialog` with confirmation
4. Connect to `api.projects.remove` mutation
5. Redirect to dashboard after delete
6. Add dropdown menu to project header with Edit/Delete options

**Deliverables**:
- Edit project modal
- Delete confirmation dialog
- Updated project header with actions

**Acceptance Criteria**:
- [ ] Edit pre-fills current values
- [ ] Update persists and reflects in UI
- [ ] Delete requires confirmation
- [ ] Redirect to dashboard after delete

**Files**:
- `app/components/features/projects/EditProjectModal.tsx`: Edit modal
- `app/components/features/projects/DeleteProjectDialog.tsx`: Delete dialog
- `app/components/features/projects/ProjectHeader.tsx`: Add dropdown

---

### Chunk 9: GitHub Sync Action - Octokit Integration

**Time**: 4 hours
**Dependencies**: chunk-3
**Type**: feature

**Objective**: Create Convex action to fetch GitHub repo tree and build codebase XML.

**Tasks**:
1. Install `@octokit/rest` package
2. Create `app/convex/actions/githubSync.ts` with:
   - `syncRepo` action that fetches repo tree
   - Filter files (include src/, app/, convex/; exclude node_modules, .git, etc.)
   - Build XML format with file paths and contents
   - Token estimation (~4 chars/token, max 800k)
   - Store commit SHA in project
3. Create `shouldIncludeFile` helper function
4. Create `escapeXml` helper function
5. Handle errors (rate limits, auth failures, not found)

**Deliverables**:
- Working GitHub sync action
- Codebase XML generation
- Error handling

**Acceptance Criteria**:
- [ ] Fetches repo tree successfully
- [ ] Filters files correctly
- [ ] XML format is valid
- [ ] Handles private repos with PAT
- [ ] Respects token limit

**Files**:
- `app/convex/actions/githubSync.ts`: Sync action
- `app/package.json`: Add @octokit/rest

---

### Chunk 10: GitHub Sync Action - Gemini Legend Generation

**Time**: 4 hours
**Dependencies**: chunk-9
**Type**: feature

**Objective**: Extend GitHub sync to call Gemini Flash for Architecture Legend generation.

**Tasks**:
1. Install `@google/generative-ai` package
2. Add `GOOGLE_GEMINI_API_KEY` environment variable
3. Extend `syncRepoAndAnalyze` action to:
   - Call Gemini 3 Flash with XML and prompt
   - Store generated legend in project
   - Update lastSyncedCommit
4. Add `ARCHITECTURE_LEGEND_PROMPT` constant (from spec section 6.1)
5. Handle Gemini errors (quota, timeout)
6. Add retry logic (3 attempts with backoff)

**Deliverables**:
- Complete sync action with Gemini integration
- Architecture Legend generation
- Error handling and retries

**Acceptance Criteria**:
- [ ] Legend generates successfully
- [ ] Legend stored in project.architectureLegend
- [ ] Commit SHA updated
- [ ] Errors handled gracefully
- [ ] Works with Gemini 3 Flash model

**Files**:
- `app/convex/actions/githubSync.ts`: Add Gemini call
- `app/convex/lib/prompts.ts`: Legend prompt constant
- `app/package.json`: Add @google/generative-ai
- `.env`: Add GOOGLE_GEMINI_API_KEY

---

### Chunk 11: Sync UI - Button & Progress

**Time**: 3 hours
**Dependencies**: chunk-10
**Type**: feature

**Objective**: Add sync button to project page with progress indication and legend preview.

**Tasks**:
1. Add "Sync Code" button to project header
2. Implement loading state with spinner during sync
3. Show toast on success/error
4. Create `LegendPreview` component with:
   - Collapsible markdown sections
   - Syntax highlighting for code blocks
   - Copy button
5. Connect to `api.actions.githubSync.syncRepoAndAnalyze` action
6. Display last sync timestamp

**Deliverables**:
- Sync button with loading state
- Legend preview component
- Toast notifications

**Acceptance Criteria**:
- [ ] Button triggers sync action
- [ ] Loading state shows during sync
- [ ] Legend renders as markdown
- [ ] Copy to clipboard works
- [ ] Timestamp updates after sync

**Files**:
- `app/components/features/projects/SyncButton.tsx`: Sync button
- `app/components/features/projects/LegendPreview.tsx`: Legend display
- `app/app/(dashboard)/projects/[projectId]/page.tsx`: Integrate components

---

### Chunk 12: Review Wizard - Create & Step Navigation

**Time**: 3 hours
**Dependencies**: chunk-7
**Type**: feature

**Objective**: Create review wizard with step navigation and status-based UI.

**Tasks**:
1. Create `CreateReviewModal` to start new review
2. Create review page at `app/(dashboard)/projects/[projectId]/reviews/[reviewId]/page.tsx`
3. Implement step indicator component showing:
   - Step 1: Code Analysis (syncing_code → code_analyzed)
   - Step 2: Video Upload (uploading_video → analyzing_video)
   - Step 3: Manifest (manifest_generated → completed)
4. Map review status to active step
5. Create step content containers

**Deliverables**:
- Create review flow
- Review page with step navigation
- Status-to-step mapping

**Acceptance Criteria**:
- [ ] Can create new review
- [ ] Step indicator shows progress
- [ ] Current step highlighted
- [ ] Navigation between steps (when allowed)

**Files**:
- `app/components/features/reviews/CreateReviewModal.tsx`: Create modal
- `app/components/features/reviews/StepIndicator.tsx`: Step nav
- `app/app/(dashboard)/projects/[projectId]/reviews/[reviewId]/page.tsx`: Review page

---

### Chunk 13: Review Step 1 - Code Analysis

**Time**: 3 hours
**Dependencies**: chunk-11, chunk-12
**Type**: feature

**Objective**: Implement Step 1 of review wizard - trigger sync and snapshot legend.

**Tasks**:
1. Create `CodeAnalysisStep` component
2. On review creation, auto-trigger code sync if needed
3. Snapshot current legend to `review.architectureLegendSnapshot`
4. Snapshot current commit to `review.codeSnapshotCommit`
5. Update review status: draft → syncing_code → code_analyzed
6. Display legend preview in step
7. "Continue to Video Upload" button (enabled when code_analyzed)

**Deliverables**:
- Code analysis step UI
- Auto-sync on review start
- Legend snapshot storage

**Acceptance Criteria**:
- [ ] Sync triggers automatically
- [ ] Legend snapshot saved to review
- [ ] Status updates correctly
- [ ] Can proceed to next step

**Files**:
- `app/components/features/reviews/steps/CodeAnalysisStep.tsx`: Step 1 component
- `app/convex/reviews.ts`: Add snapshot mutations

---

### Chunk 14: Video Upload - Convex Storage

**Time**: 3 hours
**Dependencies**: chunk-13
**Type**: feature

**Objective**: Implement client-side video upload to Convex Storage.

**Tasks**:
1. Create `useVideoUpload` hook with:
   - Generate upload URL via mutation
   - Upload file with progress tracking
   - Return storageId on success
2. Validate file size (max 200MB)
3. Validate file type (MP4/WebM)
4. Create `VideoDropzone` component with:
   - Drag-drop zone
   - File picker fallback
   - Progress bar during upload
5. Store storageId in review

**Deliverables**:
- Video upload hook
- Dropzone component
- Progress tracking

**Acceptance Criteria**:
- [ ] Can upload via drag-drop or click
- [ ] Progress shows during upload
- [ ] Rejects files >200MB
- [ ] Rejects non-video files
- [ ] StorageId saved to review

**Files**:
- `app/hooks/useVideoUpload.ts`: Upload hook
- `app/components/features/reviews/VideoDropzone.tsx`: Dropzone UI
- `app/convex/storage.ts`: generateUploadUrl mutation

---

### Chunk 15: Video Upload - Gemini File API

**Time**: 4 hours
**Dependencies**: chunk-14
**Type**: feature

**Objective**: Create action to upload video from Convex Storage to Gemini File API.

**Tasks**:
1. Create `app/convex/actions/videoProcess.ts` with:
   - Get video stream from Convex Storage
   - Upload to Gemini File API using SDK
   - Poll for ACTIVE state (2s intervals, 5min timeout)
   - Store `videoGeminiUri` in review
2. Handle resumable upload for large files
3. Update review status: uploading_video → analyzing_video
4. Handle errors (timeout, upload failure)

**Deliverables**:
- Video processing action
- Gemini File API integration
- Polling logic

**Acceptance Criteria**:
- [ ] Video uploads to Gemini
- [ ] Polls until ACTIVE
- [ ] URI stored in review
- [ ] Status updates correctly
- [ ] Handles 100MB+ files

**Files**:
- `app/convex/actions/videoProcess.ts`: Process action
- `app/convex/reviews.ts`: Add videoGeminiUri update

---

### Chunk 16: Review Step 2 - Video Upload UI

**Time**: 3 hours
**Dependencies**: chunk-15
**Type**: feature

**Objective**: Implement Step 2 of review wizard - video upload with instructions.

**Tasks**:
1. Create `VideoUploadStep` component with:
   - VideoDropzone
   - Custom instructions textarea
   - Video preview after upload
   - Processing status indicator
2. Trigger video processing action after Convex upload
3. Show polling progress (processing → active)
4. "Continue to Manifest" button (enabled when analyzing_video complete)

**Deliverables**:
- Video upload step UI
- Instructions input
- Processing status

**Acceptance Criteria**:
- [ ] Can upload video with UI feedback
- [ ] Instructions save to review
- [ ] Processing status shows
- [ ] Can proceed when ready

**Files**:
- `app/components/features/reviews/steps/VideoUploadStep.tsx`: Step 2 component
- `app/convex/reviews.ts`: Add customInstructions update

---

### Chunk 17: Manifest Generation Action

**Time**: 4 hours
**Dependencies**: chunk-16
**Type**: feature

**Objective**: Create action to generate Repair Manifest via Gemini Pro multimodal call.

**Tasks**:
1. Create `app/convex/actions/generateManifest.ts` with:
   - Fetch review with legend snapshot and video URI
   - Call Gemini 3 Pro with multimodal content:
     - Video fileData (from URI)
     - Repair Manifest prompt
     - Codebase legend
     - Custom instructions
   - Store result in `review.repairManifest`
2. Add `REPAIR_MANIFEST_PROMPT` constant (from spec section 6.2)
3. Update review status: analyzing_video → manifest_generated
4. Handle errors (quota, malformed response)

**Deliverables**:
- Manifest generation action
- Gemini Pro multimodal call
- Prompt integration

**Acceptance Criteria**:
- [ ] Manifest generates successfully
- [ ] Uses video + legend + instructions
- [ ] Stores in review.repairManifest
- [ ] Status updates correctly

**Files**:
- `app/convex/actions/generateManifest.ts`: Generate action
- `app/convex/lib/prompts.ts`: Repair manifest prompt

---

### Chunk 18: Review Step 3 - Manifest Display

**Time**: 3 hours
**Dependencies**: chunk-17
**Type**: feature

**Objective**: Implement Step 3 of review wizard - manifest display with copy functionality.

**Tasks**:
1. Create `ManifestStep` component with split-view:
   - Left: Video player with timestamp display
   - Right: Streaming/static Markdown viewer
2. Create `ManifestViewer` component with:
   - React-Markdown rendering
   - Syntax highlighting (prism-react-renderer)
   - Copy to clipboard button
3. Trigger manifest generation on step entry
4. Show generation progress
5. "Copy to Claude" button with toast confirmation

**Deliverables**:
- Manifest step UI
- Markdown viewer with syntax highlighting
- Copy functionality

**Acceptance Criteria**:
- [ ] Split view renders correctly
- [ ] Markdown formats properly
- [ ] Code blocks highlighted
- [ ] Copy puts manifest in clipboard
- [ ] Video plays with controls

**Files**:
- `app/components/features/reviews/steps/ManifestStep.tsx`: Step 3 component
- `app/components/features/reviews/ManifestViewer.tsx`: Markdown viewer
- `app/components/features/reviews/VideoPlayer.tsx`: Video component

---

### Chunk 19: Review History & Resume

**Time**: 3 hours
**Dependencies**: chunk-18
**Type**: feature

**Objective**: Enable viewing review history and resuming in-progress reviews.

**Tasks**:
1. Enhance `ReviewList` component with:
   - Status badges (color-coded)
   - Timestamp display
   - Click to open/resume
2. Create review sidebar for project page showing recent reviews
3. Auto-detect step from status on review open
4. Add "Complete" action to mark review as completed
5. Enable deleting reviews

**Deliverables**:
- Enhanced review list
- Resume functionality
- Status-based step detection

**Acceptance Criteria**:
- [ ] Can see all reviews with status
- [ ] Clicking review resumes at correct step
- [ ] Can mark review as completed
- [ ] Can delete reviews

**Files**:
- `app/components/features/reviews/ReviewList.tsx`: Enhanced list
- `app/components/features/reviews/ReviewSidebar.tsx`: Sidebar component
- `app/convex/reviews.ts`: Add complete/delete mutations

---

### Chunk 20: Error Handling & Retry Logic

**Time**: 3 hours
**Dependencies**: chunk-17
**Type**: integration

**Objective**: Implement comprehensive error handling across all actions.

**Tasks**:
1. Add retry logic to GitHub sync (3 attempts, exponential backoff)
2. Add retry logic to video processing (handle transient failures)
3. Add retry logic to manifest generation
4. Create error state UI components
5. Implement fallback: use cached legend if sync fails
6. Add toast notifications for all error states
7. Log errors to Convex for debugging

**Deliverables**:
- Retry logic in all actions
- Error UI components
- Fallback behaviors
- Error logging

**Acceptance Criteria**:
- [ ] Actions retry on transient failures
- [ ] UI shows meaningful error messages
- [ ] Can retry failed operations
- [ ] Errors logged for debugging

**Files**:
- `app/convex/actions/githubSync.ts`: Add retries
- `app/convex/actions/videoProcess.ts`: Add retries
- `app/convex/actions/generateManifest.ts`: Add retries
- `app/components/shared/ErrorState.tsx`: Error UI

---

### Chunk 21: Loading States & Skeletons

**Time**: 2 hours
**Dependencies**: chunk-18
**Type**: polish

**Objective**: Add comprehensive loading states throughout the app.

**Tasks**:
1. Create skeleton components for:
   - Project card
   - Project list
   - Review list
   - Legend preview
   - Manifest viewer
2. Add Suspense boundaries where appropriate
3. Implement optimistic updates for mutations
4. Add loading indicators for async operations

**Deliverables**:
- Skeleton components
- Loading indicators
- Optimistic updates

**Acceptance Criteria**:
- [ ] All lists show skeletons while loading
- [ ] Async operations show progress
- [ ] Mutations feel instant (optimistic)

**Files**:
- `app/components/shared/skeletons/`: Skeleton components
- Various components: Add loading states

---

### Chunk 22: Keyboard Navigation & Accessibility

**Time**: 2 hours
**Dependencies**: chunk-21
**Type**: polish

**Objective**: Ensure keyboard navigation and screen reader accessibility.

**Tasks**:
1. Add ARIA labels to interactive elements
2. Ensure focus management in modals
3. Add keyboard shortcuts:
   - `Cmd+N`: New project
   - `Cmd+R`: New review
   - `Cmd+C`: Copy manifest (when viewing)
4. Ensure color contrast meets WCAG AA
5. Add skip links for navigation

**Deliverables**:
- ARIA labels
- Keyboard shortcuts
- Focus management

**Acceptance Criteria**:
- [ ] All actions keyboard accessible
- [ ] Screen reader announces correctly
- [ ] Shortcuts work as expected
- [ ] Color contrast passes

**Files**:
- Various components: Add ARIA
- `app/hooks/useKeyboardShortcuts.ts`: Shortcuts hook

---

### Chunk 23: Unit Tests - Backend

**Time**: 3 hours
**Dependencies**: chunk-20
**Type**: testing

**Objective**: Comprehensive unit tests for Convex functions.

**Tasks**:
1. Complete `projects.test.ts` with all CRUD tests
2. Complete `reviews.test.ts` with all CRUD tests
3. Test status transitions
4. Test authorization (can't access other users' data)
5. Mock external APIs for action tests
6. Achieve 80% code coverage

**Deliverables**:
- Complete test suites
- 80% coverage

**Acceptance Criteria**:
- [ ] All queries/mutations tested
- [ ] Auth failures tested
- [ ] Status transitions tested
- [ ] `pnpm test` passes
- [ ] Coverage >= 80%

**Files**:
- `app/tests/unit/convex/projects.test.ts`: Project tests
- `app/tests/unit/convex/reviews.test.ts`: Review tests

---

### Chunk 24: E2E Tests - Core Flows

**Time**: 4 hours
**Dependencies**: chunk-23
**Type**: testing

**Objective**: E2E tests for critical user flows.

**Tasks**:
1. Test: Login → Dashboard → Create Project → View Project
2. Test: Start Review → Code Analysis → (mock video) → Generate Manifest
3. Test: Copy Manifest to Clipboard
4. Test: Review History → Resume Review
5. Create video fixture for testing (small test video)
6. Mock Gemini API responses for consistent testing

**Deliverables**:
- E2E test suite
- Test fixtures
- API mocks

**Acceptance Criteria**:
- [ ] All critical flows tested
- [ ] Tests pass in CI
- [ ] Tests are deterministic

**Files**:
- `app/tests/e2e/projects.test.js`: Project flow tests
- `app/tests/e2e/reviews.test.js`: Review flow tests
- `app/tests/e2e/fixtures/`: Test fixtures

---

### Chunk 25: Performance Optimization

**Time**: 2 hours
**Dependencies**: chunk-24
**Type**: polish

**Objective**: Optimize performance for large codebases and videos.

**Tasks**:
1. Implement pagination for reviews list
2. Add virtualization for long legend/manifest documents
3. Lazy load video player component
4. Optimize re-renders with React.memo
5. Add Convex query caching hints
6. Profile and fix any performance bottlenecks

**Deliverables**:
- Pagination
- Virtualization
- Lazy loading
- Performance improvements

**Acceptance Criteria**:
- [ ] Large lists render smoothly
- [ ] Initial page load < 2s
- [ ] No unnecessary re-renders

**Files**:
- Various components: Performance optimizations
- `app/convex/reviews.ts`: Add pagination

---

### Chunk 26: Deployment & Environment Setup

**Time**: 2 hours
**Dependencies**: chunk-25
**Type**: deployment

**Objective**: Configure deployment to Vercel and Convex Cloud.

**Tasks**:
1. Configure Vercel project settings
2. Set up environment variables in Vercel:
   - `CONVEX_DEPLOYMENT`
   - `GOOGLE_GEMINI_API_KEY`
3. Deploy Convex to production: `npx convex deploy`
4. Configure custom domain (if needed)
5. Set up Vercel/GitHub integration for auto-deploy
6. Verify production build works

**Deliverables**:
- Production deployment
- Environment configuration
- CI/CD pipeline

**Acceptance Criteria**:
- [ ] App deploys to Vercel
- [ ] Convex deployed to production
- [ ] All features work in production
- [ ] Auto-deploy on push to main

**Files**:
- `vercel.json`: Vercel config (if needed)
- `.env.production`: Production env template

---

## Execution Groups

**Group 1** (Foundation - Sequential):
- Chunk 1: Schema Setup

**Group 2** (Backend CRUD - Sequential):
- Chunk 2: Projects CRUD
- Chunk 3: Reviews CRUD

**Group 3** (UI Foundation - Parallel after Group 2):
- Chunk 4: Dashboard Layout
- Chunk 9: GitHub Sync - Octokit (can start parallel)

**Group 4** (UI Features - Sequential):
- Chunk 5: Project Cards (after 4)
- Chunk 6: Create Project Modal (after 5)
- Chunk 7: Project Detail Page (after 6)
- Chunk 8: Edit/Delete Project (after 7)

**Group 5** (GitHub Sync - Sequential):
- Chunk 10: GitHub Sync - Gemini (after 9)
- Chunk 11: Sync UI (after 10)

**Group 6** (Review Wizard - Sequential):
- Chunk 12: Review Wizard Navigation (after 7)
- Chunk 13: Code Analysis Step (after 11, 12)
- Chunk 14: Video Upload - Convex (after 13)
- Chunk 15: Video Upload - Gemini (after 14)
- Chunk 16: Video Upload UI (after 15)
- Chunk 17: Manifest Generation (after 16)
- Chunk 18: Manifest Display (after 17)
- Chunk 19: Review History (after 18)

**Group 7** (Polish - Parallel after Group 6):
- Chunk 20: Error Handling
- Chunk 21: Loading States
- Chunk 22: Accessibility

**Group 8** (Testing - Sequential after Group 7):
- Chunk 23: Unit Tests
- Chunk 24: E2E Tests

**Group 9** (Final - Sequential):
- Chunk 25: Performance
- Chunk 26: Deployment

## Success Criteria

The MVP is complete when:

- [ ] All 26 chunks implemented and tested
- [ ] Can create projects linked to GitHub repos
- [ ] Can sync code and generate Architecture Legend
- [ ] Can upload critique videos up to 200MB
- [ ] Can generate Repair Manifest from video + legend
- [ ] Can copy manifest to clipboard for ADW
- [ ] Review history persists and reviews are resumable
- [ ] Unit test coverage >= 80%
- [ ] E2E tests pass
- [ ] Deployed to production

## Out of Scope

- Multi-user/team support (single-user focus on Liam)
- OAuth for GitHub (using PAT)
- Video editing/trimming in app
- Direct ADW/GitHub issue integration (manual copy-paste)
- Real-time streaming of manifest generation (batch response)
- Gemini 2.5 fallback implementation
- Sentry/monitoring integration
- Mobile-specific optimizations

## Quality Requirements

- Each chunk is 2-4 hours (manageable scope)
- Dependencies are explicit and linear
- No circular dependencies
- Tasks are specific and actionable
- Acceptance criteria are testable
- Backend changes update CONVEX.md

---

## Report

- **Total chunks**: 26
- **Execution groups**: 9
- **Estimated total hours**: ~75 hours
- **Key risks**:
  - Gemini 3 API availability/quotas (mitigation: implement retry logic, consider Gemini 2.5 fallback in future)
  - Large video upload handling (mitigation: chunk 15 handles resumable uploads, strict 200MB limit)
  - Token overflow for large codebases (mitigation: tree-shaking and truncation in chunk 9-10)
