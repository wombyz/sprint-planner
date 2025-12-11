"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FolderKanban, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProjectGrid } from "@/components/features/projects/ProjectGrid";

export default function DashboardPage() {
  const projects = useQuery(api.projects.listWithReviewCount);

  // Loading state
  if (projects === undefined) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <ProjectGrid projects={undefined} />
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start tracking sprint reviews and generating repair manifests."
          action={{
            label: "Create Project",
            onClick: () => {
              // TODO: Open create project modal
              console.log("Create project clicked");
            },
          }}
          className="mt-8"
        />
      </div>
    );
  }

  // Projects list
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          onClick={() => {
            // TODO: Open create project modal
            console.log("Create project clicked");
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      <ProjectGrid projects={projects} />
    </div>
  );
}
