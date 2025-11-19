import type { Workflow, Lead } from './types';

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
