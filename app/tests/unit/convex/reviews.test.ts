/**
 * Reviews Convex Function Tests
 *
 * Tests for convex/reviews.ts
 * Reviews are tied to projects and follow a status workflow state machine.
 */

import { convexTest } from "convex-test";
import { expect, describe, it, beforeEach } from "vitest";
import { api } from "../../../convex/_generated/api";
import schema from "../../../convex/schema";
import {
  createTestUser,
  createTestProject,
  createTestReview,
} from "../../helpers/factories";
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

describe("reviews", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  describe("listByProject", () => {
    it("should return empty array when no reviews exist for project", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);

      const asUser = t.withIdentity({ subject: userId });
      const reviews = await asUser.query(api.reviews.listByProject, {
        projectId,
      });

      expect(reviews).toEqual([]);
    });

    it("should return reviews for a specific project sorted by updatedAt descending", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);

      // Create reviews with different timestamps
      await createTestReview(t, projectId, { title: "Review A" });
      await new Promise((r) => setTimeout(r, 10));
      await createTestReview(t, projectId, { title: "Review B" });
      await new Promise((r) => setTimeout(r, 10));
      await createTestReview(t, projectId, { title: "Review C" });

      const asUser = t.withIdentity({ subject: userId });
      const reviews = await asUser.query(api.reviews.listByProject, {
        projectId,
      });

      expect(reviews).toHaveLength(3);
      // Most recently updated should be first
      expect(reviews[0].title).toBe("Review C");
      expect(reviews[1].title).toBe("Review B");
      expect(reviews[2].title).toBe("Review A");
    });

    it("should not return reviews from other projects", async () => {
      const userId = await createTestUser(t);
      const projectId1 = await createTestProject(t, { name: "Project 1" });
      const projectId2 = await createTestProject(t, { name: "Project 2" });

      await createTestReview(t, projectId1, { title: "Review for Project 1" });
      await createTestReview(t, projectId2, { title: "Review for Project 2" });

      const asUser = t.withIdentity({ subject: userId });
      const reviews = await asUser.query(api.reviews.listByProject, {
        projectId: projectId1,
      });

      expect(reviews).toHaveLength(1);
      expect(reviews[0].title).toBe("Review for Project 1");
    });

    it("should return empty array when not authenticated", async () => {
      const projectId = await createTestProject(t);
      await createTestReview(t, projectId, { title: "Test Review" });

      const reviews = await t.query(api.reviews.listByProject, { projectId });

      expect(reviews).toEqual([]);
    });

    it("should return empty array when project doesn't exist", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a real project, then delete it
      const projectId = await createTestProject(t);
      await t.run(async (ctx) => ctx.db.delete(projectId));

      const reviews = await asUser.query(api.reviews.listByProject, {
        projectId,
      });

      expect(reviews).toEqual([]);
    });
  });

  describe("get", () => {
    it("should return review by ID", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, {
        title: "My Review",
        customInstructions: "Focus on performance",
      });

      const asUser = t.withIdentity({ subject: userId });
      const review = await asUser.query(api.reviews.get, { id: reviewId });

      expect(review).not.toBeNull();
      expect(review?.title).toBe("My Review");
      expect(review?.customInstructions).toBe("Focus on performance");
      expect(review?.status).toBe("draft");
    });

    it("should return null for non-existent review", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a real review, then delete it
      const reviewId = await createTestReview(t, projectId);
      await t.run(async (ctx) => ctx.db.delete(reviewId));

      const review = await asUser.query(api.reviews.get, { id: reviewId });

      expect(review).toBeNull();
    });

    it("should return null when not authenticated", async () => {
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId);

      const review = await t.query(api.reviews.get, { id: reviewId });

      expect(review).toBeNull();
    });
  });

  describe("create", () => {
    it("should create review in draft status", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);

      const asUser = t.withIdentity({ subject: userId });
      const reviewId = await asUser.mutation(api.reviews.create, {
        projectId,
        title: "New Review",
        customInstructions: "Test instructions",
      });

      expect(reviewId).toBeDefined();

      // Verify in database
      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.title).toBe("New Review");
      expect(review?.customInstructions).toBe("Test instructions");
      expect(review?.status).toBe("draft");
      expect(review?.projectId).toBe(projectId);
    });

    it("should throw 'Unauthorized' when not authenticated", async () => {
      const projectId = await createTestProject(t);

      await expect(
        t.mutation(api.reviews.create, {
          projectId,
          title: "Test",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw 'Project not found' when project doesn't exist", async () => {
      const userId = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a real project, then delete it
      const projectId = await createTestProject(t);
      await t.run(async (ctx) => ctx.db.delete(projectId));

      await expect(
        asUser.mutation(api.reviews.create, {
          projectId,
          title: "Test",
        })
      ).rejects.toThrow("Project not found");
    });

    it("should set createdAt and updatedAt timestamps", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);

      const asUser = t.withIdentity({ subject: userId });
      const before = Date.now();
      const reviewId = await asUser.mutation(api.reviews.create, {
        projectId,
        title: "Timestamped Review",
      });
      const after = Date.now();

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.createdAt).toBeGreaterThanOrEqual(before);
      expect(review?.createdAt).toBeLessThanOrEqual(after);
      expect(review?.updatedAt).toBe(review?.createdAt);
    });

    it("should return the new review ID", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);

      const asUser = t.withIdentity({ subject: userId });
      const reviewId = await asUser.mutation(api.reviews.create, {
        projectId,
        title: "Test",
      });

      expect(reviewId).toBeDefined();
      expect(typeof reviewId).toBe("string");

      // Verify it's a valid review ID
      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review).not.toBeNull();
    });
  });

  describe("update", () => {
    it("should update title field", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, {
        title: "Original Title",
      });

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.update, {
        id: reviewId,
        title: "Updated Title",
      });

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.title).toBe("Updated Title");
    });

    it("should update customInstructions field", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId);

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.update, {
        id: reviewId,
        customInstructions: "New instructions",
      });

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.customInstructions).toBe("New instructions");
    });

    it("should update updatedAt timestamp", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId);

      const reviewBefore = await t.run(async (ctx) => ctx.db.get(reviewId));
      const originalUpdatedAt = reviewBefore?.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((r) => setTimeout(r, 10));

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.update, {
        id: reviewId,
        title: "Updated",
      });

      const reviewAfter = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(reviewAfter?.updatedAt).toBeGreaterThan(originalUpdatedAt!);
    });

    it("should throw when not authenticated", async () => {
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId);

      await expect(
        t.mutation(api.reviews.update, {
          id: reviewId,
          title: "Updated",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw 'Review not found' when review doesn't exist", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a real review, then delete it
      const reviewId = await createTestReview(t, projectId);
      await t.run(async (ctx) => ctx.db.delete(reviewId));

      await expect(
        asUser.mutation(api.reviews.update, {
          id: reviewId,
          title: "Updated",
        })
      ).rejects.toThrow("Review not found");
    });
  });

  describe("updateStatus", () => {
    it("should transition from draft to syncing_code", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, { status: "draft" });

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.updateStatus, {
        id: reviewId,
        status: "syncing_code",
      });

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.status).toBe("syncing_code");
    });

    it("should transition from syncing_code to code_analyzed", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, {
        status: "syncing_code",
      });

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.updateStatus, {
        id: reviewId,
        status: "code_analyzed",
      });

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.status).toBe("code_analyzed");
    });

    it("should transition from code_analyzed to uploading_video", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, {
        status: "code_analyzed",
      });

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.updateStatus, {
        id: reviewId,
        status: "uploading_video",
      });

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.status).toBe("uploading_video");
    });

    it("should transition from uploading_video to analyzing_video", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, {
        status: "uploading_video",
      });

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.updateStatus, {
        id: reviewId,
        status: "analyzing_video",
      });

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.status).toBe("analyzing_video");
    });

    it("should transition from analyzing_video to manifest_generated", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, {
        status: "analyzing_video",
      });

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.updateStatus, {
        id: reviewId,
        status: "manifest_generated",
      });

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.status).toBe("manifest_generated");
    });

    it("should transition from manifest_generated to completed", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, {
        status: "manifest_generated",
      });

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.updateStatus, {
        id: reviewId,
        status: "completed",
      });

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review?.status).toBe("completed");
    });

    it("should throw 'Invalid status transition' for invalid transitions (e.g., draft to manifest_generated)", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, { status: "draft" });

      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.reviews.updateStatus, {
          id: reviewId,
          status: "manifest_generated",
        })
      ).rejects.toThrow(
        "Invalid status transition from draft to manifest_generated"
      );
    });

    it("should throw 'Invalid status transition' for backward transitions (e.g., completed to draft)", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId, {
        status: "completed",
      });

      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.reviews.updateStatus, {
          id: reviewId,
          status: "draft",
        })
      ).rejects.toThrow("Invalid status transition from completed to draft");
    });

    it("should throw when not authenticated", async () => {
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId);

      await expect(
        t.mutation(api.reviews.updateStatus, {
          id: reviewId,
          status: "syncing_code",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw 'Review not found' when review doesn't exist", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a real review, then delete it
      const reviewId = await createTestReview(t, projectId);
      await t.run(async (ctx) => ctx.db.delete(reviewId));

      await expect(
        asUser.mutation(api.reviews.updateStatus, {
          id: reviewId,
          status: "syncing_code",
        })
      ).rejects.toThrow("Review not found");
    });
  });

  describe("remove", () => {
    it("should delete review", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId);

      const asUser = t.withIdentity({ subject: userId });
      await asUser.mutation(api.reviews.remove, { id: reviewId });

      const review = await t.run(async (ctx) => ctx.db.get(reviewId));
      expect(review).toBeNull();
    });

    it("should throw when not authenticated", async () => {
      const projectId = await createTestProject(t);
      const reviewId = await createTestReview(t, projectId);

      await expect(
        t.mutation(api.reviews.remove, { id: reviewId })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw 'Review not found' when review doesn't exist", async () => {
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t);
      const asUser = t.withIdentity({ subject: userId });

      // Create a real review, then delete it
      const reviewId = await createTestReview(t, projectId);
      await t.run(async (ctx) => ctx.db.delete(reviewId));

      await expect(
        asUser.mutation(api.reviews.remove, { id: reviewId })
      ).rejects.toThrow("Review not found");
    });
  });
});
