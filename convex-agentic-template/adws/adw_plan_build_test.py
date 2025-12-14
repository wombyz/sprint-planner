#!/usr/bin/env -S uv run
# /// script
# dependencies = ["python-dotenv", "pydantic"]
# ///

"""
ADW Plan, Build & Test - AI Developer Workflow for agentic planning, building and testing

Usage: uv run adw_plan_build_test.py <issue-number> [adw-id]

This script runs the complete ADW pipeline:
1. adw_plan.py - Planning phase
2. adw_build.py - Implementation phase
3. adw_test.py - Testing phase

The scripts are chained together via persistent state (adw_state.json).
"""

import subprocess
import sys
import os
from datetime import datetime

# Add the parent directory to Python path to import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from adw_modules.workflow_ops import ensure_adw_id


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


def print_header(text: str, char: str = "=", width: int = 70):
    """Print a formatted header."""
    print(f"\n{char * width}")
    print(f"  {text}")
    print(f"{char * width}")


def print_phase_start(phase: str, emoji: str, description: str):
    """Print phase start marker."""
    print(f"\n{'─' * 70}")
    print(f"  {emoji}  PHASE: {phase}")
    print(f"      {description}")
    print(f"{'─' * 70}")


def print_phase_result(phase: str, success: bool, duration: float):
    """Print phase result."""
    if success:
        print(f"\n   ✅ {phase} completed in {format_duration(duration)}")
    else:
        print(f"\n   ❌ {phase} FAILED after {format_duration(duration)}")


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: uv run adw_plan_build_test.py <issue-number> [adw-id]")
        sys.exit(1)

    issue_number = sys.argv[1]
    adw_id = sys.argv[2] if len(sys.argv) > 2 else None

    # Ensure ADW ID exists with initialized state
    adw_id = ensure_adw_id(issue_number, adw_id)

    # Print startup banner
    pipeline_start = datetime.now()
    print_header(f"🚀 ADW PIPELINE - Issue #{issue_number}", "═")
    print(f"   Started: {pipeline_start.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   ADW ID: {adw_id}")
    print(f"   Phases: Plan → Build → Test")

    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))

    phase_times = {}

    # ============================================
    # PHASE 1: Planning
    # ============================================
    print_phase_start("PLAN", "📋", "Analyzing issue and creating implementation plan")

    plan_start = datetime.now()
    plan_cmd = [
        "uv",
        "run",
        os.path.join(script_dir, "adw_plan.py"),
        issue_number,
        adw_id,
    ]
    plan = subprocess.run(plan_cmd)
    plan_duration = (datetime.now() - plan_start).total_seconds()
    phase_times["Plan"] = plan_duration

    if plan.returncode != 0:
        print_phase_result("PLAN", False, plan_duration)
        print_header("❌ PIPELINE FAILED AT PLANNING PHASE", "─")
        print(f"   Total time: {format_duration(plan_duration)}")
        print(f"   💡 Check the GitHub issue for details")
        sys.exit(1)

    print_phase_result("PLAN", True, plan_duration)

    # ============================================
    # PHASE 2: Building
    # ============================================
    print_phase_start("BUILD", "🏗️", "Implementing the solution based on plan")

    build_start = datetime.now()
    build_cmd = [
        "uv",
        "run",
        os.path.join(script_dir, "adw_build.py"),
        issue_number,
        adw_id,
    ]
    build = subprocess.run(build_cmd)
    build_duration = (datetime.now() - build_start).total_seconds()
    phase_times["Build"] = build_duration

    if build.returncode != 0:
        print_phase_result("BUILD", False, build_duration)
        print_header("❌ PIPELINE FAILED AT BUILD PHASE", "─")
        total_time = (datetime.now() - pipeline_start).total_seconds()
        print(f"   Total time: {format_duration(total_time)}")
        print(f"   Plan: {format_duration(phase_times['Plan'])}")
        print(f"   Build: {format_duration(build_duration)}")
        print(f"   💡 Check the GitHub issue for details")
        sys.exit(1)

    print_phase_result("BUILD", True, build_duration)

    # ============================================
    # PHASE 3: Testing
    # ============================================
    print_phase_start("TEST", "🧪", "Running unit tests and E2E tests")

    test_start = datetime.now()
    test_cmd = [
        "uv",
        "run",
        os.path.join(script_dir, "adw_test.py"),
        issue_number,
        adw_id,
    ]
    test = subprocess.run(test_cmd)
    test_duration = (datetime.now() - test_start).total_seconds()
    phase_times["Test"] = test_duration

    total_duration = (datetime.now() - pipeline_start).total_seconds()

    if test.returncode != 0:
        print_phase_result("TEST", False, test_duration)
        print_header("❌ PIPELINE FAILED AT TEST PHASE", "─")
        print(f"   Total time: {format_duration(total_duration)}")
        print()
        print("   Phase breakdown:")
        print(f"      📋 Plan:  {format_duration(phase_times['Plan'])}")
        print(f"      🏗️  Build: {format_duration(phase_times['Build'])}")
        print(f"      🧪 Test:  {format_duration(test_duration)}")
        print()
        print(f"   💡 Check the GitHub issue for test failure details")
        print(f"   💡 Tests may include retry attempts for resolution")
        sys.exit(1)

    print_phase_result("TEST", True, test_duration)

    # ============================================
    # SUCCESS
    # ============================================
    print_header("✅ PIPELINE COMPLETED SUCCESSFULLY", "═")
    print(f"   Total time: {format_duration(total_duration)}")
    print()
    print("   Phase breakdown:")
    print(f"      📋 Plan:  {format_duration(phase_times['Plan'])}")
    print(f"      🏗️  Build: {format_duration(phase_times['Build'])}")
    print(f"      🧪 Test:  {format_duration(phase_times['Test'])}")
    print()
    print(f"   Issue: #{issue_number}")
    print(f"   ADW ID: {adw_id}")
    print()


if __name__ == "__main__":
    main()
