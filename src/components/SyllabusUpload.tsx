import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface SyllabusUploadProps {
  questionPaperId: Id<"questionPapers">;
}

export function SyllabusUpload({ questionPaperId }: SyllabusUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syllabusFiles = useQuery(api.syllabusFiles.list, { questionPaperId }) || [];
  const generateUploadUrl = useMutation(api.questionPapers.generateUploadUrl);
  const uploadFile = useMutation(api.syllabusFiles.upload);
  const removeFile = useMutation(api.syllabusFiles.remove);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload PDF, PPT, DOC, or TXT files only");
      return;
    }

    setUploading(true);

    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Save file info to database
      await uploadFile({
        questionPaperId,
        fileId: storageId,
        fileName: file.name,
        fileType: file.type,
      });

      toast.success("File uploaded successfully!");
      
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Failed to upload file");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (fileId: Id<"syllabusFiles">) => {
    try {
      await removeFile({ id: fileId });
      toast.success("File removed successfully!");
    } catch (error) {
      toast.error("Failed to remove file");
      console.error(error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('presentation')) return '📊';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    return '📎';
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Syllabus Upload</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">📁</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Syllabus Files</h3>
        <p className="text-gray-600 mb-4">
          Upload PDF, PPT, DOC, or TXT files containing your syllabus content
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Choose Files"}
        </button>
        
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: PDF, PPT, PPTX, DOC, DOCX, TXT
        </p>
      </div>

      {syllabusFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Uploaded Files</h3>
          <div className="space-y-2">
            {syllabusFiles.map((file) => (
              <div key={file._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{file.fileName}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded {new Date(file._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="View file"
                    >
                      👁️
                    </a>
                  )}
                  <button
                    onClick={() => handleRemoveFile(file._id)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Remove file"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
