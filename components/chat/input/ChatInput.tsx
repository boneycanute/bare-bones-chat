import { ChangeEvent, KeyboardEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    if (!inputText.trim()) return "Type a message";
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
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] resize-none pr-12 scrollbar-hide"
            rows={1}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isStreaming || credits <= 0 || !inputText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{getTooltipContent()}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </div>
  );
}
