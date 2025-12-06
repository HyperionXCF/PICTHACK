import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

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
      .query("questions")
      .withIndex("by_paper", (q) => q.eq("questionPaperId", args.questionPaperId))
      .collect();
  },
});

export const listBySection = query({
  args: { sectionId: v.id("sections") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("questions")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect();
  },
});

export const toggleSelection = mutation({
  args: {
    questionId: v.id("questions"),
    isSelected: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const paper = await ctx.db.get(question.questionPaperId);
    if (!paper || paper.createdBy !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.questionId, {
      isSelected: args.isSelected,
    });
  },
});

export const generateQuestions = action({
  args: {
    questionPaperId: v.id("questionPapers"),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const paper = await ctx.runQuery(api.questionPapers.get, {
      id: args.questionPaperId,
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    const sections = await ctx.runQuery(api.sections.list, {
      questionPaperId: args.questionPaperId,
    });

    const syllabusFiles = await ctx.runQuery(api.syllabusFiles.list, {
      questionPaperId: args.questionPaperId,
    });

    // Get syllabus content (simplified - in real implementation, you'd extract text from PDFs/docs)
    let syllabusContent = "No syllabus uploaded";
    if (syllabusFiles.length > 0) {
      syllabusContent = "Syllabus files uploaded: " + syllabusFiles.map(f => f.fileName).join(", ");
    }

    for (const section of sections) {
      // Skip legacy sections without questionTypes
      if (!section.questionTypes) {
        continue;
      }
      
      await ctx.runAction(internal.questionsInternal.generateForSection, {
        sectionId: section._id,
        questionPaperId: args.questionPaperId,
        sectionName: section.name,
        difficulty: section.difficulty,
        questionTypes: section.questionTypes,
        subject: paper.subject,
        prompt: args.prompt,
        syllabusContent,
      });
    }
  },
});

export const internalInsertQuestion = internalMutation({
  args: {
    sectionId: v.id("sections"),
    questionPaperId: v.id("questionPapers"),
    question: v.string(),
    questionType: v.union(
      v.literal("mcq"),
      v.literal("short_answer"),
      v.literal("long_answer"),
      v.literal("essay"),
      v.literal("numerical")
    ),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.string(),
    marks: v.number(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("questions", {
      ...args,
      isSelected: false,
      generatedBy: "llm",
    });
  },
});
