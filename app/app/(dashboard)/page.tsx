"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FolderKanban, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function DashboardPage() {
  const projects = useQuery(api.projects.list);

  // Loading state
  if (projects === undefined) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 glass rounded-xl animate-pulse" />
          ))}
        </div>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project._id}
            className="glass-hover rounded-xl p-4 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <FolderKanban className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-dark-100 truncate">
                  {project.name}
                </h3>
                <p className="text-sm text-dark-400 truncate">
                  {project.githubOwner}/{project.githubRepo}
                </p>
                {project.description && (
                  <p className="text-sm text-dark-500 mt-2 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
