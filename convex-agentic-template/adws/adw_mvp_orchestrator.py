#!/usr/bin/env -S uv run
# /// script
# dependencies = ["python-dotenv", "pydantic"]
# ///

"""
ADW MVP Orchestrator - Automatically execute all MVP chunks in order

Usage:
  uv run adws/adw_mvp_orchestrator.py [--start-from <chunk-number>] [--auto-merge]

Examples:
  uv run adws/adw_mvp_orchestrator.py --auto-merge
  uv run adws/adw_mvp_orchestrator.py --start-from 2 --auto-merge
"""

import sys
import os
import subprocess
import time
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adws.adw_modules.utils import setup_logger

# ============================================
# Configuration
# ============================================
CHUNK_TIMEOUT_SECONDS = 10800  # 3 hours per chunk
MERGE_CHECK_RETRIES = 6
MERGE_CHECK_WAIT_SECONDS = 10


def format_duration(seconds: float) -> str:
    """Format seconds into human-readable duration."""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins}m {secs}s"
    else:
        hours = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        return f"{hours}h {mins}m"


def print_header(text: str, char: str = "=", width: int = 80):
    """Print a formatted header."""
    print(f"\n{char * width}")
    print(f"  {text}")
    print(f"{char * width}")


def print_section(emoji: str, text: str):
    """Print a section marker."""
    print(f"\n{emoji}  {text}")
    print("-" * 60)


def print_status(emoji: str, text: str):
    """Print a status line."""
    print(f"   {emoji} {text}")


def print_time_info(start_time: datetime, timeout_seconds: int):
    """Print elapsed time and time remaining."""
    elapsed = (datetime.now() - start_time).total_seconds()
    remaining = timeout_seconds - elapsed

    elapsed_str = format_duration(elapsed)
    remaining_str = format_duration(max(0, remaining))

    # Color warning if less than 30 minutes remaining
    if remaining < 1800:
        print(f"   ⏱️  Elapsed: {elapsed_str} | ⚠️  Remaining: {remaining_str}")
    else:
        print(f"   ⏱️  Elapsed: {elapsed_str} | Remaining: {remaining_str}")


def get_chunk_issues() -> List[Dict]:
    """Get all MVP chunk issues from GitHub."""
    env = os.environ.copy()
    if os.getenv("GITHUB_PAT"):
        env["GH_TOKEN"] = os.getenv("GITHUB_PAT")

    cmd = ["gh", "issue", "list", "--label", "mvp", "--json", "number,title,labels,state"]
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)

    if result.returncode != 0:
        raise Exception(f"Failed to fetch issues: {result.stderr}")

    issues = json.loads(result.stdout)

    # Extract chunk number from labels and sort
    chunk_issues = []
    for issue in issues:
        chunk_num = None
        for label in issue["labels"]:
            if label["name"].startswith("chunk-"):
                try:
                    chunk_num = int(label["name"].split("-")[1])
                    break
                except (IndexError, ValueError):
                    continue

        if chunk_num:
            chunk_issues.append({
                "number": issue["number"],
                "chunk": chunk_num,
                "title": issue["title"],
                "state": issue["state"]
            })

    # Sort by chunk number
    chunk_issues.sort(key=lambda x: x["chunk"])
    return chunk_issues


def get_pr_for_issue(issue_number: int) -> Optional[int]:
    """Get PR number that closes this issue."""
    env = os.environ.copy()
    if os.getenv("GITHUB_PAT"):
        env["GH_TOKEN"] = os.getenv("GITHUB_PAT")

    # Get all open PRs with their linked closing issues
    cmd = ["gh", "pr", "list", "--state", "open", "--json", "number,closingIssuesReferences"]
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)

    if result.returncode == 0 and result.stdout.strip():
        prs = json.loads(result.stdout)
        for pr in prs:
            # Check if this PR closes the specified issue
            for ref in pr.get("closingIssuesReferences", []):
                if ref.get("number") == issue_number:
                    return pr["number"]

    return None


def pull_latest_main(logger) -> bool:
    """Checkout main and pull latest changes."""
    print_status("🔄", "Pulling latest main branch...")

    # Checkout main
    result = subprocess.run(["git", "checkout", "main"], capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"Failed to checkout main: {result.stderr}")
        print_status("❌", f"Failed to checkout main: {result.stderr.strip()}")
        return False

    # Pull latest
    result = subprocess.run(["git", "pull", "origin", "main"], capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"Failed to pull main: {result.stderr}")
        print_status("❌", f"Failed to pull main: {result.stderr.strip()}")
        return False

    print_status("✅", "Updated to latest main")
    logger.info("Updated to latest main")
    return True


def merge_pr(pr_number: int, logger, max_retries: int = MERGE_CHECK_RETRIES) -> bool:
    """Merge a PR if it's ready. Retries waiting for GitHub to calculate mergeability."""
    env = os.environ.copy()
    if os.getenv("GITHUB_PAT"):
        env["GH_TOKEN"] = os.getenv("GITHUB_PAT")

    print_section("🔀", f"Merging PR #{pr_number}")

    # Retry loop - GitHub needs time to calculate mergeability after PR creation
    for attempt in range(max_retries):
        cmd = ["gh", "pr", "view", str(pr_number), "--json", "mergeable,mergeStateStatus"]
        result = subprocess.run(cmd, capture_output=True, text=True, env=env)

        if result.returncode == 0:
            pr_data = json.loads(result.stdout)
            mergeable = pr_data.get("mergeable")
            merge_state = pr_data.get("mergeStateStatus", "UNKNOWN")

            if mergeable == "MERGEABLE":
                print_status("✅", f"PR is mergeable (state: {merge_state})")
                break
            elif mergeable == "CONFLICTING":
                print_status("❌", f"PR has merge conflicts!")
                print_status("💡", "Resolution: Manually resolve conflicts and re-run")
                logger.error(f"PR #{pr_number} has merge conflicts!")
                return False
            else:
                # UNKNOWN or None - GitHub still calculating
                if attempt < max_retries - 1:
                    print_status("⏳", f"Mergeability: {mergeable}, waiting... ({attempt + 1}/{max_retries})")
                    time.sleep(MERGE_CHECK_WAIT_SECONDS)
                else:
                    print_status("❌", f"PR still not mergeable after {max_retries} attempts")
                    print_status("💡", "Resolution: Check PR status on GitHub and retry")
                    logger.warning(f"PR #{pr_number} still not mergeable after {max_retries} attempts")
                    return False
        else:
            print_status("❌", f"Failed to check PR status: {result.stderr.strip()}")
            logger.error(f"Failed to check PR status: {result.stderr}")
            return False

    # Merge the PR immediately (no --auto which waits for checks)
    print_status("🚀", "Executing merge...")
    cmd = ["gh", "pr", "merge", str(pr_number), "--squash"]
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)

    if result.returncode == 0:
        print_status("✅", f"Successfully merged PR #{pr_number}")
        logger.info(f"Merged PR #{pr_number}")
        return True
    else:
        print_status("❌", f"Merge failed: {result.stderr.strip()}")
        print_status("💡", "Resolution: Check PR status on GitHub, resolve any issues, and retry")
        logger.error(f"Failed to merge PR #{pr_number}: {result.stderr}")
        return False


def check_issue_status(issue_number: int, logger) -> str:
    """
    Check issue status.
    Returns: 'closed', 'has_pr', 'pending'
    """
    env = os.environ.copy()
    if os.getenv("GITHUB_PAT"):
        env["GH_TOKEN"] = os.getenv("GITHUB_PAT")

    # Check if issue is closed
    cmd = ["gh", "issue", "view", str(issue_number), "--json", "state"]
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)

    if result.returncode == 0:
        issue_data = json.loads(result.stdout)
        if issue_data["state"] == "CLOSED":
            return "closed"

    # Check for linked PRs
    pr_num = get_pr_for_issue(issue_number)
    if pr_num:
        return "has_pr"

    return "pending"


def run_chunk(issue_number: int, chunk_number: int, logger) -> tuple[bool, float]:
    """
    Execute a single chunk.
    Returns: (success: bool, elapsed_seconds: float)
    """
    print_section("🏗️", f"EXECUTING CHUNK {chunk_number}")
    print_status("📋", f"Issue: #{issue_number}")
    print_status("⏱️", f"Timeout: {format_duration(CHUNK_TIMEOUT_SECONDS)}")
    print()

    start_time = datetime.now()
    script_path = os.path.join(os.path.dirname(__file__), "adw_plan_build_test.py")
    cmd = ["uv", "run", script_path, str(issue_number)]

    print_status("🚀", "Starting ADW pipeline (plan → build → test)...")
    print_status("📁", f"Script: {script_path}")
    print()

    try:
        result = subprocess.run(
            cmd,
            capture_output=False,  # Let output show in real-time
            text=True,
            timeout=CHUNK_TIMEOUT_SECONDS
        )

        elapsed = (datetime.now() - start_time).total_seconds()

        print()
        print("-" * 60)
        if result.returncode == 0:
            print_status("✅", f"Chunk {chunk_number} completed successfully")
            print_status("⏱️", f"Duration: {format_duration(elapsed)}")
            logger.info(f"Chunk {chunk_number} completed in {format_duration(elapsed)}")
            return True, elapsed
        else:
            print_status("❌", f"Chunk {chunk_number} failed with exit code {result.returncode}")
            print_status("⏱️", f"Duration: {format_duration(elapsed)}")
            print()
            print_status("💡", "Resolution options:")
            print("      1. Check the GitHub issue for error details")
            print("      2. Review agent output in agents/<adw_id>/")
            print("      3. Fix the issue and restart with --start-from")
            logger.error(f"Chunk {chunk_number} failed with exit code {result.returncode}")
            return False, elapsed

    except subprocess.TimeoutExpired:
        elapsed = CHUNK_TIMEOUT_SECONDS
        print()
        print("-" * 60)
        print_status("⏰", f"Chunk {chunk_number} TIMED OUT after {format_duration(CHUNK_TIMEOUT_SECONDS)}")
        print()
        print_status("💡", "Possible causes:")
        print("      1. E2E tests taking too long (especially with retries)")
        print("      2. Network issues causing slowdowns")
        print("      3. Complex implementation requiring more time")
        print()
        print_status("💡", "Resolution:")
        print("      1. Check GitHub issue - the ADW may have completed successfully")
        print("      2. If PR exists and tests passed, manually merge")
        print("      3. Otherwise, restart with --start-from")
        logger.error(f"Chunk {chunk_number} timed out after {format_duration(CHUNK_TIMEOUT_SECONDS)}")
        return False, elapsed

    except Exception as e:
        elapsed = (datetime.now() - start_time).total_seconds()
        print()
        print("-" * 60)
        print_status("💥", f"Chunk {chunk_number} failed with exception")
        print_status("❌", f"Error: {str(e)}")
        print_status("⏱️", f"Duration: {format_duration(elapsed)}")
        print()
        print_status("💡", "Resolution:")
        print("      1. Check if this is a temporary issue (network, etc.)")
        print("      2. Review the full error traceback above")
        print("      3. Fix and restart with --start-from")
        logger.error(f"Chunk {chunk_number} failed with exception: {e}")
        return False, elapsed


def main():
    """Main orchestrator loop."""
    load_dotenv()

    # Parse arguments
    start_from = 1
    auto_merge = False

    for i in range(1, len(sys.argv)):
        if sys.argv[i] == "--start-from" and i + 1 < len(sys.argv):
            start_from = int(sys.argv[i + 1])
        elif sys.argv[i] == "--auto-merge":
            auto_merge = True

    logger = setup_logger("mvp_orchestrator", "mvp_orchestrator")

    # Print startup banner
    print_header("🚀 ADW MVP ORCHESTRATOR", "═")
    print(f"   Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Starting from chunk: {start_from}")
    print(f"   Auto-merge: {'✅ Enabled' if auto_merge else '❌ Disabled'}")
    print(f"   Timeout per chunk: {format_duration(CHUNK_TIMEOUT_SECONDS)}")

    logger.info("MVP Orchestrator starting")
    logger.info(f"Starting from chunk {start_from}, auto_merge={auto_merge}")

    # Get all chunk issues
    print_section("📋", "Fetching MVP chunk issues from GitHub")
    try:
        issues = get_chunk_issues()
        print_status("✅", f"Found {len(issues)} total chunks")
    except Exception as e:
        print_status("❌", f"Failed to fetch issues: {e}")
        logger.error(f"Failed to fetch issues: {e}")
        sys.exit(1)

    # Filter to start from specified chunk
    issues = [iss for iss in issues if iss["chunk"] >= start_from]
    print_status("📊", f"Processing {len(issues)} chunks (starting from chunk {start_from})")

    # Show chunk overview
    print()
    print("   Chunks to process:")
    for iss in issues:
        print(f"      • Chunk {iss['chunk']}: #{iss['number']} - {iss['title'][:50]}...")

    orchestrator_start = datetime.now()
    completed = []
    failed = []
    skipped = []
    chunk_times = {}

    for idx, issue in enumerate(issues):
        chunk_num = issue["chunk"]
        issue_num = issue["number"]

        print_header(f"📦 CHUNK {chunk_num}/{issues[-1]['chunk']}: {issue['title'][:60]}", "═")
        print(f"   Issue: #{issue_num}")
        print(f"   Progress: {idx + 1}/{len(issues)} chunks")

        # Show overall elapsed time
        overall_elapsed = (datetime.now() - orchestrator_start).total_seconds()
        print(f"   Overall elapsed: {format_duration(overall_elapsed)}")

        # Check current status
        print_section("🔍", "Checking issue status")
        status = check_issue_status(issue_num, logger)

        if status == "closed":
            print_status("✅", "Issue already closed - skipping")
            skipped.append(chunk_num)
            continue

        if status == "has_pr":
            pr_num = get_pr_for_issue(issue_num)
            print_status("📝", f"PR #{pr_num} already exists for this issue")

            if auto_merge:
                print_status("🔀", f"Attempting to merge existing PR #{pr_num}...")
                if merge_pr(pr_num, logger):
                    completed.append(chunk_num)
                    time.sleep(10)  # Wait for GitHub to process merge
                    # Pull latest main after merge
                    if not pull_latest_main(logger):
                        print_status("❌", "Failed to pull latest main after merge")
                        failed.append(chunk_num)
                        break
                    continue
                else:
                    print_status("⚠️", f"Could not merge PR #{pr_num} - skipping chunk")
                    skipped.append(chunk_num)
                    continue
            else:
                print_status("⚠️", "Auto-merge disabled - skipping")
                print_status("💡", "Use --auto-merge flag to enable automatic merging")
                skipped.append(chunk_num)
                continue

        # IMPORTANT: Pull latest main before starting each chunk
        print_section("🔄", "Syncing with main branch")
        if not pull_latest_main(logger):
            print_status("❌", "Failed to pull latest main before chunk")
            failed.append(chunk_num)
            break

        # Run the chunk
        chunk_start = datetime.now()
        success, elapsed = run_chunk(issue_num, chunk_num, logger)
        chunk_times[chunk_num] = elapsed

        if success:
            # Check if a PR was created
            print_section("🔍", "Checking for created PR")
            time.sleep(5)  # Wait for PR to be created
            pr_num = get_pr_for_issue(issue_num)

            if pr_num:
                print_status("✅", f"PR #{pr_num} was created")

                if auto_merge:
                    print_status("⏳", "Waiting for GitHub to calculate mergeability...")
                    time.sleep(15)

                    if merge_pr(pr_num, logger):
                        # Pull latest main after merge for next chunk
                        time.sleep(5)
                        if not pull_latest_main(logger):
                            print_status("❌", "Failed to pull latest main after merge")
                            failed.append(chunk_num)
                            break
                    else:
                        # CRITICAL: Stop if merge fails - don't continue without this chunk's code!
                        print()
                        print_status("🛑", "STOPPING: Merge failed - cannot continue without this code")
                        print_status("💡", f"Fix the issue and restart with: --start-from {chunk_num}")
                        failed.append(chunk_num)
                        break
            else:
                print_status("⚠️", "No PR found - chunk may have had issues")

            completed.append(chunk_num)
            print_section("✅", f"CHUNK {chunk_num} COMPLETE")
            print_status("⏱️", f"Chunk duration: {format_duration(elapsed)}")

            # Small delay between chunks
            time.sleep(5)
        else:
            failed.append(chunk_num)
            print_section("❌", f"CHUNK {chunk_num} FAILED")
            print()
            print("   Stopping orchestrator due to failure.")
            print(f"   To resume: uv run adws/adw_mvp_orchestrator.py --start-from {chunk_num}")
            break

    # Summary
    total_elapsed = (datetime.now() - orchestrator_start).total_seconds()

    print_header("📊 ORCHESTRATOR SUMMARY", "═")
    print(f"   Total time: {format_duration(total_elapsed)}")
    print()

    if completed:
        print(f"   ✅ Completed: {len(completed)} chunks")
        for c in completed:
            duration = chunk_times.get(c, 0)
            print(f"      • Chunk {c} ({format_duration(duration)})")

    if skipped:
        print(f"   ⏭️  Skipped: {len(skipped)} chunks")
        for s in skipped:
            print(f"      • Chunk {s}")

    if failed:
        print(f"   ❌ Failed: {len(failed)} chunks")
        for f in failed:
            duration = chunk_times.get(f, 0)
            print(f"      • Chunk {f} ({format_duration(duration)})")

    print()

    if failed:
        print_header(f"⚠️  STOPPED AT CHUNK {failed[0]}", "─")
        print(f"   To resume: uv run adws/adw_mvp_orchestrator.py --start-from {failed[0]} --auto-merge")
        print()
        sys.exit(1)
    elif completed or skipped:
        print_header("✅ ALL CHUNKS PROCESSED!", "─")
        print()
    else:
        print_header("ℹ️  NO CHUNKS TO PROCESS", "─")
        print()


if __name__ == "__main__":
    main()
