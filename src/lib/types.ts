

export type userProfile = {
  id?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  credits?: number;
  planId?: 'free' | 'essential' | 'pro';
  creditResetDate?: any;
  stripeCustomerId?: string;
  autoRechargeEnabled?: boolean;
  rechargeThreshold?: number;
  rechargeAmount?: number;
};

export type CreditTransaction = {
  id?: string;
  type: 'purchase' | 'deduction';
  amount: number;
  description: string;
  timestamp: any;
  metadata?: Record<string, any>;
};

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
  inCallWelcomeMessage?: string;
  isWelcomeMessageEnabled?: boolean;
  isDisplayNameEnabled?: boolean;
  logoUrl?: string;
  themeColor?: string;
  chatButtonColor?: string;
  chatBubbleAlignment?: 'left' | 'right';
  chatInputPlaceholder?: string;
  isFeedbackEnabled?: boolean;
  isBargeInEnabled?: boolean;
  isBrandingEnabled?: boolean;
  agentVoice?: string;
  orbColors?: {
    bg: string;
    c1: string;
    c2: string;
    c3: string;
  };
  emailSignature?: string;
  handoffEmail?: string;
  phoneConfig?: {
    phoneNumber: string;
    phoneSid: string;
  };
  // For passing to live agent
  textSources?: TextSource[];
  fileSources?: AgentFile[];
  dataRetentionPolicy?: '30' | '90' | '365' | 'forever';
  anonymizeData?: boolean;
};

export type MessageFeedback = {
  id?: string;
  rating: 'positive' | 'negative';
  comment?: string;
  messageId: string;
  sessionId: string;
  timestamp: any;
};

export type WorkflowBlock = {
  id: string;
  type: string;
  params: Record<string, any>;
};

// Add reactflow types
export type Node = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: any;
};

export type Edge = {
  id: string;
  source: string;
  target: string;
};


export type Workflow = {
  id?: string;
  name: string;
  status?: 'enabled' | 'disabled';
  lastModified?: any;
  createdAt?: any;
  blocks?: WorkflowBlock[];
  nodes?: Node[];
  edges?: Edge[];
};

export type Lead = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  summary?: string;
  sessionId?: string;
  createdAt?: any;
  source?: 'Widget' | 'Email' | 'Phone';
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

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'closing' | 'error';

export type ChatSession = {
  id?: string;
  title: string;
  lastMessageSnippet: string;
  createdAt: any;
  lastActivity: any;
  lastLeadAnalysisAt?: any;
  visitorInfo?: {
    ip: string;
    userAgent: string;
    location?: {
      city: string | null;
      region: string | null;
      country: string | null;
    };
    browser?: {
      name: string | null;
      version: string | null;
    };
    os?: {
      name: string | null;
      version: string | null;
    };
    device?: {
      vendor: string | null;
      model: string | null;
      type: string | null;
    };
  }
}

export type ChatMessage = {
  id?: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: any;
  options?: string[];
};


export type WorkflowRun = {
  id: string;
  workflowId: string;
  status: 'running' | 'awaiting_input' | 'completed' | 'failed';
  context: Record<string, any>;
  currentStepIndex: number;
  promptForUser?: string;
};


export type EmailSession = {
  id?: string;
  subject: string;
  participants: string[];
  lastActivity: any;
  createdAt: any;
};

export type EmailMessage = {
  id?: string;
  messageId: string;
  sender: string;
  text: string;
  timestamp: any;
};

export type CombinedMessage = ChatMessage | EmailMessage;


export type InteractionLog = {
    id?: string;
    title: string;
    origin: 'Chat' | 'Email' | 'In-Call' | 'Phone';
    status: 'success' | 'error' | 'in-progress';
    timestamp: any;
    steps?: LogStep[];
    metadata?: Record<string, any>;
};

export type LogStep = {
    id?: string;
    description: string;
    timestamp: any;
    metadata?: Record<string, any>;
};

export type ConfigurationLog = {
    id?: string;
    title: string;
    description: string;
    timestamp: any;
    actor: string;
};

    
