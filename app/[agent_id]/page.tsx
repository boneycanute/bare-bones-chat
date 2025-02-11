"use client";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useChat } from "@/hooks/useChat";
import { ChatHeader } from "@/components/chat/header/ChatHeader";
import MessageList from "@/components/chat/messages/MessageList";
import { ChatInput } from "@/components/chat/input/ChatInput";
import ErrorAlert from "@/components/chat/status/ErrorAlert";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface VectorDBData {
  status: string;
  documents: string[];
  namespace: string;
  documentCount: number;
}

interface KnowledgeBaseFile {
  url: string;
  file: Record<string, unknown>;
  name: string;
  size: number;
  type: string;
}

interface AgentIcon {
  url: string;
  file: Record<string, unknown>;
  name: string;
  size: number;
  type: string;
}

interface CreationProgress {
  state: string;
  total: number;
  current: number;
  message: string;
  updated_at: string;
}

interface AgentData {
  id: string;
  status: string;
  vector_db_data: VectorDBData;
  deployed_link: string | null;
  user_id: string;
  agent_name: string;
  description: string;
  primary_model: string;
  fallback_model: string;
  system_prompt: string;
  knowledge_base: {
    files: KnowledgeBaseFile[];
  };
  agent_icon: AgentIcon;
  user_message_color: string;
  agent_message_color: string;
  opening_message: string;
  quick_messages: string[];
  vector_db_config: VectorDBData;
  document_urls: string[];
  creation_progress: CreationProgress;
  is_paid: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  agent_id: string;
}

interface ChatUIProps {
  params: {
    agent_id: string;
  };
}

const ChatUI = ({ params }: ChatUIProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [agentData, setAgentData] = useState<AgentData | null | undefined>(
    null
  );
  const {
    messages,
    isStreaming,
    credits,
    messageContainerRef,
    handleFeedback,
    handleEditMessage,
    handleFormSubmit,
    inputText,
    setInputText,
  } = useChat({ agentData: agentData || undefined });

  useEffect(() => {
    const initializeAgent = async () => {
      try {
        console.log("Agent ID:", params.agent_id);
        // First try to fetch by agent_id field
        const { data } = await supabase
          .from("agents")
          .select("*")
          .eq("agent_id", params.agent_id)
          .single();

        console.log("Fetched agent data:", data);

        if (data) {
          setAgentData(data as AgentData);
        } else {
          setAgentData(null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing agent:", error);
        setIsLoading(false);
        setAgentData(null);
        toast.error("Failed to initialize agent");
      }
    };

    initializeAgent();
  }, [params.agent_id]);

  const handleUpgradeClick = () => {
    const syntheticEvent = new Event("submit") as unknown as React.FormEvent;
    handleFormSubmit(syntheticEvent);
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isPricing && credits <= 0) {
      toast.error("You've run out of credits", {
        description: "Please upgrade to continue chatting",
        duration: 5000,
      });
    }
  }, [messages, credits]);

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading chat...
        </p>
      </div>
    );
  }

  if (!agentData) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Agent not found</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[100dvh] relative dark:bg-black">
        <ChatHeader credits={credits} onUpgradeClick={handleUpgradeClick} />

        <ScrollArea className="flex-1 p-4 flex items-center justify-center">
          <div className="max-w-3xl w-full mx-auto" ref={messageContainerRef}>
            <MessageList
              messages={messages}
              isLoading={isStreaming}
              onFeedback={handleFeedback}
              onEdit={handleEditMessage}
            />
          </div>
        </ScrollArea>

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          isStreaming={isStreaming}
          onSubmit={handleFormSubmit}
          credits={credits}
        />
      </div>
    </TooltipProvider>
  );
};

export default ChatUI;
