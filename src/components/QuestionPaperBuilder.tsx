import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SectionManager } from "./SectionManager";
import { SyllabusUpload } from "./SyllabusUpload";
import { QuestionGenerator } from "./QuestionGenerator";
import { QuestionSelector } from "./QuestionSelector";
import { PaperPreview } from "./PaperPreview";

interface QuestionPaperBuilderProps {
  questionPaperId: Id<"questionPapers">;
  onBack: () => void;
}

export function QuestionPaperBuilder({ questionPaperId, onBack }: QuestionPaperBuilderProps) {
  const [currentStep, setCurrentStep] = useState<"setup" | "generate" | "select" | "preview">("setup");
  
  const paper = useQuery(api.questionPapers.get, { id: questionPaperId });
  const sections = useQuery(api.sections.list, { questionPaperId });
  const questions = useQuery(api.questions.list, { questionPaperId });

  if (!paper) {
    return <div>Loading...</div>;
  }

  const steps = [
    { id: "setup", name: "Setup", description: "Configure sections and upload syllabus" },
    { id: "generate", name: "Generate", description: "Generate questions with AI" },
    { id: "select", name: "Select", description: "Choose questions for your paper" },
    { id: "preview", name: "Preview", description: "Preview and download paper" },
  ];

  const canProceedToGenerate = sections && sections.length > 0;
  const canProceedToSelect = questions && questions.length > 0;
  const selectedQuestions = questions?.filter(q => q.isSelected) || [];
  const canProceedToPreview = selectedQuestions.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Papers
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{paper.title}</h1>
          <p className="text-gray-600">{paper.institutionName} • {paper.subject}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === step.id
                  ? "bg-blue-600 text-white"
                  : steps.findIndex(s => s.id === currentStep) > index
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {steps.findIndex(s => s.id === currentStep) > index ? "✓" : index + 1}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{step.name}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  steps.findIndex(s => s.id === currentStep) > index ? "bg-green-600" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setCurrentStep("setup")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            currentStep === "setup"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Setup
        </button>
        <button
          onClick={() => setCurrentStep("generate")}
          disabled={!canProceedToGenerate}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            currentStep === "generate"
              ? "bg-blue-100 text-blue-700"
              : canProceedToGenerate
              ? "text-gray-600 hover:text-gray-900"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => setCurrentStep("select")}
          disabled={!canProceedToSelect}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            currentStep === "select"
              ? "bg-blue-100 text-blue-700"
              : canProceedToSelect
              ? "text-gray-600 hover:text-gray-900"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          Select
        </button>
        <button
          onClick={() => setCurrentStep("preview")}
          disabled={!canProceedToPreview}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            currentStep === "preview"
              ? "bg-blue-100 text-blue-700"
              : canProceedToPreview
              ? "text-gray-600 hover:text-gray-900"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {currentStep === "setup" && (
          <div className="space-y-8">
            <SectionManager questionPaperId={questionPaperId} />
            <SyllabusUpload questionPaperId={questionPaperId} />
          </div>
        )}

        {currentStep === "generate" && (
          <QuestionGenerator 
            questionPaperId={questionPaperId}
            onComplete={() => setCurrentStep("select")}
          />
        )}

        {currentStep === "select" && (
          <QuestionSelector 
            questionPaperId={questionPaperId}
            onComplete={() => setCurrentStep("preview")}
          />
        )}

        {currentStep === "preview" && (
          <PaperPreview questionPaperId={questionPaperId} />
        )}
      </div>
    </div>
  );
}
