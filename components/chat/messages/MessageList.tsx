// /app/components/chat/messages/MessageList.tsx
import React from "react";
import { Message } from "@/types/chat";
import { MessageItem } from "./MessageItem";
import QuickStartCards from "@/components/QuickStartCards";
import PricingCards from "@/components/PricingCards";
import { Card } from "@/components/ui/card";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onFeedback?: (messageId: string, type: "like" | "dislike") => void;
  onEdit?: (messageId: string, content: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onFeedback,
  onEdit,
}) => {
  if (messages.length === 0) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <QuickStartCards onQuestionSelect={() => {}} />
      </div>
    );
  }

  // Check if there's only one message and it's a pricing message
  const isOnlyPricingMessage = messages.length === 1 && messages[0].isPricing;

  if (isOnlyPricingMessage) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <Card className="p-4 border border-black/10 bg-white w-full">
            <PricingCards />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onFeedback={onFeedback}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default MessageList;
