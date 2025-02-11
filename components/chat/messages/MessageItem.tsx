import React, { useState } from "react";
import { Message } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  PencilIcon,
  File,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight, themes } from "prism-react-renderer";
import PricingCards from "@/components/PricingCards";

interface MessageItemProps {
  message: Message;
  onFeedback?: (messageId: string, type: "like" | "dislike") => void;
  onEdit?: (messageId: string, content: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onFeedback,
  onEdit,
}) => {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  if (message.isPricing) {
    return <PricingCards />;
  }

  return (
    <Card
      className={cn(
        "p-4 border border-black/10",
        message.role === "assistant" ? "bg-white" : "bg-black text-white"
      )}
    >
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm font-bold",
              message.role === "assistant" ? "text-black" : "text-white"
            )}
          >
            {message.role === "assistant" ? "AI Assistant" : "You"}
          </span>

          {message.files && message.files.length > 0 && (
            <div className="flex flex-1 justify-center flex-wrap gap-2">
              {message.files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-2 bg-white rounded-lg p-1 border-white border-2"
                >
                  <File className="h-3 w-3 text-black" />
                  <span className="text-xs text-black">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          {message.role === "user" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 hover:bg-white/10 text-white hover:text-white"
                  onClick={() => onEdit?.(message.id, message.content)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit message</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className={cn(
            "prose prose-sm max-w-none break-words",
            message.role === "assistant" ? "text-black" : "text-white"
          )}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "text";
              return !inline && match ? (
                <Highlight
                  theme={
                    message.role === "assistant"
                      ? themes.github
                      : themes.dracula
                  }
                  code={String(children).replace(/\n$/, "")}
                  language={language}
                >
                  {({
                    className,
                    style,
                    tokens,
                    getLineProps,
                    getTokenProps,
                  }) => (
                    <pre
                      className={className}
                      style={{
                        ...style,
                        backgroundColor: "transparent",
                        padding: "1rem",
                        margin: "0.5rem 0",
                        borderRadius: "0.375rem",
                      }}
                    >
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>

        {message.role === "assistant" && (
          <div className="flex items-center gap-2 mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 hover:bg-black/5",
                    message.feedback?.liked
                      ? "bg-black text-white"
                      : "text-black"
                  )}
                  onClick={() => onFeedback?.(message.id, "like")}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Good response</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 hover:bg-black/5",
                    message.feedback?.disliked
                      ? "bg-black text-white"
                      : "text-black"
                  )}
                  onClick={() => onFeedback?.(message.id, "dislike")}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bad response</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 hover:bg-black/5",
                    copiedMessageId === message.id
                      ? "bg-black text-white"
                      : "text-black"
                  )}
                  onClick={() => copyToClipboard(message.content, message.id)}
                >
                  {copiedMessageId === message.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {copiedMessageId === message.id ? "Copied!" : "Copy message"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </Card>
  );
};
