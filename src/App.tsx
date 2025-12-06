import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { QuestionPaperList } from "./components/QuestionPaperList";
import { CreateQuestionPaper } from "./components/CreateQuestionPaper";
import { QuestionPaperBuilder } from "./components/QuestionPaperBuilder";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  const [currentView, setCurrentView] = useState<"list" | "create" | "build">("list");
  const [selectedPaperId, setSelectedPaperId] = useState<Id<"questionPapers"> | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">Question Paper Generator</h2>
          <Authenticated>
            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentView("list")}
                className={`px-3 py-1 rounded text-sm ${
                  currentView === "list" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Papers
              </button>
              <button
                onClick={() => setCurrentView("create")}
                className={`px-3 py-1 rounded text-sm ${
                  currentView === "create" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Create New
              </button>
            </nav>
          </Authenticated>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <Content 
          currentView={currentView}
          setCurrentView={setCurrentView}
          selectedPaperId={selectedPaperId}
          setSelectedPaperId={setSelectedPaperId}
        />
      </main>
      <Toaster />
    </div>
  );
}

function Content({ 
  currentView, 
  setCurrentView, 
  selectedPaperId, 
  setSelectedPaperId 
}: {
  currentView: "list" | "create" | "build";
  setCurrentView: (view: "list" | "create" | "build") => void;
  selectedPaperId: Id<"questionPapers"> | null;
  setSelectedPaperId: (id: Id<"questionPapers"> | null) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Authenticated>
        {currentView === "list" && (
          <QuestionPaperList 
            onCreateNew={() => setCurrentView("create")}
            onEditPaper={(id) => {
              setSelectedPaperId(id);
              setCurrentView("build");
            }}
          />
        )}
        {currentView === "create" && (
          <CreateQuestionPaper 
            onSuccess={(id) => {
              setSelectedPaperId(id);
              setCurrentView("build");
            }}
            onCancel={() => setCurrentView("list")}
          />
        )}
        {currentView === "build" && selectedPaperId && (
          <QuestionPaperBuilder 
            questionPaperId={selectedPaperId}
            onBack={() => setCurrentView("list")}
          />
        )}
      </Authenticated>

      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Question Paper Generator
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Create professional question papers with AI assistance. Upload your syllabus, 
              configure sections, and generate questions automatically.
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
