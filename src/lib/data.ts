import type { Agent } from './types';

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
