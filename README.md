# Sprint Planner

A specialized tool for transforming video critiques into actionable development tasks. Sprint Planner bridges the "Agentic Gap" - the 10% of development work that AI agents miss - by converting screen recordings into structured Repair Manifests that Claude Code can execute autonomously.

## The Problem: The Agentic Gap

AI Developer Workflows (ADWs) powered by Claude Code can build 90% of applications autonomously. However, the remaining 10% - subtle UI misalignments, unhandled edge cases, and visual inconsistencies - only reveal themselves during hands-on testing. Manually translating video critiques into file-specific engineering tasks consumes hours per sprint.

## The Solution: Sprint Planner

Sprint Planner operationalizes the "Human-in-the-Loop" philosophy:
- **Humans** provide high-bandwidth input (video + voice critiques)
- **AI** handles low-bandwidth synthesis (code correlation + task decomposition)

The result is a **Repair Manifest** - a copy-pasteable Markdown document that Claude Code can ingest to generate dozens of autonomous GitHub issues.

```
5-minute video critique → Sprint Planner → 2-hour sprint plan → Claude Code → Fixed code
```

---

## How It Works

Sprint Planner follows a 3-step wizard workflow:

### Step 1: Sync & Legend Generation (5-10s)
- Connect your GitHub repository
- Auto-fetch the latest commit and build codebase XML
- Generate an **Architecture Legend** via Gemini 3 Flash (comprehensive code analysis report)

### Step 2: Video Critique (1-2 min)
- Upload a screen recording (up to 200MB MP4/WebM)
- Add custom instructions (e.g., "Focus on auth flow bugs")
- Video is processed via Gemini File API for multimodal analysis

### Step 3: Manifest Synthesis (30-60s)
- Gemini 3 Pro analyzes video + Architecture Legend
- Generates a structured **Repair Manifest** with:
  - File-specific directives
  - Timestamp-to-code correlations
  - Step-by-step agent instructions
- Copy to Claude Code and execute `/expand_spec_to_plan`

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                │
│             Next.js 15 + React + Tailwind + shadcn/ui           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Dashboard │ Project List │ Review Wizard │ Manifest    │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                          CONVEX                                  │
│  ┌──────────────┬──────────────┬──────────────┐                 │
│  │   Queries    │  Mutations   │   Actions    │                 │
│  │  (read-only) │   (writes)   │  (Node.js)   │                 │
│  └──────────────┴──────────────┴──────────────┘                 │
│                          │                                       │
│  ┌─────────────────────────────────────────────┐                │
│  │     Database (projects, reviews)            │                │
│  │     Storage (videos, XML snapshots)         │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────────────┐
│   GitHub (Octokit)  │           │      Google Gemini 3        │
│   - Repo tree fetch │           │   - Flash (Code Analysis)   │
│   - Commit history  │           │   - Pro (Video Synthesis)   │
│   - File contents   │           │   - File API (Uploads)      │
└─────────────────────┘           └─────────────────────────────┘
```

---

## Project Structure

```
.
├── README.md                    # This file
├── .env.sample                  # Environment template
├── .gitignore                   # Git ignore rules
│
├── app/                         # Next.js + Convex application
│   ├── CONVEX.md                # Backend documentation (READ THIS)
│   ├── convex/                  # Convex backend
│   │   ├── schema.ts            # Database schema (projects, reviews)
│   │   ├── projects.ts          # Project CRUD operations
│   │   ├── reviews.ts           # Review session operations
│   │   └── actions/             # Node.js actions
│   │       ├── githubSync.ts    # GitHub repo sync + Legend generation
│   │       ├── videoProcess.ts  # Video upload to Gemini
│   │       └── generateManifest.ts  # Manifest synthesis
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui primitives
│   │   └── features/            # Feature components
│   │       ├── ProjectCard.tsx
│   │       ├── ReviewStepper.tsx
│   │       ├── ManifestViewer.tsx
│   │       └── VideoPlayer.tsx
│   ├── hooks/                   # Custom React hooks
│   │   └── useVideoUpload.ts    # Video upload with progress
│   └── tests/                   # Test files
│       ├── README.md            # Testing conventions
│       ├── unit/convex/         # Convex function tests
│       └── e2e/                 # E2E browser tests
│
├── adws/                        # AI Developer Workflow system
│   ├── README.md                # ADW documentation
│   ├── adw_plan_build.py        # Main orchestrator
│   └── adw_plan_build_test.py   # Full pipeline with tests
│
├── .claude/                     # Claude Code configuration
│   ├── commands/                # Slash commands
│   └── hooks/                   # Lifecycle hooks
│
├── specs/                       # Feature specifications
└── scripts/                     # Utility scripts
```

---

## Quick Start

### 1. Clone and Setup

```bash
git clone <repo-url> sprint-planner
cd sprint-planner

# Copy environment file
cp .env.sample .env
```

### 2. Configure Environment

Edit `.env` with your credentials:

```bash
# Required - Convex
CONVEX_DEPLOYMENT=your-deployment-name

# Required - Gemini (Core functionality)
GOOGLE_GEMINI_API_KEY=your-gemini-key

# Required - ADW/Claude Code
ANTHROPIC_API_KEY=sk-ant-...

# Optional - GitHub (for private repos)
GITHUB_PAT=ghp_...
```

### 3. Initialize Convex

```bash
cd app

# Install dependencies
pnpm install

# Initialize Convex (creates project in Convex dashboard)
npx convex init

# Deploy schema
npx convex dev
```

### 4. Start Development

```bash
# From project root
./scripts/start.sh

# Or manually:
# Terminal 1: cd app && npx convex dev
# Terminal 2: cd app && pnpm dev
```

Visit http://localhost:3000

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CONVEX_DEPLOYMENT` | Yes | Convex project deployment name |
| `GOOGLE_GEMINI_API_KEY` | Yes | Gemini 3 API key for code analysis and video synthesis |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for ADW |
| `GITHUB_PAT` | No | GitHub token for private repo access (defaults to `gh auth`) |

### Gemini API Key Usage

The `GOOGLE_GEMINI_API_KEY` is used for:
- **Gemini 3 Flash** (`gemini-3.0-flash-001`): Fast code analysis and Architecture Legend generation
- **Gemini 3 Pro** (`gemini-3.0-pro-001`): Deep video reasoning and Repair Manifest synthesis
- **Gemini File API**: Large video uploads (up to 200MB, resumable)

---

## Key Concepts

### Architecture Legend
A comprehensive Markdown report generated by analyzing your codebase. Includes:
- Executive summary and tech stack
- Data architecture and schema
- File manifest with annotations
- Core workflows and API integrations
- UI/UX specifications

### Repair Manifest
The final output - a structured document containing:
- Issue breakdown with severity levels
- Timestamp-to-code correlations from video
- File-specific agent directives
- Step-by-step implementation instructions

### Review Session
A single critique workflow that:
1. Snapshots the codebase at a specific commit
2. Associates a video critique
3. Generates a targeted Repair Manifest

---

## Testing

### Running Tests

```bash
cd app

# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# E2E tests (requires servers running)
node tests/e2e/run_test.js
```

### Test Credentials

| Field | Value |
|-------|-------|
| Email | test@mail.com |
| Password | password123 |

---

## ADW System

Sprint Planner is built using the ADW (AI Developer Workflow) system. To contribute:

### Commands

```bash
cd adws

# Process single issue
uv run adw_plan_build.py <issue-number>

# Full pipeline with tests
uv run adw_plan_build_test.py <issue-number>
```

### Claude Code Commands

| Command | Description |
|---------|-------------|
| `/prime` | Initialize context (read key files) |
| `/test` | Run test suite |
| `/start` | Start dev servers |
| `/feature` | Feature implementation workflow |
| `/bug` | Bug fix workflow |

---

## Troubleshooting

### "Convex not connected"
- Ensure `npx convex dev` is running
- Check `CONVEX_DEPLOYMENT` in `.env`

### "Gemini API error"
- Verify `GOOGLE_GEMINI_API_KEY` is set
- Check API quotas in Google AI Studio
- For large videos, ensure File API is enabled

### "Video upload failed"
- Maximum file size: 200MB
- Supported formats: MP4, WebM
- Check network connection for resumable uploads

### Type Errors
```bash
cd app && npx convex typecheck
```

---

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Google Gemini API](https://ai.google.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)

---

*Sprint Planner - Closing the Agentic Gap, one video critique at a time.*
