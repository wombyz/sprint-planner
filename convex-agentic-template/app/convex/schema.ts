/**
 * Convex Schema Definition
 * =========================
 *
 * This file defines the database schema for your Convex application.
 * All tables, fields, and indexes are defined here.
 *
 * IMPORTANT FOR AI AGENTS:
 * - This is the single source of truth for database structure
 * - All field types must match exactly when writing queries/mutations
 * - Indexes determine query efficiency - use them appropriately
 *
 * CONVEX BEST PRACTICES:
 * 1. Use descriptive index names: by_<field> or by_<field1>_<field2>
 * 2. Always add createdAt/updatedAt for audit trails
 * 3. Use v.optional() for nullable fields
 * 4. Reference other tables with v.id("tableName")
 * 5. Keep schema flat - Convex handles relations via IDs
 *
 * @see https://docs.convex.dev/database/schemas
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Include authentication tables from @convex-dev/auth
  ...authTables,

  // ============================================
  // USERS (Extended with profile fields)
  // ============================================
  // The base users table comes from authTables, we extend it here
  users: defineTable({
    // Auth fields (from @convex-dev/auth)
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    image: v.optional(v.string()),

    // Profile fields (custom)
    avatarStorageId: v.optional(v.id("_storage")),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("member"),
        v.literal("viewer")
      )
    ),

    // Timestamps
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"]),

  // ============================================
  // EXAMPLE: PROJECTS TABLE
  // ============================================
  // Rename/modify this table for your domain
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),

    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // ============================================
  // ADD YOUR TABLES BELOW
  // ============================================
  // Follow the pattern above for consistency
});
