import { ChangeEvent, KeyboardEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FilePreview } from "../files/FilePreview";
import { useFileUpload } from "@/hooks/useFileUpload";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isStreaming: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  credits: number;
}

export function ChatInput({
  inputText,
  setInputText,
  isStreaming,
  onSubmit,
  credits,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedFiles, fileInputRef, handleFileUpload, removeFile } =
    useFileUpload();

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    adjustTextareaHeight();
  };

  const getTooltipContent = () => {
    if (isStreaming) return "Processing...";
    if (credits <= 0) return "No credits remaining";
    if (!inputText.trim() && selectedFiles.length === 0)
      return "Type a message";
    return "Send message";
  };

  return (
    <div className="bg-white p-4 border-black/10 dark:bg-black">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
        className="max-w-3xl mx-auto"
      >
        {/* File Previews */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedFiles.map((file) => (
              <FilePreview
                key={file.name}
                file={file}
                onRemove={() => removeFile(file)}
              />
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept=".pdf,.csv,.txt,.js,.jsx,.ts,.tsx,.json,.md"
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload files</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Start typing and hit Enter"
            className="resize-none bg-white border-black/10 focus:border-black text-black placeholder:text-black/50 text-sm min-h-[44px] py-3 px-4 dark:bg-black dark:text-white dark:border-white/10 dark:focus:border-white"
            rows={1}
            disabled={isStreaming}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  className="bg-black text-white hover:bg-black/90 h-11 w-11 flex-shrink-0 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  size="icon"
                  disabled={
                    (!inputText.trim() && selectedFiles.length === 0) ||
                    credits <= 0 ||
                    isStreaming
                  }
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getTooltipContent()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </div>
  );
}
