import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  questionPapers: defineTable({
    title: v.string(),
    institutionName: v.string(),
    institutionLogo: v.optional(v.id("_storage")),
    subject: v.string(),
    duration: v.string(),
    maxMarks: v.number(),
    instructions: v.array(v.string()),
    createdBy: v.id("users"),
    status: v.union(v.literal("draft"), v.literal("generated")),
  }).index("by_user", ["createdBy"]),

  sections: defineTable({
    questionPaperId: v.id("questionPapers"),
    name: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    instructions: v.optional(v.string()),
    order: v.number(),
    // Legacy fields for backward compatibility
    numberOfQuestions: v.optional(v.number()),
    marksPerQuestion: v.optional(v.number()),
    // Question type configurations
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
  }).index("by_paper", ["questionPaperId"]),

  questions: defineTable({
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
    isSelected: v.boolean(),
    generatedBy: v.literal("llm"),
  }).index("by_section", ["sectionId"])
    .index("by_paper", ["questionPaperId"]),

  syllabusFiles: defineTable({
    questionPaperId: v.id("questionPapers"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    uploadedBy: v.id("users"),
  }).index("by_paper", ["questionPaperId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
