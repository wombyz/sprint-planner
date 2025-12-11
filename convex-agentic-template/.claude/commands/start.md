# Start Development Server

> Start the Convex + Next.js development servers.

## Run

```bash
./scripts/start.sh
```

## What This Does

For a Convex + Next.js application, you need TWO servers running:

1. **Convex Backend** (`npx convex dev`)
   - Syncs schema changes automatically
   - Runs Convex functions
   - Connects to Convex cloud

2. **Next.js Frontend** (`pnpm dev`)
   - Serves the React application
   - Hot module reloading
   - Runs on http://localhost:3000

## Server Health Check

Before running E2E tests, verify servers are ready:

```bash
# Check if page loads without "Loading..." (Convex connected)
curl -s http://localhost:3000/login | grep -q "Loading" && echo "NOT READY" || echo "READY"
```

## Manual Start (Development)

```bash
# Terminal 1: Start Convex (run FIRST, wait for "ready")
cd app && npx convex dev

# Terminal 2: Start Next.js (after Convex is ready)
cd app && pnpm dev
```

## Notes

- Convex must start first and show "Convex functions ready!" before Next.js
- The script should be non-blocking for ADW to continue working
- Default frontend URL: http://localhost:3000