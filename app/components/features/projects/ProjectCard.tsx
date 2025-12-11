"use client";

import { useRouter } from "next/navigation";
import { FolderKanban, GitBranch, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface ProjectCardProps {
  id: Id<"projects">;
  name: string;
  githubOwner: string;
  githubRepo: string;
  lastSyncedCommit?: string | null;
  reviewCount: number;
  updatedAt: number;
  className?: string;
}

/**
 * Format a timestamp as a relative time string (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  } else {
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  }
}

export function ProjectCard({
  id,
  name,
  githubOwner,
  githubRepo,
  lastSyncedCommit,
  reviewCount,
  updatedAt,
  className,
}: ProjectCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/projects/${id}`);
  };

  const truncatedCommit = lastSyncedCommit
    ? lastSyncedCommit.slice(0, 7)
    : null;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "glass-hover rounded-xl p-4 cursor-pointer transition-all",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-600/20">
          <FolderKanban className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark-100 truncate">{name}</h3>
          <p className="text-sm text-dark-400 truncate">
            {githubOwner}/{githubRepo}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-dark-700 flex items-center justify-between text-xs text-dark-400">
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span className="font-mono">
            {truncatedCommit || "Not synced"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>
            {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <div className="flex items-center gap-1 text-xs text-dark-500">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
