#!/usr/bin/env -S uv run
# /// script
# dependencies = ["python-dotenv", "pydantic"]
# ///

"""
ADW MVP Decompose - Break down MVP plan into GitHub issues

Usage: 
  uv run adws/adw_mvp_decompose.py <plan-file> [--milestone <name>] [--dry-run]

Examples:
  uv run adws/adw_mvp_decompose.py specs/thumbforge-implementation-plan.md
  uv run adws/adw_mvp_decompose.py specs/thumbforge-implementation-plan.md --milestone thumbforge-v1
  uv run adws/adw_mvp_decompose.py specs/thumbforge-implementation-plan.md --dry-run
"""

import sys
import os
import re
import subprocess
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adws.adw_modules.utils import setup_logger


def parse_chunk_from_plan(chunk_text: str, chunk_number: int) -> Dict:
    """Parse a single chunk from the plan."""
    
    # Extract title
    title_match = re.search(r'^###\s+Chunk\s+\d+:\s+(.+?)$', chunk_text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else f"Chunk {chunk_number}"
    
    # Extract time
    time_match = re.search(r'\*\*Time\*\*:\s+(\d+)\s+hours?', chunk_text, re.IGNORECASE)
    estimated_hours = int(time_match.group(1)) if time_match else 4
    
    # Extract dependencies
    deps_match = re.search(r'\*\*Dependencies\*\*:\s+(.+?)$', chunk_text, re.MULTILINE)
    dependencies = []
    if deps_match:
        dep_text = deps_match.group(1).strip()
        if dep_text.lower() not in ["none", "none (foundation)"]:
            # Extract chunk numbers
            for num_match in re.finditer(r'chunk[- ](\d+)', dep_text, re.IGNORECASE):
                dependencies.append(int(num_match.group(1)))
    
    # Extract type
    type_match = re.search(r'\*\*Type\*\*:\s+(\w+)', chunk_text, re.IGNORECASE)
    chunk_type = type_match.group(1).strip() if type_match else "feature"
    
    return {
        "number": chunk_number,
        "title": title,
        "estimated_hours": estimated_hours,
        "dependencies": dependencies,
        "type": chunk_type,
        "content": chunk_text
    }


def parse_plan_file(plan_path: str) -> Dict:
    """Parse the MVP plan file."""
    
    with open(plan_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract project name
    project_match = re.search(r'^#\s+MVP Implementation Plan:\s+(.+?)$', content, re.MULTILINE)
    project_name = project_match.group(1).strip() if project_match else "Unknown Project"
    
    # Find Implementation Chunks section
    chunks_match = re.search(r'^##\s+Implementation Chunks\s*$(.+?)^##\s+', content, re.MULTILINE | re.DOTALL)
    if not chunks_match:
        raise ValueError("Could not find Implementation Chunks section")
    
    chunks_section = chunks_match.group(1)
    
    # Split by chunk headers
    chunk_pattern = r'^###\s+Chunk\s+(\d+):'
    chunk_matches = list(re.finditer(chunk_pattern, chunks_section, re.MULTILINE))
    
    chunks = []
    for i, match in enumerate(chunk_matches):
        chunk_number = int(match.group(1))
        start = match.start()
        end = chunk_matches[i + 1].start() if i + 1 < len(chunk_matches) else len(chunks_section)
        chunk_text = chunks_section[start:end]
        
        chunk = parse_chunk_from_plan(chunk_text, chunk_number)
        chunks.append(chunk)
    
    return {
        "project_name": project_name,
        "chunks": chunks
    }


def create_github_issue(chunk: Dict, project_name: str, milestone: Optional[str] = None, dry_run: bool = False) -> Optional[str]:
    """Create a GitHub issue for a chunk."""
    
    # Build issue title
    title = f"[MVP] Chunk {chunk['number']}: {chunk['title']}"
    
    # Build issue body
    body_lines = [
        f"## 📋 Chunk {chunk['number']} - {chunk['title']}",
        "",
        f"**Project**: {project_name}",
        f"**Estimated Time**: {chunk['estimated_hours']} hours",
        f"**Type**: {chunk['type']}",
        ""
    ]
    
    if chunk['dependencies']:
        deps_str = ", ".join([f"chunk-{d}" for d in chunk['dependencies']])
        body_lines.append(f"**Dependencies**: {deps_str}")
    else:
        body_lines.append("**Dependencies**: None (foundation)")
    
    body_lines.extend([
        "",
        "---",
        "",
        chunk['content'],
        "",
        "---",
        "",
        "## 🤖 ADW Execution",
        "",
        "To execute this chunk:",
        "```",
        "/adw_plan_build_test",
        "```"
    ])
    
    body = "\n".join(body_lines)
    
    # Build labels
    labels = ["mvp", f"chunk-{chunk['number']}", chunk['type']]
    
    if dry_run:
        print(f"\n{'='*80}")
        print(f"Would create: {title}")
        print(f"Labels: {', '.join(labels)}")
        if milestone:
            print(f"Milestone: {milestone}")
        print(f"{'='*80}\n")
        return None
    
    # Create issue with gh CLI
    cmd = ["gh", "issue", "create", "--title", title, "--body", body]
    
    for label in labels:
        cmd.extend(["--label", label])
    
    if milestone:
        cmd.extend(["--milestone", milestone])
    
    # Set up environment
    env = os.environ.copy()
    if os.getenv("GITHUB_PAT"):
        env["GH_TOKEN"] = os.getenv("GITHUB_PAT")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env, check=True)
        issue_url = result.stdout.strip()
        return issue_url
    except subprocess.CalledProcessError as e:
        print(f"Error creating issue: {e.stderr}")
        return None


def main():
    """Main entry point."""
    load_dotenv()
    
    if len(sys.argv) < 2:
        print("Usage: uv run adws/adw_mvp_decompose.py <plan-file> [--milestone <name>] [--dry-run]")
        sys.exit(1)
    
    plan_file = sys.argv[1]
    milestone = None
    dry_run = False
    
    # Parse flags
    for i in range(2, len(sys.argv)):
        if sys.argv[i] == "--milestone" and i + 1 < len(sys.argv):
            milestone = sys.argv[i + 1]
        elif sys.argv[i] == "--dry-run":
            dry_run = True
    
    if not os.path.exists(plan_file):
        print(f"Error: Plan file not found: {plan_file}")
        sys.exit(1)
    
    logger = setup_logger("mvp_decompose", "mvp_decompose")
    logger.info(f"Parsing plan: {plan_file}")
    
    # Parse plan
    try:
        plan = parse_plan_file(plan_file)
        logger.info(f"Found {len(plan['chunks'])} chunks for {plan['project_name']}")
    except Exception as e:
        logger.error(f"Failed to parse plan: {e}")
        sys.exit(1)
    
    # Create issues
    if dry_run:
        print(f"\n🔍 DRY RUN - No issues will be created\n")
    else:
        print(f"\n📝 Creating {len(plan['chunks'])} GitHub issues...\n")
    
    created_issues = []
    for chunk in plan['chunks']:
        logger.info(f"Processing Chunk {chunk['number']}: {chunk['title']}")
        
        issue_url = create_github_issue(chunk, plan['project_name'], milestone, dry_run)
        
        if issue_url:
            created_issues.append(issue_url)
            print(f"  ✅ Created: {issue_url}")
        elif not dry_run:
            print(f"  ❌ Failed to create issue for Chunk {chunk['number']}")
    
    # Summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"Project: {plan['project_name']}")
    print(f"Total Chunks: {len(plan['chunks'])}")
    if not dry_run:
        print(f"Issues Created: {len(created_issues)}")
    print(f"\nNext step:")
    print(f"  Review issues on GitHub and start with Chunk 1")
    print(f"  Or run: gh issue list --label mvp")


if __name__ == "__main__":
    main()