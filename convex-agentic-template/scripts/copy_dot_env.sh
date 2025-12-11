#!/bin/bash

# Get the script's directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source directory (tac-2 - previous project)
SOURCE_PROJECT="$PROJECT_ROOT/../tac-2"

# Copy root .env if tac-2 exists
if [ -f "$SOURCE_PROJECT/.env" ]; then
    cp "$SOURCE_PROJECT/.env" "$PROJECT_ROOT/.env"
    echo "Successfully copied .env from tac-2"
else
    echo "Note: No .env found in tac-2, skipping root .env copy"
fi

# Copy app .env.local if tac-2 exists
if [ -f "$SOURCE_PROJECT/app/.env.local" ]; then
    cp "$SOURCE_PROJECT/app/.env.local" "$PROJECT_ROOT/app/.env.local"
    echo "Successfully copied app/.env.local from tac-2"
else
    echo "Note: No app/.env.local found in tac-2, skipping app .env copy"
fi

echo ""
echo "Done! Remember to update environment variables for ThumbForge:"
echo "  - app/.env.local needs NEXT_PUBLIC_CONVEX_URL and GEMINI_API_KEY"
