# Sprint Planner Application

The Next.js + Convex application for Sprint Planner - transforming video critiques into actionable development tasks.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Convex (Real-time Database, Serverless Functions, File Storage)
- **AI**: Google Gemini 3 (Flash for code analysis, Pro for video synthesis)
- **External**: GitHub API (Octokit) for repository access

## Directory Structure

```
app/
├── convex/                      # Convex backend
│   ├── schema.ts                # Database schema (projects, reviews)
│   ├── auth.ts                  # Authentication configuration
│   ├── projects.ts              # Project CRUD operations
│   ├── reviews.ts               # Review session operations
│   ├── storage.ts               # File storage operations
│   └── actions/                 # Node.js actions (external APIs)
│       ├── githubSync.ts        # GitHub repo sync + Legend generation
│       ├── videoProcess.ts      # Video upload to Gemini File API
│       └── generateManifest.ts  # Manifest synthesis via Gemini Pro
│
├── components/                  # React components
│   ├── ui/                      # shadcn/ui primitives
│   └── features/                # Feature-specific components
│       ├── ProjectCard.tsx      # Project display card
│       ├── ReviewStepper.tsx    # 3-step review wizard
│       ├── ManifestViewer.tsx   # Markdown viewer with copy button
│       └── VideoPlayer.tsx      # Video player with timestamp jumps
│
├── hooks/                       # Custom React hooks
│   └── useVideoUpload.ts        # Resumable video upload with progress
│
├── lib/                         # Utilities
│   └── octokit.ts               # GitHub API client
│
└── tests/                       # Test files
    ├── README.md                # Testing conventions
    ├── helpers/                 # Test utilities and factories
    ├── unit/convex/             # Convex function unit tests
    └── e2e/                     # E2E browser tests
```

## Core Modules

### 1. GitHub Sync (`convex/actions/githubSync.ts`)

Fetches repository data and generates the Architecture Legend:

- Connects to GitHub via Octokit
- Fetches repository tree (recursive)
- Builds XML representation of codebase (token-aware, <1M limit)
- Calls Gemini 3 Flash with Architecture Legend prompt
- Caches result in `projects.architectureLegend`

### 2. Video Processing (`convex/actions/videoProcess.ts`)

Handles video upload to Gemini File API:

- Receives video from Convex Storage
- Uploads via Gemini SDK (resumable for >50MB)
- Polls for ACTIVE state (2s intervals, 5min timeout)
- Stores Gemini URI in `reviews.videoGeminiUri`

### 3. Manifest Generation (`convex/actions/generateManifest.ts`)

Synthesizes the Repair Manifest:

- Calls Gemini 3 Pro with multimodal input:
  - Video file (via Gemini URI)
  - Architecture Legend snapshot
  - Custom instructions
- Streams response to UI
- Stores result in `reviews.repairManifest`

## Development Commands

```bash
# Install dependencies
pnpm install

# Start Convex dev server (auto-sync schema)
npx convex dev

# Start Next.js dev server
pnpm dev

# Run unit tests
pnpm test

# Run E2E tests (requires servers running)
node tests/e2e/run_test.js

# Type check Convex functions
npx convex typecheck

# View Convex logs
npx convex logs

# Open Convex dashboard
npx convex dashboard
```

## Key Files

| File | Purpose |
|------|---------|
| `CONVEX.md` | Backend documentation - **read before backend changes** |
| `convex/schema.ts` | Database schema definition |
| `tests/README.md` | Testing conventions |

## UI Design Principles

- **Minimalist**: White space heavy, clean typography
- **Modern**: Glassmorphism cards, subtle animations (framer-motion)
- **Accessible**: ARIA labels, keyboard navigation, high contrast
- **Dark Mode**: Default dark theme with glass variant cards

## Authentication

Using `@convex-dev/auth` with password authentication:

```typescript
// Check authentication in mutations/queries
const userId = await getAuthUserId(ctx);
if (!userId) throw new Error("Unauthorized");
```

## File Storage

Videos are stored in Convex Storage, then transferred to Gemini:

```typescript
// 1. Generate upload URL
const uploadUrl = await generateUploadUrl();

// 2. Upload from client
const response = await fetch(uploadUrl, { method: "POST", body: file });
const { storageId } = await response.json();

// 3. Process video (transfers to Gemini)
await processVideo({ reviewId, videoStorageId: storageId });
```

## Environment Variables

The app requires these environment variables (set in root `.env`):

- `CONVEX_DEPLOYMENT` - Convex project name
- `GOOGLE_GEMINI_API_KEY` - Gemini API key (required for core functionality)
