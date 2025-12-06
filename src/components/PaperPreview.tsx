import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PaperPreviewProps {
  questionPaperId: Id<"questionPapers">;
}

export function PaperPreview({ questionPaperId }: PaperPreviewProps) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const paper = useQuery(api.questionPapers.get, { id: questionPaperId });
  const sections = useQuery(api.sections.list, { questionPaperId }) || [];
  const questions = useQuery(api.questions.list, { questionPaperId }) || [];
  
  const generateUploadUrl = useMutation(api.questionPapers.generateUploadUrl);
  const updateLogo = useMutation(api.questionPapers.updateLogo);

  const selectedQuestions = questions.filter(q => q.isSelected);
  const questionsBySection = sections.map(section => ({
    section,
    questions: selectedQuestions.filter(q => q.sectionId === section._id)
  })).filter(item => item.questions.length > 0);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setLogoUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      
      await updateLogo({
        questionPaperId,
        logoId: storageId,
      });

      toast.success("Logo uploaded successfully!");
      
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Failed to upload logo");
      console.error(error);
    } finally {
      setLogoUploading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadAnswers = () => {
    const answersContent = generateAnswersContent();
    const blob = new Blob([answersContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paper?.title || 'Question Paper'} - Answer Key.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateAnswersContent = () => {
    if (!paper) return "";

    let content = `${paper.title}\nAnswer Key\n\n`;
    content += `Institution: ${paper.institutionName}\n`;
    content += `Subject: ${paper.subject}\n`;
    content += `Duration: ${paper.duration}\n`;
    content += `Max Marks: ${paper.maxMarks}\n\n`;

    questionsBySection.forEach((item, sectionIndex) => {
      content += `${item.section.name}\n`;
      content += "=".repeat(item.section.name.length) + "\n\n";

      item.questions.forEach((question, questionIndex) => {
        content += `Q${questionIndex + 1}. ${question.question}\n`;
        if (question.options && question.options.length > 0) {
          question.options.forEach((option, optionIndex) => {
            content += `   ${String.fromCharCode(65 + optionIndex)}. ${option}\n`;
          });
        }
        content += `Answer: ${question.correctAnswer}\n`;
        content += `Marks: ${question.marks}\n\n`;
      });
    });

    return content;
  };

  if (!paper) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Question Paper Preview</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </button>
          <button
            onClick={handleDownloadAnswers}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Download Answer Key
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Print Question Paper
          </button>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Institution Logo</h3>
        <div className="flex items-center gap-4">
          <input
            ref={logoInputRef}
            type="file"
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={logoUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {logoUploading ? "Uploading..." : "Upload Logo"}
          </button>
          <span className="text-sm text-gray-600">
            Upload your institution's logo for the question paper header
          </span>
        </div>
      </div>

      {/* Question Paper Preview */}
      <div className="bg-white border border-gray-300 p-8 print:p-0 print:border-0" id="question-paper">
        {/* Header */}
        <div className="text-center mb-8 print:mb-6">
          {paper.institutionLogo && (
            <div className="mb-4">
              <img 
                src={`/api/storage/${paper.institutionLogo}`} 
                alt="Institution Logo" 
                className="h-16 mx-auto"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{paper.institutionName}</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{paper.title}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-b border-gray-300 py-3">
            <div><strong>Subject:</strong> {paper.subject}</div>
            <div><strong>Duration:</strong> {paper.duration}</div>
            <div><strong>Max Marks:</strong> {paper.maxMarks}</div>
            <div><strong>Date:</strong> ___________</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            {paper.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>

        {/* Questions by Section */}
        {questionsBySection.map((item, sectionIndex) => (
          <div key={item.section._id} className="mb-8 print:break-inside-avoid">
            <div className="bg-gray-100 p-3 rounded-lg mb-4 print:bg-gray-200">
              <h3 className="font-bold text-gray-900">
                {item.section.name}
              </h3>
              {item.section.instructions && (
                <p className="text-sm text-gray-700 mt-1">{item.section.instructions}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Questions: {item.questions.length} | 
                Total marks: {item.questions.reduce((sum, q) => sum + q.marks, 0)}
              </p>
            </div>

            <div className="space-y-6">
              {item.questions.map((question, questionIndex) => (
                <div key={question._id} className="print:break-inside-avoid">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-900 min-w-0">
                      {questionIndex + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-900">{question.question}</p>
                        <span className="text-sm text-gray-600 ml-4 whitespace-nowrap">
                          [{question.marks} marks]
                        </span>
                      </div>

                      {question.options && question.options.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="text-gray-700">
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </div>
                          ))}
                        </div>
                      )}

                      {showAnswers && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded print:hidden">
                          <span className="text-sm font-medium text-green-800">
                            Answer: {question.correctAnswer}
                          </span>
                        </div>
                      )}

                      {/* Answer space for non-MCQ questions */}
                      {question.questionType !== "mcq" && !showAnswers && (
                        <div className="mt-4 space-y-2">
                          {Array.from({ length: Math.min(question.marks, 8) }, (_, i) => (
                            <div key={i} className="border-b border-gray-300 h-6"></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
          <p>*** End of Question Paper ***</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gray-50 p-4 rounded-lg print:hidden">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Paper Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Questions:</span>
            <span className="ml-2 font-medium">{selectedQuestions.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Marks:</span>
            <span className="ml-2 font-medium">
              {selectedQuestions.reduce((sum, q) => sum + q.marks, 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Sections:</span>
            <span className="ml-2 font-medium">{questionsBySection.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Question Types:</span>
            <span className="ml-2 font-medium">
              {Array.from(new Set(selectedQuestions.map(q => q.questionType))).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
