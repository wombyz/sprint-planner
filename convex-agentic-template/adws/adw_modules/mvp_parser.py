"""
MVP Spec Parser - Extract implementation chunks from markdown specifications

This module parses MVP specification documents and extracts:
- Implementation chunks with descriptions
- Dependencies between chunks
- Acceptance criteria
- Estimated effort
"""

from typing import List, Dict, Optional
from pydantic import BaseModel
import re


class ChunkTask(BaseModel):
    """A single task within an implementation chunk."""
    description: str
    order: int


class ChunkDeliverable(BaseModel):
    """A deliverable for an implementation chunk."""
    description: str


class ChunkAcceptanceCriteria(BaseModel):
    """Acceptance criteria for a chunk."""
    description: str


class ImplementationChunk(BaseModel):
    """Represents a single implementation chunk from the spec."""
    chunk_number: int
    title: str
    description: Optional[str] = None
    day_estimate: Optional[str] = None
    tasks: List[ChunkTask] = []
    deliverables: List[ChunkDeliverable] = []
    acceptance_criteria: List[ChunkAcceptanceCriteria] = []
    depends_on: List[int] = []  # Chunk numbers this depends on
    raw_content: str = ""


class MVPSpec(BaseModel):
    """Parsed MVP specification."""
    project_name: str
    total_chunks: int
    chunks: List[ImplementationChunk]


def parse_mvp_spec(spec_content: str) -> MVPSpec:
    """
    Parse a markdown MVP specification document.
    
    Args:
        spec_content: Full markdown content of the spec
        
    Returns:
        Parsed MVPSpec object
    """
    # Extract project name from title
    project_name = "Unknown Project"
    title_match = re.search(r'^#\s+(.+?):', spec_content, re.MULTILINE)
    if title_match:
        project_name = title_match.group(1).strip()
    
    # Find the Implementation Chunks section
    chunks_section = extract_section(spec_content, "Implementation Chunks")
    if not chunks_section:
        raise ValueError("Could not find 'Implementation Chunks' section in spec")
    
    # Parse individual chunks
    chunks = parse_chunks(chunks_section)
    
    # Analyze dependencies
    chunks = analyze_dependencies(chunks)
    
    return MVPSpec(
        project_name=project_name,
        total_chunks=len(chunks),
        chunks=chunks
    )


def extract_section(content: str, section_title: str) -> Optional[str]:
    """Extract a major section from the markdown document."""
    # Look for the section header (## 10. Implementation Chunks)
    pattern = rf'^##\s+\d+\.\s+{re.escape(section_title)}.*?$'
    match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
    
    if not match:
        return None
    
    start_pos = match.end()
    
    # Find the next ## header to know where this section ends
    next_section = re.search(r'^##\s+\d+\.', content[start_pos:], re.MULTILINE)
    
    if next_section:
        end_pos = start_pos + next_section.start()
        return content[start_pos:end_pos]
    else:
        # This is the last section
        return content[start_pos:]


def parse_chunks(chunks_section: str) -> List[ImplementationChunk]:
    """Parse individual chunks from the Implementation Chunks section."""
    chunks = []
    
    # Split by chunk headers (## Chunk 1: Title (Day X))
    chunk_pattern = r'^##\s+Chunk\s+(\d+):\s+(.+?)(?:\s+\(Day\s+(.+?)\))?$'
    
    # Find all chunk headers
    chunk_matches = list(re.finditer(chunk_pattern, chunks_section, re.MULTILINE))
    
    for i, match in enumerate(chunk_matches):
        chunk_number = int(match.group(1))
        title = match.group(2).strip()
        day_estimate = match.group(3) if match.group(3) else None
        
        # Extract content between this chunk and the next
        start_pos = match.end()
        if i + 1 < len(chunk_matches):
            end_pos = chunk_matches[i + 1].start()
        else:
            end_pos = len(chunks_section)
        
        chunk_content = chunks_section[start_pos:end_pos]
        
        # Parse chunk details
        chunk = ImplementationChunk(
            chunk_number=chunk_number,
            title=title,
            day_estimate=day_estimate,
            raw_content=chunk_content.strip()
        )
        
        # Parse tasks section
        tasks_section = extract_subsection(chunk_content, "Tasks")
        if tasks_section:
            chunk.tasks = parse_tasks(tasks_section)
        
        # Parse deliverables section
        deliverables_section = extract_subsection(chunk_content, "Deliverables")
        if deliverables_section:
            chunk.deliverables = parse_deliverables(deliverables_section)
        
        # Parse acceptance criteria section
        criteria_section = extract_subsection(chunk_content, "Acceptance Criteria")
        if criteria_section:
            chunk.acceptance_criteria = parse_acceptance_criteria(criteria_section)
        
        chunks.append(chunk)
    
    return chunks


def extract_subsection(content: str, subsection_title: str) -> Optional[str]:
    """Extract a subsection (###) from chunk content."""
    pattern = rf'^###\s+{re.escape(subsection_title)}.*?$'
    match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
    
    if not match:
        return None
    
    start_pos = match.end()
    
    # Find the next ### or ## header
    next_subsection = re.search(r'^###\s+', content[start_pos:], re.MULTILINE)
    
    if next_subsection:
        end_pos = start_pos + next_subsection.start()
        return content[start_pos:end_pos]
    else:
        return content[start_pos:]


def parse_tasks(tasks_section: str) -> List[ChunkTask]:
    """Parse numbered task items."""
    tasks = []
    # Match numbered list items (1. Task description)
    task_pattern = r'^\d+\.\s+(.+?)$'
    
    for i, match in enumerate(re.finditer(task_pattern, tasks_section, re.MULTILINE), 1):
        task_desc = match.group(1).strip()
        tasks.append(ChunkTask(description=task_desc, order=i))
    
    return tasks


def parse_deliverables(deliverables_section: str) -> List[ChunkDeliverable]:
    """Parse deliverable bullet points."""
    deliverables = []
    # Match bullet points (- Deliverable or * Deliverable)
    deliv_pattern = r'^[-*]\s+(.+?)$'
    
    for match in re.finditer(deliv_pattern, deliverables_section, re.MULTILINE):
        deliv_desc = match.group(1).strip()
        deliverables.append(ChunkDeliverable(description=deliv_desc))
    
    return deliverables


def parse_acceptance_criteria(criteria_section: str) -> List[ChunkAcceptanceCriteria]:
    """Parse acceptance criteria bullet points."""
    criteria = []
    # Match bullet points (- Criteria or * Criteria)
    criteria_pattern = r'^[-*]\s+(.+?)$'
    
    for match in re.finditer(criteria_pattern, criteria_section, re.MULTILINE):
        criteria_desc = match.group(1).strip()
        criteria.append(ChunkAcceptanceCriteria(description=criteria_desc))
    
    return criteria


def analyze_dependencies(chunks: List[ImplementationChunk]) -> List[ImplementationChunk]:
    """
    Analyze chunk content to determine dependencies.
    
    Rules:
    - Each chunk depends on all previous chunks by default
    - Exception: Chunks marked as "parallel" in their description can run simultaneously
    - Explicit dependencies can be extracted from text like "depends on Chunk X"
    """
    for i, chunk in enumerate(chunks):
        # Check for explicit dependency mentions
        explicit_deps = extract_explicit_dependencies(chunk.raw_content)
        
        if explicit_deps:
            chunk.depends_on = explicit_deps
        else:
            # Default: depend on immediately previous chunk
            if i > 0:
                chunk.depends_on = [chunks[i - 1].chunk_number]
    
    return chunks


def extract_explicit_dependencies(content: str) -> List[int]:
    """Extract explicit dependency mentions like 'depends on Chunk 3' or 'requires Chunk 1'."""
    deps = []
    
    # Look for patterns like "depends on Chunk X" or "requires Chunk X"
    dep_patterns = [
        r'depends?\s+on\s+[Cc]hunk\s+(\d+)',
        r'requires?\s+[Cc]hunk\s+(\d+)',
        r'after\s+[Cc]hunk\s+(\d+)',
        r'builds?\s+on\s+[Cc]hunk\s+(\d+)',
    ]
    
    for pattern in dep_patterns:
        matches = re.finditer(pattern, content, re.IGNORECASE)
        for match in matches:
            chunk_num = int(match.group(1))
            if chunk_num not in deps:
                deps.append(chunk_num)
    
    return sorted(deps)


def get_parallel_chunks(chunks: List[ImplementationChunk]) -> List[List[int]]:
    """
    Group chunks that can be executed in parallel.
    
    Returns a list of execution groups, where each group is a list of chunk numbers
    that can run simultaneously.
    """
    execution_groups: List[List[int]] = []
    executed: set[int] = set()
    
    while len(executed) < len(chunks):
        # Find chunks whose dependencies are all satisfied
        ready_chunks = []
        
        for chunk in chunks:
            if chunk.chunk_number in executed:
                continue
            
            # Check if all dependencies are satisfied
            if all(dep in executed for dep in chunk.depends_on):
                ready_chunks.append(chunk.chunk_number)
        
        if not ready_chunks:
            # No chunks ready - this indicates a circular dependency
            remaining = [c.chunk_number for c in chunks if c.chunk_number not in executed]
            raise ValueError(f"Circular dependency detected. Remaining chunks: {remaining}")
        
        execution_groups.append(ready_chunks)
        executed.update(ready_chunks)
    
    return execution_groups