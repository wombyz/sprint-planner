Sprint Planner: Comprehensive Software Development Specification
Document Metadata

Version: 1.0.0
Status: Approved for Implementation
Author: Liam Ottley (Product Owner & Workflow Architect)
Date: December 11, 2025
Intended Audience: AI Coding Agents (e.g., Claude Code via ADW), Human Developers
Build Method: Agentic Workflow using Claude Code CLI, following the "Agentic Convex Template" conventions
Deployment Target: Vercel (Frontend), Convex Cloud (Backend)
License: Internal Use Only (Morningside AI)

This specification is written in the third person, providing a complete, self-contained blueprint for building Sprint Planner. It draws from Liam Ottley's established workflows, where autonomous AI agents (ADWs) construct 90% of applications, but the final 10%—nuanced UI fixes, edge-case bugs, and visual polish—requires human intervention. The tool addresses this "Agentic Gap" by enabling bulk analysis via video critiques, leveraging the latest Google Gemini 3 models for multimodal reasoning over entire codebases.
Sprint Planner is not a general-purpose tool; it is a specialized "Repair Shop" for Ottley's agentic engineering pipeline. It transforms unstructured human feedback (screen recordings) into structured, file-specific directives that Claude Code can execute autonomously, closing the loop on iterative development.

1. Executive Summary & Strategic Context
   1.1 The Agentic Gap in Modern Development
   Liam Ottley, a prolific AI engineer and founder of Morningside AI, relies on Agentic Developer Workflows (ADWs)—autonomous systems powered by Claude Code—to build applications at unprecedented speed. These workflows decompose GitHub issues into code changes, tests, and pull requests, achieving 90% coverage for core features. However, the remaining 10% often falls through the cracks: subtle UI misalignments, unhandled edge cases in user flows, and visual inconsistencies that only reveal themselves during hands-on testing.
   Manually bridging this gap is inefficient. Ottley must screen-record critiques (e.g., "The modal doesn't close smoothly after submission"), then painstakingly map them to files (e.g., "Update components/Modal.tsx line 45 to include onSuccess callback"), and format them as ADW-ready chunks. This "translation friction" consumes hours per sprint, slowing iteration.
   1.2 Why Sprint Planner Exists
   Sprint Planner is Ottley's dedicated dev tool to eliminate this friction. It operationalizes his "Human-in-the-Loop" philosophy: Humans provide high-bandwidth input (video + voice), AI handles low-bandwidth synthesis (code correlation + task decomposition). The result is a "Repair Manifest"—a copy-pasteable Markdown document that Claude Code can ingest to generate dozens of autonomous GitHub issues.
   Key Outcomes:

Time Savings: A 5-minute video critique yields a 2-hour sprint plan.
Precision: Gemini 3's multimodal capabilities correlate cursor movements/timestamps to exact code lines.
Scalability: Handles multiple apps (e.g., ThumbForge, ContentOS) with session history.
Autonomy: Outputs integrate directly with ADW, triggering Claude Code without further human input.

1.3 High-Level Value Proposition

StakeholderBenefitLiam Ottley (Product Owner)Rapid feedback loops; focus on vision, not debugging.Claude Code AgentsStructured, file-aware tasks; reduced hallucination risk.ADW PipelineBulk issue generation; automated testing/PRs.
1.4 Assumptions & Constraints

Gemini 3 Availability: As of December 2025, Gemini 3 (released November 18, 2025) is used for its 1M+ token context, Deep Think reasoning, and native video understanding (up to 2GB files). Fallback to Gemini 2.5 if API quotas hit.
Video Limits: Up to 200MB MP4/WebM; longer videos distilled via timestamps.
Codebase Size: GitHub repos <500 files; tree-shaking for larger (prioritize src/, exclude node_modules).
Auth: Convex Auth (Password-based) for simplicity; single-user focus (Ottley).

2. User Stories & Core Workflow
   Sprint Planner's UX is minimalist and "sticky"—progress saves automatically, allowing rollback between steps. The interface evokes a clean dashboard (inspired by Linear/Superhuman), with dark mode, glassmorphism cards, and JetBrains Mono for code blocks.
   2.1 Primary User Personas

Liam Ottley: AI Engineer, 25, building 5+ apps/year. Needs fast, visual-to-technical translation for ADW handoffs.

2.2 Key User Stories
As Liam, I want to:

US1: Manage apps tied to GitHub repos, so I can switch between ThumbForge and ContentOS without re-setup.
US2: Start a new review, auto-sync the latest commit, and get an instant "Architecture Legend" report, so I understand the codebase snapshot.
US3: Upload a critique video with focus instructions, so the AI analyzes my narration + visuals against the Legend.
US4: Review the streamed "Repair Manifest", copy it to clipboard, and feed it to Claude Code for chunking, so agents fix issues autonomously.
US5: Pause/resume reviews, viewing history per app, so I can context-switch without losing state.

2.3 Detailed Workflow
The review is a 3-step wizard, persisted in Convex for asynchrony.

Step 1: Sync & Legend Generation (5-10s)
UI: Project dashboard → "New Review" → Auto-trigger sync.
Backend: Convex Action fetches GitHub tree, builds XML, calls Gemini 3 Flash for Legend report (example in Section 6.1).
Output: Markdown report cached in DB; preview in UI (collapsible sections).

Step 2: Video Critique (Upload + Instructions, 1-2min)
UI: Drag-drop zone for video; textarea for "Focus on auth flow bugs".
Backend: Upload to Convex Storage; on submit, Action streams to Gemini File API (resumable, Node.js).
Sticky: Save partial uploads; rollback to re-upload.

Step 3: Manifest Synthesis (30-60s)
UI: Split-view: Left (video player with timestamps), Right (streaming Markdown).
Backend: Gemini 3 Pro Multimodal call with video URI + Legend + instructions (prompt in Section 6.2).
Output: Full Repair Manifest; "Copy to Claude" button.

Post-Workflow: Manifest copied → Paste into Claude Code → /expand_spec_to_plan → ADW chunks issues. 3. Technical Architecture
3.1 System Diagram
text┌─────────────────────┐ ┌─────────────────────────────┐
│ Frontend │ │ Convex Backend │
│ (Next.js 15) │ │ │
│ ┌─────────────────┐ │ │ ┌─────────────────────────┐ │
│ │ Dashboard │<───▶│ │ Queries/Mutations │ │
│ │ Project List │ │ │ (Real-time Sync) │ │
│ │ Review Wizard │ │ └─────────────────────────┘ │
│ │ Video Player │ │ ┌─────────────────────────┐ │
│ │ Markdown Viewer │ │ │ Actions (Node.js) │ │
│ └─────────────────┘ │ │ │ - GitHub Fetch │ │
│ │ │ │ - Gemini Calls │ │
│ ┌─────────────────┐ │ │ │ - File Streaming │ │
│ │ Shadcn/Tailwind │ │ │ └─────────────────────────┘ │
│ └─────────────────┘ │ │ ┌─────────────────────────┐ │
└─────────────────────┘ │ │ Storage (Videos/XML) │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ DB (Projects/Reviews) │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
│
▼
┌─────────────────────┐ ┌─────────────────────────────┐
│ External APIs │ │ AI Engine │
│ ┌─────────────────┐ │ │ (Google Gemini 3) │
│ │ GitHub (Octokit) │◀───▶│ ┌─────────────────────────┐ │
│ └─────────────────┘ │ │ │ Flash (Code Analysis) │ │
└─────────────────────┘ │ │ Pro (Video Synthesis) │ │
│ │ File API (Uploads) │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
3.2 Key Decisions & Research Insights
Based on web searches (December 2025):

Gemini 3 Overview: Released November 18, 2025 (Google Blog, Reuters). Capabilities: 1M-2M token context, Deep Think (chain-of-thought reasoning), native multimodal (video up to 2GB, 1-hour length). Models: gemini-3.0-pro-001 (primary), gemini-3.0-flash-001 (fast). Billing starts January 5, 2026 for some features (AI Studio changelog). Use for video analysis with large code context (Towards Data Science, Google Developers Blog).
Large Video Uploads: Files >20MB require Files API (ai.google.dev). Resumable protocol for >50MB (Stack Overflow, Medium). Node.js best practice: Use @google/generative-ai/server SDK's GoogleAIFileManager.uploadFile() with streams (Google Cloud Docs). Max 2GB/video (Gemini Help Forum). Poll for state: 'ACTIVE' (up to 2min for 200MB).
Multimodal Video + Large Context: Place instructions at prompt end for long contexts (Google Developers Blog). Video URIs in fileData for generateContent (Vertex AI Docs). Deep Think via thinkingConfig: { includeThoughts: true } (Nipun Batra blog). Handles 1M tokens code + video (Medium/Towards Data Science).
Resumable Upload Node.js: REST API with X-Goog-Upload-Protocol: 'resumable' (Tanaike Gist, Google Drive API). Chunk if >1GB; finalize with offset (Cloud Storage Docs). SDK wraps this (Medium script).

Fallback: Gemini 2.5 if 3 quotas exceeded. 4. Data Schema (Convex)
File: convex/schema.ts
TypeScriptimport { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
// Projects (Apps tied to GitHub)
projects: defineTable({
name: v.string(),
description: v.optional(v.string()),
githubOwner: v.string(), // e.g., "liamottley"
githubRepo: v.string(), // e.g., "thumbforge"
githubBranch: v.default("main", v.string()),
githubAccessToken: v.optional(v.string()), // Encrypted PAT
lastSyncedCommit: v.optional(v.string()),
architectureLegend: v.optional(v.string()), // Markdown report
createdAt: v.number(),
updatedAt: v.number(),
})
.index("by_name", ["name"])
.index("by_owner_repo", ["githubOwner", "githubRepo"]),

// Reviews (Sessions per Project)
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
codeSnapshotCommit: v.optional(v.string()), // Git commit hash
architectureLegendSnapshot: v.optional(v.string()), // Copy of legend at time
videoStorageId: v.optional(v.id("\_storage")), // Convex storage
videoGeminiUri: v.optional(v.string()), // Processed URI
customInstructions: v.optional(v.string()), // User focus notes
repairManifest: v.optional(v.string()), // Final Markdown
createdAt: v.number(),
updatedAt: v.number(),
})
.index("by_project_status", ["projectId", "status"])
.index("by_project_updated", ["projectId", "updatedAt"]),
});
Migration Notes: Start with empty DB. Use Convex dashboard for initial seeding. 5. Core Modules & Technical Breakdown
5.1 Module 1: GitHub Sync (Convex Action)
File: convex/actions/githubSync.ts
Breakdown: Fetches repo tree via Octokit, filters files, builds XML (token-aware, <1M limit), calls Gemini 3 Flash for Legend. Caches in DB.
Code Snippet (Full Action):
TypeScript"use node";
import { action } from "./\_generated/server";
import { v } from "convex/values";
import { Octokit } from "@octokit/rest";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const syncRepoAndAnalyze = action({
args: {
projectId: v.id("projects"),
},
handler: async (ctx, args) => {
const project = await ctx.db.get(args.projectId);
if (!project) throw new Error("Project not found");

    const octokit = new Octokit({ auth: project.githubAccessToken });
    const { data: { sha } } = await octokit.repos.getCommit({
      owner: project.githubOwner,
      repo: project.githubRepo,
      ref: project.githubBranch,
    });

    // Fetch tree (recursive)
    const { data: tree } = await octokit.git.getTree({
      owner: project.githubOwner,
      repo: project.githubRepo,
      tree_sha: sha,
      recursive: true,
    });

    // Filter & Build XML (tree-shake: src/, app/, convex/; exclude node_modules, .git, etc.)
    let xml = "<codebase>\n";
    let tokenEstimate = 0;
    for (const node of tree.tree) {
      if (node.type === "blob" && node.path && shouldIncludeFile(node.path)) {
        const { data: { content: encoded } } = await octokit.git.getBlob({
          owner: project.githubOwner,
          repo: project.githubRepo,
          file_sha: node.sha,
        });
        const decoded = Buffer.from(encoded, "base64").toString("utf-8");
        if (tokenEstimate + decoded.length / 4 > 800000) break; // Rough token estimate; truncate if needed
        xml += `<file path="${node.path}">\n${escapeXml(decoded)}\n</file>\n`;
        tokenEstimate += decoded.length / 4;
      }
    }
    xml += "</codebase>";

    // Call Gemini 3 Flash for Legend (prompt from Section 6.1)
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash-001" });
    const result = await model.generateContent([
      { text: ARCHITECTURE_LEGEND_PROMPT }, // Full prompt below
      { text: `CODEBASE XML:\n${xml}` },
    ]);
    const legend = result.response.text();

    // Update DB
    await ctx.db.patch(args.projectId, {
      lastSyncedCommit: sha,
      architectureLegend: legend,
      updatedAt: Date.now(),
    });

    return { commit: sha, legendLength: legend.length };

},
});

function shouldIncludeFile(path: string): boolean {
const exclude = [/node_modules/, /\.git/, /dist/, /\.next/, /lock/, /\.(png|jpg|mp4)$/];
return !exclude.some(regex => regex.test(path)) && (path.startsWith("app/") || path.startsWith("convex/") || path.startsWith("src/"));
}

function escapeXml(str: string): string {
return str.replace(/[<>&'"]/g, m => ({ '<': '&lt;', '>': '&gt;', '>': '&amp;', "'": '&#39;', '"': '&quot;' }[m]));
}
Research Notes: Octokit for GitHub (v20+). Token estimation: ~4 chars/token (Google Blog). Truncate to 800k chars for safety.
5.2 Module 2: Video Upload & Processing (Convex Action)
File: convex/actions/videoProcess.ts
Breakdown: Client uploads to Convex Storage (resumable via fetch). Action retrieves stream, uses SDK for resumable upload to Gemini File API, polls for ACTIVE, stores URI.
Code Snippet (Full Action):
TypeScript"use node";
import { action } from "./\_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI, GoogleAIFileManager } from "@google/generative-ai/server";
import { Readable } from "stream";

export const processVideo = action({
args: {
reviewId: v.id("reviews"),
videoStorageId: v.id("\_storage"),
},
handler: async (ctx, args) => {
const review = await ctx.db.get(args.reviewId);
if (!review) throw new Error("Review not found");

    // Get stream from Convex Storage
    const videoStream = await ctx.storage.getStream(args.videoStorageId);
    if (!videoStream) throw new Error("Video stream not available");

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const fileManager = new GoogleAIFileManager(genAI);

    // Resumable Upload (SDK handles chunking for >50MB)
    const uploadResult = await fileManager.uploadFile(videoStream as Readable, {
      mimeType: "video/mp4",
      displayName: `sprint-review-${review._id}`,
    });

    // Poll for ACTIVE (best practice: 2s intervals, timeout 5min)
    let file = await fileManager.getFile(uploadResult.file.name);
    let attempts = 0;
    while (file.state === "PROCESSING") {
      if (attempts > 150) throw new Error("Video processing timeout");
      await new Promise(resolve => setTimeout(resolve, 2000));
      file = await fileManager.getFile(uploadResult.file.name);
      attempts++;
    }

    if (file.state !== "ACTIVE") throw new Error(`Upload failed: ${file.state}`);

    // Update DB
    await ctx.db.patch(args.reviewId, {
      videoGeminiUri: file.uri,
      status: "analyzing_video",
      updatedAt: Date.now(),
    });

    return { uri: file.uri, state: file.state };

},
});
Research Notes: SDK's uploadFile supports streams (Google AI Dev Docs, Medium 2024). Resumable via internal protocol (Tanaike Gist). Poll loop prevents race conditions (Stack Overflow 2024). 200MB processes in ~1-2min (Gemini Help 2025).
Client-Side Upload to Convex (Frontend Hook):
TypeScript// hooks/useVideoUpload.ts
import { useMutation } from "convex/react";
import { api } from "../convex/\_generated/api";

export const useVideoUpload = () => {
const upload = useMutation(api.storage.generateUploadUrl);
const process = useMutation(api.actions.videoProcess);

const handleUpload = async (file: File) => {
if (file.size > 200 _ 1024 _ 1024) throw new Error("File too large");

    // Resumable to Convex (fetch with progress)
    const url = await upload();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
      duplex: "half", // For streaming upload
    });
    const { storageId } = await response.json();

    // Trigger processing
    return process({ reviewId: "your-review-id", videoStorageId: storageId });

};

return { handleUpload };
};
5.3 Module 3: Synthesis Engine (Convex Action)
File: convex/actions/generateManifest.ts
Breakdown: Calls Gemini 3 Pro with video URI + Legend + instructions. Streams response for UI.
Code Snippet (Full Action):
TypeScript"use node";
import { action } from "./\_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateManifest = action({
args: {
reviewId: v.id("reviews"),
},
handler: async (ctx, args) => {
const review = await ctx.db.get(args.reviewId);
if (!review || !review.videoGeminiUri || !review.architectureLegendSnapshot) {
throw new Error("Missing video URI or codebase legend");
}

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.0-pro-001",
      generationConfig: { responseMimeType: "text/plain" },
      systemInstruction: "You are a Staff Principal Architect synthesizing video critiques into engineering manifests.",
    });

    const result = await model.generateContent([
      {
        fileData: {
          fileUri: review.videoGeminiUri,
          mimeType: "video/mp4",
        },
      },
      { text: REPAIR_MANIFEST_PROMPT }, // Full prompt below
      { text: `CODEBASE LEGEND:\n${review.architectureLegendSnapshot}` },
      { text: `CUSTOM INSTRUCTIONS:\n${review.customInstructions || ""}` },
    ]);

    const manifest = result.response.text();

    await ctx.db.patch(args.reviewId, {
      repairManifest: manifest,
      status: "manifest_generated",
      updatedAt: Date.now(),
    });

    return { manifestLength: manifest.length };

},
});
Research Notes: Multimodal via fileData (ai.google.dev). Large context: Instructions last (Google Blog 2025). Deep Think implicit in Pro model (DeepMind). 6. Prompt Engineering
6.1 Architecture Legend Prompt (Phase 1 – Code Analysis)
Hardcoded in convex/actions/githubSync.ts. Use Gemini 3 Flash for speed.
JavaScriptconst ARCHITECTURE_LEGEND_PROMPT = `
You are a **Staff Principal Software Architect**.

**TASK**: Reverse-engineer a **Massive Software Architecture Specification** from the provided codebase.

**INPUT**: Full source code in XML format.

**GOAL**: Create a foundational "Legend" that allows an autonomous agent to navigate this codebase with 100% precision.

**CRITICAL REQUIREMENT**:

1. The output must be EXTREMELY DETAILED.
2. **Section 4 (Application Architecture)** must be an **Exhaustive File Manifest** of every source code file.

**REQUIRED OUTPUT STRUCTURE (Markdown)**:

# [Project Name] Software Architecture Specification

## 1. Executive Summary

- **Project Overview**: What does this app do?
- **Core Value Proposition**: Key features and problems solved.
- **User Roles**: Who uses this?

## 2. Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, Lucide React.
- **Styling**: Tailwind CSS, Shadcn UI, Custom Glassmorphism utilities (`.glass`).
- **State Management**: Convex (Remote State/Subscriptions), React Context (`ImageDetailContext`, `ToastContext`), React Hooks.
- **Backend/DB**: Convex (Real-time Database, Serverless Functions, File Storage, Scheduling).
- **AI/LLM Integration**: Detail any AI services found.

## 3. Data Architecture

### Data Models

Types inferred from schema files.

### Database Schema (Convex)

Relationships from schema.ts.

### Data Flow

Step-by-step flows (e.g., Image Generation).

## 4. Application Architecture & File Manifest

List EVERY file path. Annotate key files.

**Example Format:**
**`app/`**

- `layout.tsx` - Root layout with auth wrapper.

[Continue for all files...]

## 5. Core Workflows

Step-by-step breakdowns.

## 6. External API Integration

Services, models, prompts.

## 7. UI/UX Specification

Design system, pages, components.

## 8. Error Handling & Edge Cases

**STYLE RULES**:

- Be Specific: Quote filenames and functions.
- Be Comprehensive: No "TBD".
- Format: Clean Markdown with tables.
  `;
6.2 Repair Manifest Prompt (Phase 2 – Video Synthesis)
Hardcoded in convex/actions/generateManifest.ts. Use Gemini 3 Pro for reasoning.
JavaScriptconst REPAIR_MANIFEST_PROMPT = `
  You are a **Staff Principal Software Engineer** acting as the **Technical Architect** for an autonomous coding agent (Claude Code).

**TASK**: Transform the user's video review into a **Deep-Dive Repair Manifest**.

**INPUTS**:

1. **Codebase Map**: The structural "Legend" of the application architecture.
2. **Video Review**: A screen recording where the user points out bugs, UX flaws, and missing features.
3. **Instructions**: User-specific focus areas.

**CORE REQUIREMENT**:
Output must be exhaustive and technically explicit. Catch every detail from the video and translate to engineering tasks.

**ANALYSIS PROTOCOL**:

1. **Visual & Audio Transcription**: Watch second-by-second. Log hesitations, clicks, complaints.
2. **Codebase Triangulation**: Pinpoint exact file/component from Legend.
3. **Root Cause Analysis**: Hypothesize why broken (e.g., "Missing useEffect for state sync").
4. **Solution Engineering**: Step-by-step directives.

**OUTPUT FORMAT (Markdown)**:

# Repair Manifest: [Session Title]

> **System Prompt**: "Execute these tasks with high precision for ADW."

## 1. Executive Strategy

- **Current State Assessment**: Health check.
- **Architectural Bottlenecks**: Patterns causing issues.
- **Prioritized Plan**: Numbered attack order.

## 2. Issue Breakdown

### [ISSUE-00X] [Title]

- **Severity**: Critical / Major / Minor / Polish
- **User Feedback**:
  - _Timestamp_: 0:45
  - _Quote_: "Why doesn't this close?"
  - _Visual Context_: Clicked button, spinner, modal stuck.
- **Technical Diagnosis**:
  - **Suspected File(s)**: \`components/Modal.tsx\`
  - **Logic Gap**: No onSuccess listener.
- **Agent Directive**:
  1. Open file...
  2. Add callback...

## 3. Missing Feature Specifications

### [FEAT-001] [Name]

- **User Requirement**: Quote
- **Proposed Architecture**: New component...
- **Implementation Steps**: 1. Create...

**RULES**:

- Specific: "Update padding to 16px".
- Reference Files: Cite from Legend.
- Comprehensive: One issue per mention.
- Technical Tone: For senior devs/agents.
  `;

7. UI/UX Design Specification
   7.1 Design Principles

Minimalist: White space heavy, sans-serif fonts.
Modern: Glassmorphism cards (backdrop-blur), subtle animations (framer-motion).
Accessible: ARIA labels, keyboard nav, high contrast.

7.2 Component Library
Use Shadcn UI base:

Cards: Glass variant (bg-white/10 backdrop-blur).
Stepper: For review steps (Radix Tabs).
Markdown Viewer: React-Markdown with syntax highlighting (prism-react-renderer).
Video Player: Video.js or native <video> with timestamp jumps.

7.3 Wireframes (Textual)

Dashboard: Grid of project cards (name, last sync, # reviews).
Review Stepper: Horizontal tabs (Code Analyzed | Video Upload | Manifest).
Video Upload: Dropzone + progress bar.
Manifest: Scrollable pane with copy button.

8. Implementation Plan (ADW Chunks)
   Execute via /adw_plan_build_test <chunk-number>.
   Chunk 1: Scaffold & Auth (2h, Feature)
   Objective: Initialize Next.js + Convex project with auth.
   Tasks:

Run npx create-next-app@15 sprint-planner --typescript --tailwind --app.
cd sprint-planner/app && npx convex init.
Implement Convex Auth (password).
Create projects/reviews schema.

Files: convex/schema.ts, app/(auth)/login/page.tsx.
Acceptance: Login works; dashboard shows empty project list.
Chunk 2: GitHub Project Management (3h, Feature)
Objective: CRUD for projects with repo linking.
Tasks:

Mutations: createProject, updateProject.
UI: Dashboard grid, Add Modal (owner/repo/branch inputs).
Store PAT securely (Convex field, encrypted).

Files: convex/projects.ts, components/ProjectCard.tsx.
Acceptance: Create project; list shows linked repos.
Chunk 3: Code Sync & Legend Generation (4h, Feature)
Objective: Sync action + Gemini Flash call.
Tasks:

Implement syncRepoAndAnalyze (Octokit + XML + prompt).
UI: "Sync" button in project view; spinner + preview Legend.

Files: convex/actions/githubSync.ts, lib/octokit.ts.
Acceptance: Sync button generates Legend Markdown.
Chunk 4: Video Upload Pipeline (3h, Feature)
Objective: Client upload + server resumable to Gemini.
Tasks:

Frontend hook for Convex upload.
Action processVideo with SDK upload + poll.

Files: convex/actions/videoProcess.ts, hooks/useVideoUpload.ts.
Acceptance: 100MB video uploads, URI stored.
Chunk 5: Manifest Synthesis (3h, Feature)
Objective: Multimodal Gemini call + streaming UI.
Tasks:

Action generateManifest with prompt.
UI: Split pane, stream response via SSE.

Files: convex/actions/generateManifest.ts, components/ManifestViewer.tsx.
Acceptance: Video + Legend → Manifest output.
Chunk 6: Polish & Review History (2h, Chore)
Objective: Sticky steps, history list.
Tasks:

Status updates trigger UI re-renders.
Sidebar for past reviews.

Files: app/project/[id]/review/[reviewId]/page.tsx.
Acceptance: Full end-to-end flow. 9. Error Handling & Edge Cases

GitHub Sync Fail: Retry 3x; fallback to cached Legend.
Video >200MB: Reject upload; toast error.
Gemini Quota: Exponential backoff; log to Convex.
Token Overflow: Truncate XML; warn in UI.
Offline: Queue actions; sync on reconnect (Convex handles).

Monitoring: Convex Logs + Sentry integration. 10. Deployment & Testing
10.1 Deployment

Frontend: Vercel (auto-deploy from GitHub).
Backend: npx convex deploy.
Env: Vercel secrets for API keys.

10.2 Testing Strategy

Unit: Vitest for hooks/utils (80% coverage).
E2E: Playwright for workflows (video mock via fixtures).
Load: 200MB video upload simulation.

Commands:
Bashpnpm test # Unit
npx playwright test # E2E
npx convex typecheck # Schema
