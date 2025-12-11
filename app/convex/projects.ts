/**
 * Projects CRUD Operations
 *
 * Queries and mutations for managing projects linked to GitHub repositories.
 * Projects are the primary entity for organizing video critique sessions.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * List all projects, sorted by updatedAt descending
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const projects = await ctx.db.query("projects").collect();

    // Sort by updatedAt descending
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get a single project by ID
 */
export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const project = await ctx.db.get(args.id);
    return project;
  },
});

/**
 * Create a new project linked to a GitHub repository
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    githubOwner: v.string(),
    githubRepo: v.string(),
    githubBranch: v.optional(v.string()),
    githubAccessToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      githubOwner: args.githubOwner,
      githubRepo: args.githubRepo,
      githubBranch: args.githubBranch ?? "main",
      githubAccessToken: args.githubAccessToken,
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

/**
 * Update an existing project
 */
export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    githubBranch: v.optional(v.string()),
    githubAccessToken: v.optional(v.string()),
    lastSyncedCommit: v.optional(v.string()),
    architectureLegend: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found");

    const { id, ...updates } = args;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.githubBranch !== undefined)
      updateData.githubBranch = updates.githubBranch;
    if (updates.githubAccessToken !== undefined)
      updateData.githubAccessToken = updates.githubAccessToken;
    if (updates.lastSyncedCommit !== undefined)
      updateData.lastSyncedCommit = updates.lastSyncedCommit;
    if (updates.architectureLegend !== undefined)
      updateData.architectureLegend = updates.architectureLegend;

    await ctx.db.patch(id, updateData);
  },
});

/**
 * Delete a project
 */
export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found");

    await ctx.db.delete(args.id);
  },
});
