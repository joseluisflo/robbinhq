'use client';

import { useEffect, useState } from 'react';
import type { Agent, AgentFile, TextSource } from '@/lib/types';

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
