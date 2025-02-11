// /app/hooks/useChatActions.ts
import { useCallback } from "react";
import { useChat } from "./useChat";

export interface ChatActions {
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export const useChatActions = (): ChatActions => {
  const { setInputText, handleFormSubmit, isStreaming } = useChat();

  const sendMessage = useCallback(
    async (message: string) => {
      setInputText(message);
      const syntheticEvent = new Event("submit") as unknown as React.FormEvent;
      await handleFormSubmit(syntheticEvent);
    },
    [setInputText, handleFormSubmit]
  );

  return {
    sendMessage,
    isLoading: isStreaming,
  };
};
