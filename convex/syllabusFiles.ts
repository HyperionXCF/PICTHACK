import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const upload = mutation({
  args: {
    questionPaperId: v.id("questionPapers"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
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

    return await ctx.db.insert("syllabusFiles", {
      ...args,
      uploadedBy: userId,
    });
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

    const files = await ctx.db
      .query("syllabusFiles")
      .withIndex("by_paper", (q) => q.eq("questionPaperId", args.questionPaperId))
      .collect();

    return Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.fileId),
      }))
    );
  },
});

export const remove = mutation({
  args: { id: v.id("syllabusFiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const file = await ctx.db.get(args.id);
    if (!file || file.uploadedBy !== userId) {
      throw new Error("File not found");
    }

    await ctx.db.delete(args.id);
  },
});
