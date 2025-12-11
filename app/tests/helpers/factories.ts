/**
 * Test Data Factories
 *
 * Use these functions to create test data with sensible defaults.
 * All factories accept optional overrides for customization.
 */

import { convexTest } from "convex-test";
import type { Id } from "../../convex/_generated/dataModel";

type ConvexTestInstance = ReturnType<typeof convexTest>;

/**
 * Create a test user
 */
export async function createTestUser(
  t: ConvexTestInstance,
  overrides: {
    email?: string;
    name?: string;
    role?: "admin" | "member" | "viewer";
  } = {}
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: overrides.email ?? `test-${Date.now()}@example.com`,
      name: overrides.name ?? "Test User",
      role: overrides.role ?? "member",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

/**
 * Create a test project
 * Note: Projects don't have userId - they are shared/global
 */
export async function createTestProject(
  t: ConvexTestInstance,
  overrides: {
    name?: string;
    description?: string;
    githubOwner?: string;
    githubRepo?: string;
    githubBranch?: string;
    githubAccessToken?: string;
    lastSyncedCommit?: string;
    architectureLegend?: string;
  } = {}
): Promise<Id<"projects">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("projects", {
      name: overrides.name ?? "Test Project",
      description: overrides.description,
      githubOwner: overrides.githubOwner ?? "test-owner",
      githubRepo: overrides.githubRepo ?? "test-repo",
      githubBranch: overrides.githubBranch ?? "main",
      githubAccessToken: overrides.githubAccessToken,
      lastSyncedCommit: overrides.lastSyncedCommit,
      architectureLegend: overrides.architectureLegend,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

/**
 * Create multiple test projects
 */
export async function createTestProjects(
  t: ConvexTestInstance,
  count: number,
  overrides: {
    namePrefix?: string;
    githubOwner?: string;
    githubRepo?: string;
  } = {}
): Promise<Id<"projects">[]> {
  const ids: Id<"projects">[] = [];
  for (let i = 0; i < count; i++) {
    const id = await createTestProject(t, {
      name: `${overrides.namePrefix ?? "Project"} ${i + 1}`,
      githubOwner: overrides.githubOwner,
      githubRepo: overrides.githubRepo ?? `test-repo-${i + 1}`,
    });
    ids.push(id);
  }
  return ids;
}

/**
 * Clean up all test data
 * Use in afterEach if needed
 */
export async function cleanupTestData(t: ConvexTestInstance): Promise<void> {
  await t.run(async (ctx) => {
    // Delete in reverse dependency order
    const projects = await ctx.db.query("projects").collect();
    for (const project of projects) {
      await ctx.db.delete(project._id);
    }

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
  });
}
