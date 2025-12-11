/**
 * Reviews CRUD Operations
 *
 * Queries and mutations for managing video critique review sessions.
 * Reviews track the workflow from draft through video processing to manifest generation.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Valid status transitions for the review workflow state machine.
 * Reviews progress linearly and cannot skip states or go backward.
 */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["syncing_code"],
  syncing_code: ["code_analyzed"],
  code_analyzed: ["uploading_video"],
  uploading_video: ["analyzing_video"],
  analyzing_video: ["manifest_generated"],
  manifest_generated: ["completed"],
  completed: [], // Terminal state
};

/**
 * List reviews for a specific project, sorted by updatedAt descending
 */
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_project_updated", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Sort by updatedAt descending
    return reviews.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get a single review by ID
 */
export const get = query({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const review = await ctx.db.get(args.id);
    return review;
  },
});

/**
 * Create a new review in draft status
 */
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    customInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const now = Date.now();
    const reviewId = await ctx.db.insert("reviews", {
      projectId: args.projectId,
      title: args.title,
      customInstructions: args.customInstructions,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    return reviewId;
  },
});

/**
 * Update review fields (title, customInstructions)
 */
export const update = mutation({
  args: {
    id: v.id("reviews"),
    title: v.optional(v.string()),
    customInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Review not found");

    const project = await ctx.db.get(review.projectId);
    if (!project) throw new Error("Project not found");

    const { id, ...updates } = args;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.customInstructions !== undefined)
      updateData.customInstructions = updates.customInstructions;

    await ctx.db.patch(id, updateData);
  },
});

/**
 * Transition review status with validation
 * Status must follow the valid transitions defined in VALID_STATUS_TRANSITIONS
 */
export const updateStatus = mutation({
  args: {
    id: v.id("reviews"),
    status: v.union(
      v.literal("draft"),
      v.literal("syncing_code"),
      v.literal("code_analyzed"),
      v.literal("uploading_video"),
      v.literal("analyzing_video"),
      v.literal("manifest_generated"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Review not found");

    const currentStatus = review.status;
    const newStatus = args.status;

    // Validate status transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }

    await ctx.db.patch(args.id, {
      status: newStatus,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a review
 */
export const remove = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Review not found");

    const project = await ctx.db.get(review.projectId);
    if (!project) throw new Error("Project not found");

    await ctx.db.delete(args.id);
  },
});
