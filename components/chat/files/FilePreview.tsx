// /app/components/chat/files/FilePreview.tsx
import React from "react";
import { File, FileText, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: File;
  onRemove?: (file: File) => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  const getFileIcon = () => {
    const fileType = file.type;
    if (fileType.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (
      fileType === "text/plain" ||
      fileType === "application/json" ||
      fileType === "text/markdown" ||
      fileType === "text/csv"
    ) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const getFilePreview = () => {
    const fileType = file.type;
    if (fileType.startsWith("image/")) {
      return (
        <div className="relative h-20 w-20 overflow-hidden rounded-md border">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="group relative flex items-center gap-2 rounded-md border bg-background p-2">
      <div className="flex items-center gap-2">
        {getFileIcon()}
        <div className="flex flex-col">
          <span className="text-sm font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>
      {getFilePreview()}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onRemove(file)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
