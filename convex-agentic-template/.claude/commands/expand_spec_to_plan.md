# Expand MVP Spec to Implementation Plan

Transform any MVP specification into a clear, actionable implementation plan with chunks suitable for ADW workflows.

## Variables

spec_content: $1

## Instructions

You are a senior technical architect. Read the provided MVP specification and create a comprehensive implementation plan.

### Your Task

1. **Understand the Project**

   - Read the entire spec
   - Identify core features and requirements
   - Understand the tech stack
   - Note any constraints or dependencies

2. **Create the Plan**

   - Break the project into 15-25 implementation chunks
   - Each chunk should be 2-8 hours of work
   - Each chunk must be testable independently
   - Order chunks by dependencies (foundation → features → polish)

3. **Chunk Guidelines**
   - **Foundation Chunks (1-3)**: Project setup, auth, core data models
   - **Feature Chunks (4-15)**: One major feature per 1-3 chunks
   - **Integration Chunks (16-20)**: Connect features, error handling
   - **Polish Chunks (21-25)**: Testing, docs, deployment

---

## Output Format

Return a markdown document with this structure:

```markdown
# MVP Implementation Plan: {Project Name}

## Project Overview

**What**: {1-sentence description}
**Why**: {Problem being solved}
**Who**: {Target users}

## Tech Stack

**Frontend**: {Framework + key libraries}
**Backend**: {Framework + database}
**Infrastructure**: {Hosting + services}
**APIs**: {External services}

## Core Features

1. {Feature name}: {What it does}
2. {Feature name}: {What it does}
   {List 5-10 core features}

## Data Model

{List 3-5 main entities with key fields}

Example:

- **users**: email, name, passwordHash
- **projects**: userId, title, createdAt
- **tasks**: projectId, status, config

## Architecture

{2-3 sentences describing how the system works}

Example: "Next.js frontend communicates with Convex backend via real-time subscriptions. Convex handles data storage and serverless functions. External API calls are made from Convex actions."

---

## Implementation Chunks

### Chunk 1: Project Setup & Core Infrastructure

**Time**: 3 hours
**Dependencies**: None
**Type**: foundation

**Objective**: Initialize project with basic structure and dependencies.

**Tasks**:

1. Initialize {framework} project
2. Set up {backend/database}
3. Configure {essential libraries}
4. Create basic project structure
5. Set up development environment

**Deliverables**:

- Working dev environment
- Basic project structure
- Dependencies installed

**Acceptance Criteria**:

- [ ] Project runs locally
- [ ] All dependencies install without errors
- [ ] Basic "hello world" page loads

**Files**:

- `package.json`: Dependencies
- `{config files}`: Project configuration
- `README.md`: Setup instructions

---

### Chunk 2: {Next foundation chunk}

**Time**: {hours}
**Dependencies**: chunk-1
**Type**: foundation

{Same structure as above}

---

{Continue for all chunks...}

---

## Execution Groups

Organize chunks that can run in parallel:

**Group 1** (Foundation):

- Chunk 1

**Group 2** (Parallel):

- Chunk 2
- Chunk 3

**Group 3**:

- Chunk 4

{Continue...}

## Success Criteria

The MVP is complete when:

- [ ] All chunks implemented and tested
- [ ] Core user flows work end-to-end
- [ ] All acceptance criteria met
- [ ] Deployable to production

## Out of Scope

{List what's NOT in this MVP}

## Quality Requirements

Ensure:

- Each chunk is 2-8 hours (not too big, not too small)
- Dependencies are explicit and correct
- No circular dependencies
- Tasks are specific and actionable
- Acceptance criteria are testable
- Execution groups make sense

## Report

After generating the plan, summarize:

- Total chunks: {number}
- Execution groups: {number}
- Estimated timeline: {weeks}
- Key risks: {if any}
```
