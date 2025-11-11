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
  createdAt: string;
};
