import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    title: v.string(),
    institutionName: v.string(),
    subject: v.string(),
    duration: v.string(),
    maxMarks: v.number(),
    instructions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("questionPapers", {
      ...args,
      createdBy: userId,
      status: "draft",
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("questionPapers")
      .withIndex("by_user", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("questionPapers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const paper = await ctx.db.get(args.id);
    if (!paper || paper.createdBy !== userId) {
      throw new Error("Question paper not found");
    }

    return paper;
  },
});

export const updateLogo = mutation({
  args: {
    questionPaperId: v.id("questionPapers"),
    logoId: v.id("_storage"),
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

    await ctx.db.patch(args.questionPaperId, {
      institutionLogo: args.logoId,
    });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
