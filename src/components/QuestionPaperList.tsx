import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface QuestionPaperListProps {
  onCreateNew: () => void;
  onEditPaper: (id: Id<"questionPapers">) => void;
}

export function QuestionPaperList({ onCreateNew, onEditPaper }: QuestionPaperListProps) {
  const questionPapers = useQuery(api.questionPapers.list) || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Question Papers</h1>
        <button
          onClick={onCreateNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Paper
        </button>
      </div>

      {questionPapers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No question papers yet</h3>
          <p className="text-gray-500 mb-6">Create your first AI-generated question paper</p>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {questionPapers.map((paper) => (
            <div
              key={paper._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onEditPaper(paper._id)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-lg">{paper.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  paper.status === "draft" 
                    ? "bg-yellow-100 text-yellow-800" 
                    : "bg-green-100 text-green-800"
                }`}>
                  {paper.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Institution:</span> {paper.institutionName}</p>
                <p><span className="font-medium">Subject:</span> {paper.subject}</p>
                <p><span className="font-medium">Duration:</span> {paper.duration}</p>
                <p><span className="font-medium">Max Marks:</span> {paper.maxMarks}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Created {new Date(paper._creationTime).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
