export interface MessageFeedback {
  messageId: string;
  rating: "positive" | "negative";
  text?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  feedback?: MessageFeedback;
  timestamp?: number;
  isPricing: boolean;
}
