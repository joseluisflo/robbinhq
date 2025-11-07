export type Task = {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: string;
  createdAt: string;
};

export type Agent = {
  id: string;
  name: string;
  description: string;
  goals: string[];
  status: 'idle' | 'working' | 'stopped';
  tasks: Task[];
};
