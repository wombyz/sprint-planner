#!/bin/bash

# Start Convex + Next.js Development Servers
#
# This script starts both servers needed for development:
# 1. Convex backend (schema sync + function execution)
# 2. Next.js frontend (React application)

set -e

cd "$(dirname "$0")/.."
APP_DIR="app"

echo "🚀 Starting Convex + Next.js development servers..."
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Error: $APP_DIR directory not found"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$APP_DIR/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$APP_DIR" && pnpm install
    cd ..
fi

# Start Convex in background
echo "Starting Convex backend..."
cd "$APP_DIR"
npx convex dev &
CONVEX_PID=$!

# Wait for Convex to be ready
echo "⏳ Waiting for Convex to initialize..."
sleep 5

# Check if Convex is still running
if ! kill -0 $CONVEX_PID 2>/dev/null; then
    echo "❌ Convex failed to start. Check your CONVEX_DEPLOYMENT env var."
    exit 1
fi

# Start Next.js
echo "Starting Next.js frontend..."
pnpm dev &
NEXTJS_PID=$!

echo ""
echo "✅ Development servers starting!"
echo ""
echo "   Convex:  Running (PID: $CONVEX_PID)"
echo "   Next.js: http://localhost:3000 (PID: $NEXTJS_PID)"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $CONVEX_PID 2>/dev/null || true
    kill $NEXTJS_PID 2>/dev/null || true
    echo "✅ Servers stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $CONVEX_PID $NEXTJS_PID
