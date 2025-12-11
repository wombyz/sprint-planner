/**
 * Seed Functions
 *
 * Functions to seed the database with test data.
 *
 * Usage:
 *   npx convex run seed:seed '{}'
 *
 * This creates the standard test user:
 *   Email: test@mail.com
 *   Password: password123
 */

import { internalMutation } from "./_generated/server";
import { Scrypt } from "lucia";
import { v } from "convex/values";

/**
 * Seeds a test user for E2E testing.
 *
 * Creates a user with email test@mail.com and password password123
 * if one doesn't already exist.
 */
export const seedTestUser = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if test user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "test@mail.com"))
      .first();

    if (existingUser) {
      console.log("Test user already exists:", existingUser._id);
      return { userId: existingUser._id, created: false };
    }

    // Create the test user
    const userId = await ctx.db.insert("users", {
      email: "test@mail.com",
      name: "Test User",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Hash the password using the same method as @convex-dev/auth
    const scrypt = new Scrypt();
    const hashedPassword = await scrypt.hash("password123");

    // Create the auth account (linked to the password provider)
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: "test@mail.com",
      secret: hashedPassword,
    });

    console.log("Created test user:", userId);
    return { userId, created: true };
  },
});

/**
 * Seeds test data - can be called from CLI
 *
 * Usage:
 *   npx convex run seed:seed '{}'
 *   npx convex run seed:seed '{"testUser": false}'  # Skip test user
 */
export const seed = internalMutation({
  args: {
    testUser: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results: Record<string, unknown> = {};

    if (args.testUser !== false) {
      // Check if test user already exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "test@mail.com"))
        .first();

      if (!existingUser) {
        // Create the test user
        const userId = await ctx.db.insert("users", {
          email: "test@mail.com",
          name: "Test User",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Hash the password
        const scrypt = new Scrypt();
        const hashedPassword = await scrypt.hash("password123");

        // Create the auth account
        await ctx.db.insert("authAccounts", {
          userId,
          provider: "password",
          providerAccountId: "test@mail.com",
          secret: hashedPassword,
        });

        results.testUser = { userId, created: true };
      } else {
        results.testUser = { userId: existingUser._id, created: false };
      }
    }

    return results;
  },
});
