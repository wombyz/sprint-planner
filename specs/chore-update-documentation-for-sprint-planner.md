# Chore: Update Documentation for Sprint Planner

## Chore Description
Update the README.md and other documentation files to accurately reflect that this project is now **Sprint Planner** - a specialized tool for transforming video critiques into actionable development tasks. The current documentation describes a generic "Agentic Convex Template" but needs to be updated to describe Sprint Planner's specific purpose, architecture, and workflows based on `specs/mvp-spec.md`.

Key changes needed:
1. **README.md** - Complete rewrite to describe Sprint Planner's purpose, value proposition, and architecture
2. **app/README.md** - Update to reflect Sprint Planner's Next.js + Convex structure
3. **app/CONVEX.md** - Update schema reference to match Sprint Planner's data model (projects with GitHub repos, reviews with video/manifest)
4. **.env.sample** - Ensure all required environment variables for Sprint Planner are documented

## Relevant Files
Use these files to resolve the chore:

- `README.md` - Main project README, currently describes generic template. Needs complete rewrite for Sprint Planner.
- `app/README.md` - Application-specific README, currently generic. Needs Sprint Planner specifics.
- `app/CONVEX.md` - Convex backend documentation. Needs schema updates for projects (with GitHub fields) and reviews tables.
- `.env.sample` - Environment variables template. Needs to ensure `GOOGLE_GEMINI_API_KEY` is marked as required and properly documented.
- `specs/mvp-spec.md` - **Source of truth** for what Sprint Planner is and how it works. Reference this for all content.

### Reference Files (Read-Only)
- `app/convex/schema.ts` - Current schema definition to understand what exists vs. what spec defines

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Update the Root README.md
Transform the root README from a generic template description to Sprint Planner's dedicated documentation.

**Changes:**
- Replace "Agentic Convex Template" title with "Sprint Planner"
- Add Executive Summary section explaining the "Agentic Gap" problem and Sprint Planner's solution
- Update "What is This?" to describe Sprint Planner's 3-step workflow:
  1. Sync GitHub repo and generate Architecture Legend
  2. Upload video critique with custom instructions
  3. Generate Repair Manifest for Claude Code
- Update the system architecture diagram to reflect Sprint Planner's components:
  - Frontend (Next.js 15 + React + Tailwind + shadcn/ui)
  - Convex Backend (Queries/Mutations/Actions + Storage + DB)
  - External APIs (GitHub via Octokit, Google Gemini 3)
- Update "Project Structure" to reflect Sprint Planner's actual directories
- Update "Quick Start" for Sprint Planner's setup (including Gemini API key)
- Update "Environment Variables" table to show:
  - `ANTHROPIC_API_KEY` - Required for ADW/Claude Code
  - `CONVEX_DEPLOYMENT` - Required for Convex
  - `GOOGLE_GEMINI_API_KEY` - **Required** for Gemini 3 (code analysis + video synthesis)
  - `GITHUB_PAT` - Optional, for GitHub repo access
- Add "Core Workflow" section explaining the 3-step review process
- Keep ADW System section but contextualize it for Sprint Planner development

### Step 2: Update app/README.md
Update the application README to describe Sprint Planner's frontend/backend structure.

**Changes:**
- Replace generic "Application Directory" title with "Sprint Planner Application"
- Add description of Sprint Planner's tech stack (Next.js 15, Convex, Tailwind, shadcn/ui)
- Document the key directories:
  - `convex/` - Backend functions (GitHub sync, video processing, manifest generation)
  - `components/` - UI components (ProjectCard, ReviewStepper, ManifestViewer, VideoPlayer)
  - `hooks/` - Custom hooks (useVideoUpload, etc.)
- Document the 3 main Convex action modules:
  1. `actions/githubSync.ts` - Fetches repo, builds XML, generates Architecture Legend via Gemini Flash
  2. `actions/videoProcess.ts` - Uploads video to Gemini File API, polls for ACTIVE state
  3. `actions/generateManifest.ts` - Calls Gemini Pro with video + Legend to generate Repair Manifest
- Add development commands section

### Step 3: Update app/CONVEX.md Schema Reference
Update the Convex documentation to reflect Sprint Planner's actual data model from the spec.

**Changes:**
- Update the Schema Reference section to document Sprint Planner's tables:

**`projects` table** (replaces generic example):
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

**Indexes:** `by_name`, `by_owner_repo`

**`reviews` table** (new):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectId` | `Id<"projects">` | Yes | Parent project reference |
| `title` | `string` | Yes | Review session title |
| `status` | `union` | Yes | draft, syncing_code, code_analyzed, uploading_video, analyzing_video, manifest_generated, completed |
| `codeSnapshotCommit` | `string` | No | Git commit hash at time of review |
| `architectureLegendSnapshot` | `string` | No | Copy of legend at review time |
| `videoStorageId` | `Id<"_storage">` | No | Convex storage ID for video |
| `videoGeminiUri` | `string` | No | Gemini File API URI |
| `customInstructions` | `string` | No | User's focus instructions |
| `repairManifest` | `string` | No | Generated Repair Manifest Markdown |
| `createdAt` | `number` | Yes | Creation timestamp |
| `updatedAt` | `number` | Yes | Last update timestamp |

**Indexes:** `by_project_status`, `by_project_updated`

- Update Functions Reference to document Sprint Planner's functions:
  - `projects.list`, `projects.get`, `projects.create`, `projects.update`, `projects.remove`
  - `reviews.list`, `reviews.get`, `reviews.create`, `reviews.update`
  - `actions/githubSync.syncRepoAndAnalyze`
  - `actions/videoProcess.processVideo`
  - `actions/generateManifest.generateManifest`
  - `storage.generateUploadUrl`, `storage.getUrl`

### Step 4: Update .env.sample
Ensure all Sprint Planner environment variables are properly documented.

**Changes:**
- Move `GOOGLE_GEMINI_API_KEY` to Required section (it's essential for Sprint Planner's core functionality)
- Add comment explaining it's used for:
  - Gemini 3 Flash: Code analysis and Architecture Legend generation
  - Gemini 3 Pro: Video synthesis and Repair Manifest generation
  - Gemini File API: Large video uploads (up to 200MB)
- Update the overall comments to reference Sprint Planner instead of generic template

### Step 5: Validate Changes
Run validation commands to ensure documentation is complete and consistent.

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `cat README.md | head -50` - Verify README has Sprint Planner branding and executive summary
- `cat app/README.md | head -30` - Verify app README describes Sprint Planner
- `cat app/CONVEX.md | grep -A5 "projects"` - Verify schema reference includes GitHub fields
- `cat app/CONVEX.md | grep -A5 "reviews"` - Verify reviews table is documented
- `cat .env.sample | grep GOOGLE_GEMINI` - Verify Gemini API key is documented as required
- `grep -r "Agentic Convex Template" README.md app/README.md` - Verify no old template references remain (should return nothing)

## Notes

- **Source of Truth**: All Sprint Planner-specific details come from `specs/mvp-spec.md`
- **Schema Sync**: The `app/convex/schema.ts` file will need to be updated separately to match the documented schema in CONVEX.md (this is a separate implementation task, not part of this documentation chore)
- **Gemini 3 Models**:
  - `gemini-3.0-flash-001` - Used for fast code analysis (Architecture Legend)
  - `gemini-3.0-pro-001` - Used for deep video reasoning (Repair Manifest)
- **Video Limits**: Up to 200MB MP4/WebM files
- **Codebase Limits**: Up to 500 files, prioritizing `src/`, `app/`, `convex/`
- **Keep ADW sections**: The ADW system documentation should remain as it's still used to build Sprint Planner itself
