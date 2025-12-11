"use client";

import { cn } from "@/lib/utils";

interface ProjectCardSkeletonProps {
  className?: string;
}

export function ProjectCardSkeleton({ className }: ProjectCardSkeletonProps) {
  return (
    <div className={cn("glass rounded-xl p-4 animate-pulse", className)}>
      <div className="flex items-start gap-3">
        {/* Icon placeholder */}
        <div className="p-2 rounded-lg bg-dark-700/50">
          <div className="h-5 w-5 bg-dark-600 rounded" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {/* Name placeholder */}
          <div className="h-5 bg-dark-600 rounded w-3/4" />
          {/* Repo placeholder */}
          <div className="h-4 bg-dark-700 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-dark-700 flex items-center justify-between">
        {/* Commit placeholder */}
        <div className="h-3 bg-dark-700 rounded w-20" />
        {/* Reviews placeholder */}
        <div className="h-3 bg-dark-700 rounded w-16" />
      </div>
      <div className="mt-2 flex justify-end">
        {/* Updated time placeholder */}
        <div className="h-3 bg-dark-700 rounded w-24" />
      </div>
    </div>
  );
}
