/**
 * Projects Convex Function Tests
 *
 * Tests for convex/projects.ts
 * Note: Projects don't have userId - they are shared/global
 */

import { convexTest } from "convex-test";
import { expect, describe, it, beforeEach } from "vitest";
import { api } from "../../../convex/_generated/api";
import schema from "../../../convex/schema";
import { createTestUser, createTestProject } from "../../helpers/factories";
import * as projects from "../../../convex/projects";
import * as reviews from "../../../convex/reviews";
import * as _generatedApi from "../../../convex/_generated/api";
import * as _generatedServer from "../../../convex/_generated/server";

const modules = {
  "../../../convex/projects.ts": () => Promise.resolve(projects),
  "../../../convex/reviews.ts": () => Promise.resolve(reviews),
  "../../../convex/_generated/api.ts": () => Promise.resolve(_generatedApi),
  "../../../convex/_generated/server.ts": () => Promise.resolve(_generatedServer),
};

describe("projects", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  describe("list", () => {
    it("should return empty array when no projects exist", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const projects = await asUser.query(api.projects.list, {});

      expect(projects).toEqual([]);
    });

    it("should return all projects sorted by updatedAt descending", async () => {
      const userId = await createTestUser(t);

      // Create projects with different timestamps
      await createTestProject(t, { name: "Project A" });
      await new Promise((r) => setTimeout(r, 10));
      await createTestProject(t, { name: "Project B" });
      await new Promise((r) => setTimeout(r, 10));
      await createTestProject(t, { name: "Project C" });

      const asUser = t.withIdentity({ subject: userId });
      const projects = await asUser.query(api.projects.list, {});

      expect(projects).toHaveLength(3);
      // Most recently updated should be first
      expect(projects[0].name).toBe("Project C");
      expect(projects[1].name).toBe("Project B");
      expect(projects[2].name).toBe("Project A");
    });

    it("should return empty array when not authenticated", async () => {
      await createTestProject(t, { name: "Test Project" });

      const projects = await t.query(api.projects.list, {});

      expect(projects).toEqual([]);
    });
  });

  describe("get", () => {
    it("should return project by ID", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, {
        name: "My Project",
        githubOwner: "test-owner",
        githubRepo: "test-repo",
      });

      const asUser = t.withIdentity({ subject: userId });
      const project = await asUser.query(api.projects.get, { id: projectId });

      expect(project).not.toBeNull();
      expect(project?.name).toBe("My Project");
      expect(project?.githubOwner).toBe("test-owner");
      expect(project?.githubRepo).toBe("test-repo");
    });

    it("should return null for non-existent project", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a real project, then delete it
      const projectId = await createTestProject(t);
      await t.run(async (ctx) => ctx.db.delete(projectId));

      const project = await asUser.query(api.projects.get, { id: projectId });

      expect(project).toBeNull();
    });

    it("should return null when not authenticated", async () => {
      const projectId = await createTestProject(t, { name: "Test Project" });

      const project = await t.query(api.projects.get, { id: projectId });

      expect(project).toBeNull();
    });
  });

  describe("create", () => {
    it("should create project with required GitHub fields", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const projectId = await asUser.mutation(api.projects.create, {
        name: "New Project",
        description: "A test project",
        githubOwner: "my-org",
        githubRepo: "my-repo",
      });

      expect(projectId).toBeDefined();

      // Verify in database
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.name).toBe("New Project");
      expect(project?.description).toBe("A test project");
      expect(project?.githubOwner).toBe("my-org");
      expect(project?.githubRepo).toBe("my-repo");
      expect(project?.githubBranch).toBe("main"); // Default value
    });

    it("should set default githubBranch to 'main' if not provided", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const projectId = await asUser.mutation(api.projects.create, {
        name: "Project Without Branch",
        githubOwner: "owner",
        githubRepo: "repo",
      });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.githubBranch).toBe("main");
    });

    it("should use provided githubBranch", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const projectId = await asUser.mutation(api.projects.create, {
        name: "Project With Branch",
        githubOwner: "owner",
        githubRepo: "repo",
        githubBranch: "develop",
      });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.githubBranch).toBe("develop");
    });

    it("should throw when not authenticated", async () => {
      await expect(
        t.mutation(api.projects.create, {
          name: "Test",
          githubOwner: "owner",
          githubRepo: "repo",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should set timestamps on create", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const before = Date.now();
      const projectId = await asUser.mutation(api.projects.create, {
        name: "Timestamped Project",
        githubOwner: "owner",
        githubRepo: "repo",
      });
      const after = Date.now();

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.createdAt).toBeGreaterThanOrEqual(before);
      expect(project?.createdAt).toBeLessThanOrEqual(after);
      expect(project?.updatedAt).toBe(project?.createdAt);
    });
  });

  describe("update", () => {
    it("should update project fields", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, {
        name: "Original Name",
      });

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.projects.update, {
        id: projectId,
        name: "Updated Name",
        githubBranch: "develop",
      });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.name).toBe("Updated Name");
      expect(project?.githubBranch).toBe("develop");
    });

    it("should update updatedAt timestamp", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);

      const projectBefore = await t.run(async (ctx) => ctx.db.get(projectId));
      const originalUpdatedAt = projectBefore?.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((r) => setTimeout(r, 10));

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.projects.update, {
        id: projectId,
        name: "Updated",
      });

      const projectAfter = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(projectAfter?.updatedAt).toBeGreaterThan(originalUpdatedAt!);
    });

    it("should throw when not authenticated", async () => {
      const projectId = await createTestProject(t);

      await expect(
        t.mutation(api.projects.update, {
          id: projectId,
          name: "Updated",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw when project does not exist", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a real project, then delete it
      const projectId = await createTestProject(t);
      await t.run(async (ctx) => ctx.db.delete(projectId));

      await expect(
        asUser.mutation(api.projects.update, {
          id: projectId,
          name: "Updated",
        })
      ).rejects.toThrow("Project not found");
    });

    it("should update architectureLegend field", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.projects.update, {
        id: projectId,
        architectureLegend: "# Architecture Legend\n\nProject structure...",
      });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.architectureLegend).toBe(
        "# Architecture Legend\n\nProject structure..."
      );
    });

    it("should update lastSyncedCommit field", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.projects.update, {
        id: projectId,
        lastSyncedCommit: "abc123def456",
      });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.lastSyncedCommit).toBe("abc123def456");
    });
  });

  describe("remove", () => {
    it("should delete project", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.projects.remove, { id: projectId });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project).toBeNull();
    });

    it("should throw when not authenticated", async () => {
      const projectId = await createTestProject(t);

      await expect(
        t.mutation(api.projects.remove, { id: projectId })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw when project does not exist", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a real project, then delete it
      const projectId = await createTestProject(t);
      await t.run(async (ctx) => ctx.db.delete(projectId));

      await expect(
        asUser.mutation(api.projects.remove, { id: projectId })
      ).rejects.toThrow("Project not found");
    });
  });
});
