import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    questionPaperId: v.id("questionPapers"),
    name: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    instructions: v.optional(v.string()),
    order: v.number(),
    questionTypes: v.optional(v.object({
      mcq: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
      short_answer: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
      long_answer: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
      essay: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
      numerical: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const paper = await ctx.db.get(args.questionPaperId);
    if (!paper || paper.createdBy !== userId) {
      throw new Error("Question paper not found");
    }

    return await ctx.db.insert("sections", args);
  },
});

export const list = query({
  args: { questionPaperId: v.id("questionPapers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const paper = await ctx.db.get(args.questionPaperId);
    if (!paper || paper.createdBy !== userId) {
      return [];
    }

    return await ctx.db
      .query("sections")
      .withIndex("by_paper", (q) => q.eq("questionPaperId", args.questionPaperId))
      .order("asc")
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("sections"),
    name: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
    instructions: v.optional(v.string()),
    questionTypes: v.optional(v.object({
      mcq: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
      short_answer: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
      long_answer: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
      essay: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
      numerical: v.object({
        enabled: v.boolean(),
        count: v.number(),
        marks: v.number(),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { id, ...updates } = args;
    const section = await ctx.db.get(id);
    if (!section) {
      throw new Error("Section not found");
    }

    const paper = await ctx.db.get(section.questionPaperId);
    if (!paper || paper.createdBy !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("sections") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const section = await ctx.db.get(args.id);
    if (!section) {
      throw new Error("Section not found");
    }

    const paper = await ctx.db.get(section.questionPaperId);
    if (!paper || paper.createdBy !== userId) {
      throw new Error("Not authorized");
    }

    // Delete all questions in this section
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_section", (q) => q.eq("sectionId", args.id))
      .collect();

    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    await ctx.db.delete(args.id);
  },
});
