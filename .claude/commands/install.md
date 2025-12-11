# Install & Prime

> Initialize a new project from this template.

## Pre-check
- Verify that `.env` exists in the project root. If it doesn't exist, stop and instruct the user to create it based on `.env.sample` before running /install.

## Read and Execute
.claude/commands/prime.md

## Run
- Initialize a new git repository (if not already initialized): `git init`
- If the user's app has dependencies in `app/`, install them (e.g., `cd app && npm install` or `pnpm install`)
- Copy environment files if needed: `./scripts/copy_dot_env.sh` (if it exists)

## Report
- Output the work you've just done in a concise bullet point list.
- Remind the user to:
  1. Update the `.claude/commands/prime.md` file with their key project files
  2. Configure their app's start command in `scripts/start.sh`
  3. Set up their GitHub repository for ADW:
     ```
     git remote add origin <your-repo-url>
     git push -u origin main
     ```
  4. Configure GitHub webhook (optional) for instant issue processing