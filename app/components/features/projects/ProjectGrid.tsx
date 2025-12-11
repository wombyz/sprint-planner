"use client";

import { cn } from "@/lib/utils";
import { ProjectCard } from "./ProjectCard";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";
import { Id } from "@/convex/_generated/dataModel";

export interface ProjectWithReviewCount {
  _id: Id<"projects">;
  _creationTime: number;
  name: string;
  description?: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubAccessToken?: string;
  lastSyncedCommit?: string;
  architectureLegend?: string;
  createdAt: number;
  updatedAt: number;
  reviewCount: number;
}

interface ProjectGridProps {
  projects: ProjectWithReviewCount[] | undefined;
  isLoading?: boolean;
  className?: string;
}

export function ProjectGrid({
  projects,
  isLoading,
  className,
}: ProjectGridProps) {
  const showLoading = isLoading || projects === undefined;

  if (showLoading) {
    return (
      <div
        className={cn(
          "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {[1, 2, 3].map((i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {projects.map((project) => (
        <ProjectCard
          key={project._id}
          id={project._id}
          name={project.name}
          githubOwner={project.githubOwner}
          githubRepo={project.githubRepo}
          lastSyncedCommit={project.lastSyncedCommit}
          reviewCount={project.reviewCount}
          updatedAt={project.updatedAt}
        />
      ))}
    </div>
  );
}
