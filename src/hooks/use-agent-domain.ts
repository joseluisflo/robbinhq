'use client';

import { useEffect, useState } from 'react';
import type { Agent, AgentFile, ChatMessage, ChatSession, Lead, MessageFeedback, TextSource } from '@/lib/types';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

const AGENTS_CHANGED_EVENT = 'agent-domain:agents-changed';

function agentTextsChangedEvent(agentId: string) {
  return `agent-domain:texts-changed:${agentId}`;
}

function agentFilesChangedEvent(agentId: string) {
  return `agent-domain:files-changed:${agentId}`;
}

function agentChatSessionsChangedEvent(agentId: string) {
  return `agent-domain:chat-sessions-changed:${agentId}`;
}

function agentSessionMessagesChangedEvent(agentId: string, sessionId: string) {
  return `agent-domain:session-messages-changed:${agentId}:${sessionId}`;
}

function agentFeedbackChangedEvent(agentId: string) {
  return `agent-domain:feedback-changed:${agentId}`;
}

function agentLeadsChangedEvent(agentId: string) {
  return `agent-domain:leads-changed:${agentId}`;
}

function agentDashboardChangedEvent(agentId: string) {
  return `agent-domain:dashboard-changed:${agentId}`;
}

export type DashboardTimeRange = '7d' | '30d' | '90d';

export type AgentDashboardStats = {
  range: DashboardTimeRange;
  statCards: {
    totalInteractions: number;
    interactionDelta: number;
    timeSavedInHours: number;
    timeSavedDelta: number;
    immediateResponsesPercent: number;
    immediateResponsesDelta: number;
  };
  leadsOverview: {
    totalLeads: number;
    newLeads: number;
    returningLeads: number;
    newPercent: number;
    returningPercent: number;
    topSource: string;
  };
  interactionSeries: Array<{
    date: string;
    total: number;
    widget: number;
    email: number;
    phone: number;
  }>;
};

export function notifyAgentsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AGENTS_CHANGED_EVENT));
  }
}

export function notifyAgentTextsChanged(agentId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(agentTextsChangedEvent(agentId)));
  }
}

export function notifyAgentFilesChanged(agentId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(agentFilesChangedEvent(agentId)));
  }
}

export function notifyAgentChatSessionsChanged(agentId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(agentChatSessionsChangedEvent(agentId)));
  }
}

export function notifyAgentSessionMessagesChanged(agentId: string, sessionId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(agentSessionMessagesChangedEvent(agentId, sessionId)));
  }
}

export function notifyAgentFeedbackChanged(agentId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(agentFeedbackChangedEvent(agentId)));
  }
}

export function notifyAgentLeadsChanged(agentId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(agentLeadsChangedEvent(agentId)));
  }
}

export function notifyAgentDashboardChanged(agentId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(agentDashboardChangedEvent(agentId)));
  }
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJson<{ agents: Agent[] }>('/api/agents');
        if (!cancelled) {
          setAgents(data.agents || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load agents.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const handleRefresh = () => {
      void load();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(AGENTS_CHANGED_EVENT, handleRefresh);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(AGENTS_CHANGED_EVENT, handleRefresh);
      }
    };
  }, []);

  return { agents, setAgents, loading, error };
}

export function useAgentTexts(agentId: string | undefined) {
  const [texts, setTexts] = useState<TextSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setTexts([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJson<{ texts: TextSource[] }>(`/api/agents/${agentId}/texts`);
        if (!cancelled) {
          setTexts(data.texts || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load texts.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const eventName = agentTextsChangedEvent(agentId);
    const handleRefresh = () => {
      void load();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(eventName, handleRefresh);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(eventName, handleRefresh);
      }
    };
  }, [agentId]);

  return { texts, setTexts, loading, error };
}

export function useAgentFiles(agentId: string | undefined) {
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setFiles([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJson<{ files: AgentFile[] }>(`/api/agents/${agentId}/files`);
        if (!cancelled) {
          setFiles(data.files || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load files.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const eventName = agentFilesChangedEvent(agentId);
    const handleRefresh = () => {
      void load();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(eventName, handleRefresh);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(eventName, handleRefresh);
      }
    };
  }, [agentId]);

  return { files, setFiles, loading, error };
}

export function useAgentChatSessions(agentId: string | undefined) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setSessions([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJson<{ sessions: ChatSession[] }>(`/api/agents/${agentId}/chat-sessions`);
        if (!cancelled) {
          setSessions(data.sessions || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load chat sessions.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const eventName = agentChatSessionsChangedEvent(agentId);
    const handleRefresh = () => {
      void load();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(eventName, handleRefresh);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(eventName, handleRefresh);
      }
    };
  }, [agentId]);

  return { sessions, setSessions, loading, error };
}

export function useAgentSessionMessages(agentId: string | undefined, sessionId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId || !sessionId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJson<{ messages: ChatMessage[] }>(
          `/api/agents/${agentId}/chat-sessions/${sessionId}/messages`
        );
        if (!cancelled) {
          setMessages(data.messages || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load messages.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const eventName = agentSessionMessagesChangedEvent(agentId, sessionId);
    const handleRefresh = () => {
      void load();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(eventName, handleRefresh);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(eventName, handleRefresh);
      }
    };
  }, [agentId, sessionId]);

  return { messages, setMessages, loading, error };
}

export function useAgentFeedback(agentId: string | undefined) {
  const [feedback, setFeedback] = useState<MessageFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setFeedback([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJson<{ feedback: MessageFeedback[] }>(`/api/agents/${agentId}/feedback`);
        if (!cancelled) {
          setFeedback(data.feedback || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load feedback.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const eventName = agentFeedbackChangedEvent(agentId);
    const handleRefresh = () => {
      void load();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(eventName, handleRefresh);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(eventName, handleRefresh);
      }
    };
  }, [agentId]);

  return { feedback, setFeedback, loading, error };
}

export function useAgentLeads(agentId: string | undefined) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setLeads([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJson<{ leads: Lead[] }>(`/api/agents/${agentId}/leads`);
        if (!cancelled) {
          setLeads(data.leads || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load leads.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const eventName = agentLeadsChangedEvent(agentId);
    const handleRefresh = () => {
      void load();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(eventName, handleRefresh);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(eventName, handleRefresh);
      }
    };
  }, [agentId]);

  return { leads, setLeads, loading, error };
}

export function useAgentDashboardStats(agentId: string | undefined, range: DashboardTimeRange) {
  const [stats, setStats] = useState<AgentDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJson<AgentDashboardStats>(`/api/agents/${agentId}/dashboard?range=${range}`);
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard stats.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const eventName = agentDashboardChangedEvent(agentId);
    const handleRefresh = () => {
      void load();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(eventName, handleRefresh);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(eventName, handleRefresh);
      }
    };
  }, [agentId, range]);

  return { stats, setStats, loading, error };
}
