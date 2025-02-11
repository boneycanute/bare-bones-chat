// /app/hooks/useFileUpload.ts
import { ChangeEvent, useRef, useState } from "react";

const MAX_TOTAL_SIZE_MB = 25;
const MB_TO_BYTES = 1024 * 1024;

interface FileUpload {
  selectedFiles: File[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  removeFile: (fileToRemove: File) => void;
  uploadFile: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const useFileUpload = (): FileUpload => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Calculate total size of existing files plus new files
    const existingFilesSize = selectedFiles.reduce(
      (total, file) => total + file.size,
      0
    );
    const newFilesSize = files.reduce((total, file) => total + file.size, 0);
    const totalSizeInMB = (existingFilesSize + newFilesSize) / MB_TO_BYTES;

    if (totalSizeInMB > MAX_TOTAL_SIZE_MB) {
      alert(`Total file size cannot exceed ${MAX_TOTAL_SIZE_MB}MB`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File): Promise<void> => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      // Add the uploaded file to selectedFiles
      setSelectedFiles((prev) => [...prev, file]);
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToRemove)
    );
  };

  return {
    selectedFiles,
    fileInputRef,
    handleFileUpload,
    removeFile,
    uploadFile,
    isUploading,
  };
};
