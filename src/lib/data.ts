import type { Agent, Workflow, Lead } from './types';

export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Market Research Bot',
    description: 'An autonomous agent that scours the web for market trends and competitor analysis.',
    goals: [
      'Identify top 5 competitors in the SaaS marketing space.',
      'Summarize Q2 2024 earnings reports for Competitor A and B.',
      'Find 10 recent articles about AI in marketing.',
    ],
    status: 'idle',
    tasks: [
      {
        id: 'task-1-1',
        name: 'Analyze competitor pricing pages',
        status: 'completed',
        result: 'Competitor A uses a three-tiered model. Competitor B has usage-based pricing. Competitor C offers a free tier.',
        createdAt: '2024-07-28T10:00:00Z',
      },
      {
        id: 'task-1-2',
        name: 'Scrape news articles for "AI marketing trends"',
        status: 'in-progress',
        createdAt: '2024-07-29T11:30:00Z',
      },
    ],
  },
  {
    id: 'agent-2',
    name: 'Social Media Assistant',
    description: 'Generates and schedules social media posts across various platforms.',
    goals: [
      'Draft 5 tweets about our new feature launch.',
      'Find 3 relevant hashtags for LinkedIn posts.',
      'Schedule posts for the upcoming week.',
    ],
    status: 'working',
    tasks: [
      {
        id: 'task-2-1',
        name: 'Draft launch announcement tweets',
        status: 'completed',
        result: 'Drafts created: "Tweet 1...", "Tweet 2..."',
        createdAt: '2024-07-29T09:00:00Z',
      },
    ],
  },
  {
    id: 'agent-3',
    name: 'Code Reviewer',
    description: 'An agent that automatically reviews pull requests for common errors and style guide violations.',
    goals: [
      'Check for linting errors.',
      'Verify test coverage has not decreased.',
      'Suggest improvements for code readability.',
    ],
    status: 'stopped',
    tasks: [],
  },
];

export const mockWorkflows: Workflow[] = [
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding',
    lastModified: '2024-07-15T14:20:00Z',
  },
  {
    id: 'lead-qualification',
    name: 'Lead Qualification',
    lastModified: '2024-07-28T09:05:00Z',
  },
  {
    id: 'support-ticket-escalation',
    name: 'Support Ticket Escalation',
    lastModified: '2024-06-30T18:00:00Z',
  },
];

export const mockLeads: Lead[] = [
    {
      id: 'lead-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1-202-555-0104',
      chat: 'Website Widget',
    },
    {
      id: 'lead-2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phoneNumber: '+44-20-7946-0958',
      chat: 'Support Chat',
    },
    {
        id: 'lead-3',
        name: 'Carlos Garcia',
        email: 'carlos.garcia@example.com',
        phoneNumber: '+34-91-555-0123',
        chat: 'Sales Inquiry',
    },
    {
        id: 'lead-4',
        name: 'Aisha Khan',
        email: 'aisha.khan@example.com',
        phoneNumber: '+91-22-5555-0189',
        chat: 'Website Widget',
    }
];
