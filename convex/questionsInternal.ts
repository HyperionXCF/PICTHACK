import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

// Prefer GROQ (if GROQ_API_KEY provided), otherwise fall back to normal
// OpenAI (OPENAI_API_KEY). Model names are configurable via env vars
// `GROQ_MODEL` and `OPENAI_MODEL`. If neither key is present, the code
// generates deterministic mock questions so the app works locally.
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

const groqClient = process.env.GROQ_API_KEY
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" })
  : null;

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const generateForSection = internalAction({
  args: {
    sectionId: v.id("sections"),
    questionPaperId: v.id("questionPapers"),
    sectionName: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
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
    subject: v.string(),
    prompt: v.string(),
    syllabusContent: v.string(),
  },
  handler: async (ctx, args) => {
    // Skip if no questionTypes (legacy sections)
    if (!args.questionTypes) {
      return;
    }

    // Generate questions for each enabled question type
    for (const [questionType, config] of Object.entries(args.questionTypes)) {
      if (!config.enabled || config.count === 0) continue;

      const systemPrompt = `You are an expert question paper generator. Your task is to create high-quality ${questionType.replace('_', ' ')} questions based on the provided syllabus and instructions.
      You must generate exactly ${config.count} questions of type "${questionType}" for a given section of a question paper.
      The output must be a valid JSON object containing a single key "questions" which is an array of question objects.
      Each question object must have the following properties:
      - "question": The question text (string).
      - "questionType": The type of question, which must be "${questionType}".
      - "options": An array of 4 strings representing the options for "mcq" questions. For other question types, this should be an empty array.
      - "correctAnswer": The correct answer (string). For "mcq", this should be one of the provided options.
      
      Ensure the questions match the specified difficulty level and are relevant to the subject and syllabus content.
      Do not include any introductory text or explanations outside of the JSON object.`;

      const userPrompt = `
      Generate exactly ${config.count} ${questionType.replace('_', ' ')} questions for the section "${args.sectionName}" of a question paper for the subject "${args.subject}".

      Details:
      - Question Type: ${questionType.replace('_', ' ')}
      - Number of Questions: ${config.count}
      - Difficulty Level: ${args.difficulty}
      - Marks per Question: ${config.marks}
      - User's Prompt: ${args.prompt}
      - Syllabus Content: ${args.syllabusContent}

      ${questionType === 'mcq' ? 'For MCQ questions, provide exactly 4 options (A, B, C, D) and specify the correct answer as one of these options.' : ''}
      ${questionType === 'short_answer' ? 'For short answer questions, create questions that can be answered in 2-3 sentences or a brief explanation.' : ''}
      ${questionType === 'long_answer' ? 'For long answer questions, create questions that require detailed explanations, analysis, or problem-solving.' : ''}
      ${questionType === 'essay' ? 'For essay questions, create questions that require comprehensive discussion, critical thinking, and structured arguments.' : ''}
      ${questionType === 'numerical' ? 'For numerical questions, create problems that require mathematical calculations and provide numerical answers.' : ''}
      
      Provide the output as a single JSON object with a "questions" array.
      `;

      try {
        let questionsFromLLM: {
          question: string;
          questionType: "mcq" | "short_answer" | "long_answer" | "essay" | "numerical";
          options?: string[];
          correctAnswer: string;
        }[] | null = null;

        // Try GROQ client first
        if (groqClient) {
          try {
            const chatCompletion = await groqClient.chat.completions.create({
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              model: GROQ_MODEL,
              temperature: 0.7,
              response_format: { type: "json_object" },
            });

            const response = chatCompletion.choices?.[0]?.message?.content;
            if (response) {
              questionsFromLLM = JSON.parse(response).questions;
            }
          } catch (e) {
            console.error("GROQ generation failed, falling back to other options:", e);
          }
        }

        // If GROQ not available or failed, try standard OpenAI client
        if (!questionsFromLLM && openaiClient) {
          try {
            const chat = await openaiClient.chat.completions.create({
              model: OPENAI_MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.7,
            });

            const resp = chat.choices?.[0]?.message?.content;
            if (resp) {
              // Expecting JSON string
              try {
                questionsFromLLM = JSON.parse(resp).questions;
              } catch (parseErr) {
                // If the model returned text with JSON inside, try to extract JSON
                const jsonMatch = resp.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  questionsFromLLM = JSON.parse(jsonMatch[0]).questions;
                } else {
                  throw parseErr;
                }
              }
            }
          } catch (e) {
            console.error("OpenAI generation failed, falling back to mock generation:", e);
          }
        }

        // If no LLM available or parsing failed, generate deterministic mock questions
        if (!questionsFromLLM) {
          console.warn("No LLM API key available or generation failed — creating mock questions for local testing.");
          questionsFromLLM = [];
          for (let i = 0; i < config.count; i++) {
            const qText = `${args.sectionName} - ${questionType.replace('_', ' ')} question ${i + 1} (mock)`;
            const q: any = {
              question: qText,
              questionType: questionType as any,
              options: [],
              correctAnswer: "Answer",
            };

            if (questionType === "mcq") {
              q.options = [
                "Option A",
                "Option B",
                "Option C",
                "Option D",
              ];
              q.correctAnswer = q.options[0];
            }

            questionsFromLLM.push(q);
          }
        }

        for (const q of questionsFromLLM) {
          await ctx.runMutation(internal.questions.internalInsertQuestion, {
            sectionId: args.sectionId,
            questionPaperId: args.questionPaperId,
            question: q.question,
            questionType: q.questionType,
            options: q.options || [],
            correctAnswer: q.correctAnswer || "",
            marks: config.marks,
            difficulty: args.difficulty,
          });
        }
      } catch (error) {
        console.error(`Failed to generate ${questionType} questions:`, error);
        // Continue with other question types even if one fails
      }
    }
  },
});
