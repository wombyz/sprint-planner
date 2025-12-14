/**
 * Projects Convex Function Tests
 *
 * Tests for convex/projects.ts
 */

import { convexTest } from "convex-test";
import { expect, describe, it, beforeEach } from "vitest";
import { api } from "../../../convex/_generated/api";
import schema from "../../../convex/schema";
import { createTestUser, createTestProject } from "../../helpers/factories";

describe("projects", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema);
  });

  describe("list", () => {
    it("should return empty array when user has no projects", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const projects = await asUser.query(api.projects.list, {});

      expect(projects).toEqual([]);
    });

    it("should return only user's own projects", async () => {
      const user1 = await createTestUser(t, { email: "user1@test.com" });
      const user2 = await createTestUser(t, { email: "user2@test.com" });

      await createTestProject(t, user1, { name: "User 1 Project" });
      await createTestProject(t, user2, { name: "User 2 Project" });

      const asUser1 = t.withIdentity({ subject: user1 });
      const projects = await asUser1.query(api.projects.list, {});

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe("User 1 Project");
    });

    it("should filter by status when provided", async () => {
      const userId = await createTestUser(t);

      await createTestProject(t, userId, { name: "Draft", status: "draft" });
      await createTestProject(t, userId, { name: "Active", status: "active" });

      const asUser = t.withIdentity({ subject: userId });
      const activeProjects = await asUser.query(api.projects.list, {
        status: "active",
      });

      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].name).toBe("Active");
    });
  });

  describe("get", () => {
    it("should return project by ID", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId, {
        name: "My Project",
      });

      const asUser = t.withIdentity({ subject: userId });
      const project = await asUser.query(api.projects.get, { id: projectId });

      expect(project).not.toBeNull();
      expect(project?.name).toBe("My Project");
    });

    it("should return null for non-existent project", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a valid-looking but non-existent ID
      const fakeId = "k5d7c8e9f0a1b2c3" as any;
      const project = await asUser.query(api.projects.get, { id: fakeId });

      expect(project).toBeNull();
    });
  });

  describe("create", () => {
    it("should create project for authenticated user", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const projectId = await asUser.mutation(api.projects.create, {
        name: "New Project",
        description: "A test project",
      });

      expect(projectId).toBeDefined();

      // Verify in database
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.name).toBe("New Project");
      expect(project?.description).toBe("A test project");
      expect(project?.userId).toBe(userId);
      expect(project?.status).toBe("draft");
    });

    it("should throw when not authenticated", async () => {
      await expect(
        t.mutation(api.projects.create, { name: "Test" })
      ).rejects.toThrow("Unauthorized");
    });

    it("should set timestamps on create", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const before = Date.now();
      const projectId = await asUser.mutation(api.projects.create, {
        name: "Timestamped Project",
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
      const projectId = await createTestProject(t, userId, {
        name: "Original Name",
      });

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.projects.update, {
        id: projectId,
        name: "Updated Name",
        status: "active",
      });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.name).toBe("Updated Name");
      expect(project?.status).toBe("active");
    });

    it("should update updatedAt timestamp", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

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

    it("should not allow updating other user's project", async () => {
      const user1 = await createTestUser(t, { email: "user1@test.com" });
      const user2 = await createTestUser(t, { email: "user2@test.com" });
      const projectId = await createTestProject(t, user1);

      const asUser2 = t.withIdentity({ subject: user2 });

      await expect(
        asUser2.mutation(api.projects.update, {
          id: projectId,
          name: "Hacked",
        })
      ).rejects.toThrow("Not authorized");
    });
  });

  describe("remove", () => {
    it("should delete project", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.projects.remove, { id: projectId });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project).toBeNull();
    });

    it("should not allow deleting other user's project", async () => {
      const user1 = await createTestUser(t, { email: "user1@test.com" });
      const user2 = await createTestUser(t, { email: "user2@test.com" });
      const projectId = await createTestProject(t, user1);

      const asUser2 = t.withIdentity({ subject: user2 });

      await expect(
        asUser2.mutation(api.projects.remove, { id: projectId })
      ).rejects.toThrow("Not authorized");
    });
  });
});
