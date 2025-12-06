import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface SectionManagerProps {
  questionPaperId: Id<"questionPapers">;
}

interface QuestionTypeConfig {
  enabled: boolean;
  count: number;
  marks: number;
}

interface QuestionTypesConfig {
  mcq: QuestionTypeConfig;
  short_answer: QuestionTypeConfig;
  long_answer: QuestionTypeConfig;
  essay: QuestionTypeConfig;
  numerical: QuestionTypeConfig;
}

export function SectionManager({ questionPaperId }: SectionManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    instructions: "",
    questionTypes: {
      mcq: { enabled: true, count: 5, marks: 1 },
      short_answer: { enabled: false, count: 3, marks: 2 },
      long_answer: { enabled: false, count: 2, marks: 5 },
      essay: { enabled: false, count: 1, marks: 10 },
      numerical: { enabled: false, count: 3, marks: 3 },
    } as QuestionTypesConfig,
  });

  const sections = useQuery(api.sections.list, { questionPaperId }) || [];
  const createSection = useMutation(api.sections.create);
  const removeSection = useMutation(api.sections.remove);

  const questionTypeLabels = {
    mcq: "Multiple Choice Questions (MCQ)",
    short_answer: "Short Answer Questions",
    long_answer: "Long Answer Questions",
    essay: "Essay Questions",
    numerical: "Numerical Problems",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasEnabledType = Object.values(formData.questionTypes).some(
      (type) => type.enabled
    );

    if (!hasEnabledType) {
      toast.error("Please enable at least one question type");
      return;
    }

    try {
      await createSection({
        questionPaperId,
        ...formData,
        order: sections.length,
      });

      setFormData({
        name: "",
        difficulty: "medium",
        instructions: "",
        questionTypes: {
          mcq: { enabled: true, count: 5, marks: 1 },
          short_answer: { enabled: false, count: 3, marks: 2 },
          long_answer: { enabled: false, count: 2, marks: 5 },
          essay: { enabled: false, count: 1, marks: 10 },
          numerical: { enabled: false, count: 3, marks: 3 },
        },
      });
      setShowForm(false);
      toast.success("Section added successfully!");
    } catch (error) {
      toast.error("Failed to add section");
      console.error(error);
    }
  };

  const handleRemove = async (sectionId: Id<"sections">) => {
    try {
      await removeSection({ id: sectionId });
      toast.success("Section removed successfully!");
    } catch (error) {
      toast.error("Failed to remove section");
      console.error(error);
    }
  };

  const updateQuestionType = (
    type: keyof QuestionTypesConfig,
    field: keyof QuestionTypeConfig,
    value: boolean | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: {
          ...prev.questionTypes[type],
          [field]: value,
        },
      },
    }));
  };

  const getTotalQuestions = (section: any) => {
    if (section.questionTypes) {
      return Object.values(section.questionTypes)
        .filter((type: any) => type.enabled)
        .reduce((sum: number, type: any) => sum + type.count, 0);
    }
    return section.numberOfQuestions || 0;
  };

  const getTotalMarks = (section: any) => {
    if (section.questionTypes) {
      return Object.values(section.questionTypes)
        .filter((type: any) => type.enabled)
        .reduce((sum: number, type: any) => sum + type.count * type.marks, 0);
    }
    return (section.numberOfQuestions || 0) * (section.marksPerQuestion || 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Sections</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          {showForm ? "Cancel" : "Add Section"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 p-6 rounded-lg mb-4 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficulty: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section Instructions (optional)
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Question Types
            </h3>
            <div className="space-y-4">
              {Object.entries(formData.questionTypes).map(([type, config]) => (
                <div key={type} className="border rounded-lg p-4">
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) =>
                        updateQuestionType(
                          type as keyof QuestionTypesConfig,
                          "enabled",
                          e.target.checked
                        )
                      }
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-sm font-medium">
                      {questionTypeLabels[type as keyof typeof questionTypeLabels]}
                    </span>
                  </label>

                  {config.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs mb-1">
                          Number of Questions
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={config.count}
                          onChange={(e) =>
                            updateQuestionType(
                              type as keyof QuestionTypesConfig,
                              "count",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 text-sm border rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1">
                          Marks Per Question
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={config.marks}
                          onChange={(e) =>
                            updateQuestionType(
                              type as keyof QuestionTypesConfig,
                              "marks",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 text-sm border rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Section Summary
            </h4>
            <p className="text-sm text-blue-800">
              <strong>Total Questions:</strong>{" "}
              {Object.values(formData.questionTypes)
                .filter((t) => t.enabled)
                .reduce((s, t) => s + t.count, 0)}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Total Marks:</strong>{" "}
              {Object.values(formData.questionTypes)
                .filter((t) => t.enabled)
                .reduce((s, t) => s + t.count * t.marks, 0)}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Add Section
            </button>
          </div>
        </form>
      )}

      {sections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No sections added yet.
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section._id}
              className="border rounded-lg p-4"
            >
              <div className="flex justify-between mb-3">
                <div className="flex items-center gap-4">
                  <h3 className="font-medium text-gray-900">{section.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      section.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : section.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {section.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => handleRemove(section._id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  🗑️
                </button>
              </div>

              {section.instructions && (
                <div className="text-sm text-gray-600 mb-3">
                  <strong>Instructions:</strong> {section.instructions}
                </div>
              )}

              {section.questionTypes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(section.questionTypes)
                    .filter(([_, cfg]) => cfg.enabled)
                    .map(([type, cfg]) => (
                      <div key={type} className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {
                            questionTypeLabels[
                              type as keyof typeof questionTypeLabels
                            ]
                          }
                        </div>
                        <div className="text-xs text-gray-600">
                          {cfg.count} questions × {cfg.marks} marks ={" "}
                          {cfg.count * cfg.marks} marks
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  {section.numberOfQuestions} questions •{" "}
                  {section.marksPerQuestion} marks each
                </div>
              )}

              <div className="mt-3 pt-3 border-t">
                <div className="text-sm text-gray-600">
                  <strong>Total:</strong> {getTotalQuestions(section)} questions •{" "}
                  <strong>{getTotalMarks(section)} marks</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sections.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Paper Total:</strong>{" "}
            {sections.reduce((s, sec) => s + getTotalQuestions(sec), 0)}{" "}
            questions •{" "}
            <strong>
              {sections.reduce((s, sec) => s + getTotalMarks(sec), 0)} marks
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
