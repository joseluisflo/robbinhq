
export type Task = {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: string;
  createdAt: string;
};

export type Agent = {
  id?: string;
  name: string;
  description: string;
  instructions?: string;
  goals: string[];
  status: 'idle' | 'working' | 'stopped';
  tasks: Task[];
  conversationStarters?: string[];
  temperature?: number;
  lastModified?: string;
  createdAt?: any;
  rateLimiting?: {
    maxMessages: number;
    timeframe: number;
    limitExceededMessage: string;
  };
  welcomeMessage?: string;
  isWelcomeMessageEnabled?: boolean;
  isDisplayNameEnabled?: boolean;
  logoUrl?: string;
  themeColor?: string;
  chatButtonColor?: string;
  chatInputPlaceholder?: string;
};

export type Workflow = {
  id: string;
  name: string;
  lastModified: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  chat: string;
};

export type TextSource = {
  id: string;
  title: string;
  content: string;
  createdAt: any;
};

export type AgentFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storagePath: string;
  createdAt: any;
  extractedText?: string;
};
