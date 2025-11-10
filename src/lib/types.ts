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
  goals: string[];
  status: 'idle' | 'working' | 'stopped';
  tasks: Task[];
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
