"""
MVP GitHub Integration - Create and manage issues for MVP chunks

This module handles creating GitHub issues for implementation chunks
with proper metadata, labels, and formatting.
"""

from typing import List, Optional
import subprocess
from .mvp_parser import ImplementationChunk, MVPSpec
from .github import get_repo_url, extract_repo_path


def create_chunk_issue(
    chunk: ImplementationChunk,
    spec: MVPSpec,
    milestone: Optional[str] = None,
    dry_run: bool = False
) -> dict:
    """
    Create a GitHub issue for an implementation chunk.
    
    Args:
        chunk: The implementation chunk to create an issue for
        spec: The full MVP spec for context
        milestone: Optional milestone name to assign
        dry_run: If True, print issue content but don't create
        
    Returns:
        Issue data including number and URL
    """
    # Build issue title
    title = f"[MVP] Chunk {chunk.chunk_number}: {chunk.title}"
    
    # Build issue body
    body = build_chunk_issue_body(chunk, spec)
    
    # Build labels
    labels = build_chunk_labels(chunk, spec)
    
    if dry_run:
        print(f"\n{'='*80}")
        print(f"ISSUE: {title}")
        print(f"{'='*80}")
        print(f"Labels: {', '.join(labels)}")
        if milestone:
            print(f"Milestone: {milestone}")
        print(f"\n{body}")
        print(f"{'='*80}\n")
        
        return {
            "number": 0,
            "title": title,
            "html_url": "dry-run",
            "labels": labels
        }
    
    # Get repo info
    repo_url = get_repo_url()
    repo_path = extract_repo_path(repo_url)
    
    # Use gh CLI to create issue
    issue_data = create_issue_with_gh(
        title=title,
        body=body,
        labels=labels,
        milestone=milestone
    )
    
    return issue_data


def create_issue_with_gh(
    title: str,
    body: str,
    labels: List[str],
    milestone: Optional[str] = None
) -> dict:
    """Create a GitHub issue using gh CLI."""
    import os
    import json
    
    # Build gh command
    cmd = ["gh", "issue", "create", "--title", title, "--body", body]
    
    # Add labels
    for label in labels:
        cmd.extend(["--label", label])
    
    # Add milestone if provided
    if milestone:
        cmd.extend(["--milestone", milestone])
    
    # Set up environment
    env = os.environ.copy()
    if os.getenv("GITHUB_PAT"):
        env["GH_TOKEN"] = os.getenv("GITHUB_PAT")
    
    # Execute command
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        env=env
    )
    
    if result.returncode != 0:
        raise Exception(f"Failed to create issue: {result.stderr}")
    
    # Parse output to get issue URL
    # gh returns the URL on success
    issue_url = result.stdout.strip()
    
    # Extract issue number from URL
    # Format: https://github.com/owner/repo/issues/123
    issue_number = int(issue_url.split("/")[-1])
    
    return {
        "number": issue_number,
        "title": title,
        "html_url": issue_url,
        "labels": labels
    }


def build_chunk_issue_body(chunk: ImplementationChunk, spec: MVPSpec) -> str:
    """Build the markdown body for a chunk issue."""
    lines = []
    
    # Metadata section
    lines.append("## 📋 Chunk Metadata")
    lines.append("")
    lines.append(f"- **Chunk Index**: {chunk.chunk_number}/{spec.total_chunks}")
    lines.append(f"- **Project**: {spec.project_name}")
    
    if chunk.day_estimate:
        lines.append(f"- **Estimated Time**: {chunk.day_estimate}")
    
    if chunk.depends_on:
        dep_str = ", ".join([f"Chunk {n}" for n in chunk.depends_on])
        lines.append(f"- **Dependencies**: {dep_str}")
    else:
        lines.append(f"- **Dependencies**: None (foundation chunk)")
    
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # Objective - extract first paragraph from raw content if no explicit description
    lines.append("## 🎯 Chunk Objective")
    lines.append("")
    if chunk.description:
        lines.append(chunk.description)
    else:
        # Try to extract first meaningful paragraph
        content_lines = chunk.raw_content.split('\n')
        for line in content_lines:
            line = line.strip()
            if line and not line.startswith('#'):
                lines.append(line)
                break
    lines.append("")
    
    # Tasks
    if chunk.tasks:
        lines.append("## ✅ Tasks")
        lines.append("")
        for task in chunk.tasks:
            lines.append(f"{task.order}. {task.description}")
        lines.append("")
    
    # Deliverables
    if chunk.deliverables:
        lines.append("## 📦 Deliverables")
        lines.append("")
        for deliv in chunk.deliverables:
            lines.append(f"- {deliv.description}")
        lines.append("")
    
    # Acceptance Criteria
    if chunk.acceptance_criteria:
        lines.append("## ✓ Acceptance Criteria")
        lines.append("")
        for criteria in chunk.acceptance_criteria:
            lines.append(f"- [ ] {criteria.description}")
        lines.append("")
    
    # Integration Requirements
    lines.append("## 🔗 Integration Requirements")
    lines.append("")
    if chunk.depends_on:
        lines.append("This chunk must integrate correctly with:")
        for dep_num in chunk.depends_on:
            lines.append(f"- Chunk {dep_num}")
    else:
        lines.append("None (foundation chunk)")
    lines.append("")
    
    # Testing Requirements
    lines.append("## 🧪 Testing Requirements")
    lines.append("")
    lines.append("- [ ] Unit tests for new functionality")
    lines.append("- [ ] Integration tests with dependent chunks")
    lines.append("- [ ] E2E tests for user-facing features")
    lines.append("- [ ] All acceptance criteria validated")
    lines.append("")
    
    # ADW Trigger
    lines.append("---")
    lines.append("")
    lines.append("## 🤖 ADW Execution")
    lines.append("")
    lines.append("To execute this chunk with the AI Developer Workflow:")
    lines.append("")
    lines.append("```")
    lines.append("/adw_plan_build_test")
    lines.append("```")
    lines.append("")
    lines.append("Or manually trigger:")
    lines.append("```bash")
    lines.append(f"uv run adws/adw_plan_build_test.py {'{issue_number}'} {'{adw_id}'}")
    lines.append("```")
    
    return '\n'.join(lines)


def build_chunk_labels(chunk: ImplementationChunk, spec: MVPSpec) -> List[str]:
    """Build label list for a chunk issue."""
    labels = ["mvp", f"chunk-{chunk.chunk_number}"]
    
    # Add dependency level label
    if not chunk.depends_on:
        labels.append("foundation")
    elif chunk.chunk_number <= 3:
        labels.append("core")
    elif chunk.chunk_number <= 7:
        labels.append("features")
    else:
        labels.append("polish")
    
    # Add day estimate label if available
    if chunk.day_estimate:
        # Convert "Day 1" or "1" to just the number
        day_num = chunk.day_estimate.replace("Day", "").strip()
        labels.append(f"day-{day_num}")
    
    return labels


def get_chunk_issues(milestone: Optional[str] = None) -> List[dict]:
    """
    Fetch all chunk issues from GitHub.
    
    Args:
        milestone: Optional milestone to filter by
        
    Returns:
        List of issue data dictionaries
    """
    import os
    import json
    
    cmd = ["gh", "issue", "list", "--label", "mvp", "--json", "number,title,labels,state,url"]
    
    if milestone:
        cmd.extend(["--milestone", milestone])
    
    # Set up environment
    env = os.environ.copy()
    if os.getenv("GITHUB_PAT"):
        env["GH_TOKEN"] = os.getenv("GITHUB_PAT")
    
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        env=env
    )
    
    if result.returncode != 0:
        raise Exception(f"Failed to fetch issues: {result.stderr}")
    
    issues = json.loads(result.stdout)
    return issues


def extract_chunk_number_from_labels(labels: List[dict]) -> Optional[int]:
    """Extract chunk number from label list."""
    for label in labels:
        label_name = label.get("name", "")
        if label_name.startswith("chunk-"):
            try:
                return int(label_name.split("-")[1])
            except (IndexError, ValueError):
                continue
    return None