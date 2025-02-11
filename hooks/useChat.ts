// useChat.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Message, MessageFeedback } from "../types/chat";

export function useChat({
  initialMessages = [],
  onError,
}: {
  initialMessages?: Message[];
  onError?: (error: Error) => void;
} = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [credits, setCredits] = useState(5);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!inputText.trim() || isStreaming) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputText.trim(),
        role: "user",
        timestamp: Date.now(),
      };

      try {
        setIsStreaming(true);
        setMessages((prev) => [...prev, userMessage]);
        setInputText("");
        setError(null);

        const formData = new FormData();
        formData.append("message", userMessage.content);
        formData.append("sessionId", crypto.randomUUID());

        const response = await fetch("/api/chat", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const assistantMessageId = Date.now().toString();
        let fullContent = "";

        // Create initial assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            content: "",
            role: "assistant",
            timestamp: Date.now(),
          },
        ]);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response reader available");

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content === "[DONE]") continue;

                fullContent += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
          }
        }
      } catch (err) {
        const error = err as Error;
        console.error("Chat error:", error);
        setError(error);
        if (onError) onError(error);
      } finally {
        setIsStreaming(false);
      }
    },
    [inputText, isStreaming, onError]
  );

  const handleFeedback = useCallback(
    (messageId: string, type: "like" | "dislike") => {
      setMessages((prev) =>
        prev.map((message) => {
          if (message.id === messageId) {
            return {
              ...message,
              feedback: {
                liked: type === "like" ? true : false,
                disliked: type === "dislike" ? true : false,
              },
            };
          }
          return message;
        })
      );
    },
    []
  );

  const handleEditMessage = useCallback(
    (messageId: string, newContent: string) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, content: newContent }
            : message
        )
      );
    },
    []
  );

  return {
    messages,
    inputText,
    setInputText,
    isStreaming,
    error,
    credits,
    handleFeedback,
    handleEditMessage,
    handleFormSubmit,
    messageContainerRef,
  };
}
