import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface QuestionSelectorProps {
  questionPaperId: Id<"questionPapers">;
  onComplete: () => void;
}

export function QuestionSelector({ questionPaperId, onComplete }: QuestionSelectorProps) {
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const sections = useQuery(api.sections.list, { questionPaperId }) || [];
  const questions = useQuery(api.questions.list, { questionPaperId }) || [];
  const toggleSelection = useMutation(api.questions.toggleSelection);

  const questionTypeLabels = {
    mcq: "Multiple Choice",
    short_answer: "Short Answer",
    long_answer: "Long Answer",
    essay: "Essay",
    numerical: "Numerical",
  };

  // Filter questions based on selected section and type
  const filteredQuestions = questions.filter(question => {
    const sectionMatch = selectedSection === "all" || question.sectionId === selectedSection;
    const typeMatch = selectedType === "all" || question.questionType === selectedType;
    return sectionMatch && typeMatch;
  });

  // Group questions by section
  const questionsBySection = sections.map(section => ({
    section,
    questions: filteredQuestions.filter(q => q.sectionId === section._id)
  })).filter(item => item.questions.length > 0);

  const handleToggleQuestion = async (questionId: Id<"questions">, isSelected: boolean) => {
    try {
      await toggleSelection({ questionId, isSelected });
    } catch (error) {
      toast.error("Failed to update question selection");
      console.error(error);
    }
  };

  const handleSelectAll = async (sectionQuestions: typeof questions) => {
    try {
      for (const question of sectionQuestions) {
        if (!question.isSelected) {
          await toggleSelection({ questionId: question._id, isSelected: true });
        }
      }
      toast.success("All questions selected");
    } catch (error) {
      toast.error("Failed to select all questions");
    }
  };

  const handleDeselectAll = async (sectionQuestions: typeof questions) => {
    try {
      for (const question of sectionQuestions) {
        if (question.isSelected) {
          await toggleSelection({ questionId: question._id, isSelected: false });
        }
      }
      toast.success("All questions deselected");
    } catch (error) {
      toast.error("Failed to deselect all questions");
    }
  };

  const selectedQuestions = questions.filter(q => q.isSelected);
  const totalSelectedMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">❓</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No questions generated yet</h3>
        <p className="text-gray-500">Go back to the Generate step to create questions first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Select Questions</h2>
        <div className="text-sm text-gray-600">
          {selectedQuestions.length} of {questions.length} questions selected ({totalSelectedMarks} marks)
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sections</option>
            {sections.map(section => (
              <option key={section._id} value={section._id}>{section.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {Object.entries(questionTypeLabels).map(([type, label]) => (
              <option key={type} value={type}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions by Section */}
      <div className="space-y-6">
        {questionsBySection.map(({ section, questions: sectionQuestions }) => (
          <div key={section._id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{section.name}</h3>
                <p className="text-sm text-gray-600">
                  {sectionQuestions.filter(q => q.isSelected).length} of {sectionQuestions.length} questions selected
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectAll(sectionQuestions)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Select All
                </button>
                <button
                  onClick={() => handleDeselectAll(sectionQuestions)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {sectionQuestions.map((question, index) => (
                <div
                  key={question._id}
                  className={`border rounded-lg p-4 ${
                    question.isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={question.isSelected}
                      onChange={(e) => handleToggleQuestion(question._id, e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">Q{index + 1}.</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            question.questionType === "mcq" ? "bg-green-100 text-green-800" :
                            question.questionType === "short_answer" ? "bg-blue-100 text-blue-800" :
                            question.questionType === "long_answer" ? "bg-purple-100 text-purple-800" :
                            question.questionType === "essay" ? "bg-orange-100 text-orange-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {questionTypeLabels[question.questionType]}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">[{question.marks} marks]</span>
                      </div>
                      
                      <p className="text-gray-900 mb-2">{question.question}</p>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="text-sm text-gray-700">
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Answer:</strong> {question.correctAnswer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary and Continue */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Selection Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Selected Questions:</span>
            <span className="ml-2 font-medium">{selectedQuestions.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Marks:</span>
            <span className="ml-2 font-medium">{totalSelectedMarks}</span>
          </div>
          <div>
            <span className="text-gray-600">Question Types:</span>
            <span className="ml-2 font-medium">
              {Array.from(new Set(selectedQuestions.map(q => q.questionType))).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Sections:</span>
            <span className="ml-2 font-medium">
              {Array.from(new Set(selectedQuestions.map(q => q.sectionId))).length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={selectedQuestions.length === 0}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Preview ({selectedQuestions.length} questions selected)
        </button>
      </div>
    </div>
  );
}
