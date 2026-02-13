
export type ChatMode = 'gemini' | 'perplexity' | 'grok';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  sources?: GroundingSource[];
  isStreaming?: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  title: string;
  mode: ChatMode;
}
