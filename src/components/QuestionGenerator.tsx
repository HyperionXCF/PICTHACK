import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface QuestionGeneratorProps {
  questionPaperId: Id<"questionPapers">;
  onComplete: () => void;
}

export function QuestionGenerator({ questionPaperId, onComplete }: QuestionGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateQuestions = useAction(api.questions.generateQuestions);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt for question generation");
      return;
    }

    setGenerating(true);

    try {
      await generateQuestions({
        questionPaperId,
        prompt: prompt.trim(),
      });

      toast.success("Questions generated successfully!");
      onComplete();
    } catch (error: any) {
      const errorMessage = error.data?.message ?? "Please check the browser console for details.";
      toast.error(`Failed to generate questions: ${errorMessage}`);
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const samplePrompts = [
    "Generate questions covering fundamental concepts and practical applications",
    "Create questions that test both theoretical knowledge and problem-solving skills",
    "Focus on real-world scenarios and case studies in the questions",
    "Include questions that require critical thinking and analysis",
    "Generate questions covering the entire syllabus with balanced difficulty"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Questions with AI</h2>
        <p className="text-gray-600 mb-6">
          Provide instructions for the AI to generate questions based on your syllabus and sections.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Generation Prompt *
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Describe what kind of questions you want to generate..."
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Sample Prompts</h3>
        <div className="space-y-2">
          {samplePrompts.map((sample, index) => (
            <button
              key={index}
              onClick={() => setPrompt(sample)}
              className="block w-full text-left p-3 text-sm text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Better Questions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific about the type of questions you want (MCQ, short answer, etc.)</li>
          <li>• Mention if you want questions from specific topics or chapters</li>
          <li>• Specify the level of difficulty and complexity</li>
          <li>• Include any special requirements or formats</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating Questions...
            </>
          ) : (
            "Generate Questions"
          )}
        </button>
      </div>

      {generating && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800 text-sm">
            🤖 AI is generating questions based on your sections and syllabus. This may take a few moments...
          </p>
        </div>
      )}
    </div>
  );
}
