export interface VectorDBData {
  status: string;
  documents: string[];
  namespace: string;
  documentCount: number;
}

export interface KnowledgeBaseFile {
  url: string;
  file: Record<string, unknown>;
  name: string;
  size: number;
  type: string;
}

export interface AgentIcon {
  url: string;
  file: Record<string, unknown>;
  name: string;
  size: number;
  type: string;
}

export interface CreationProgress {
  state: string;
  total: number;
  current: number;
  message: string;
  updated_at: string;
}

export interface AgentData {
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
