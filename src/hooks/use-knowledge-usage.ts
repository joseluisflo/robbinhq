'use client';

import { useMemo } from 'react';
import type { TextSource, AgentFile, userProfile } from '@/lib/types';

const PLAN_LIMITS_KB = {
  free: 400, // 400 KB
  essential: 40 * 1024, // 40 MB
  pro: 40 * 1024, // 40 MB
};

export function useKnowledgeUsage(
  textSources: TextSource[] | null,
  fileSources: AgentFile[] | null,
  userProfile: userProfile | null
) {
  const currentUsageKB = useMemo(() => {
    if (!textSources && !fileSources) return 0;

    const textSizeInBytes =
      textSources?.reduce((acc, text) => {
        // Approximate size of string in bytes (UTF-8 can be 1-4 bytes per char, we'll use a rough average)
        return acc + new Blob([text.content]).size;
      }, 0) || 0;

    const fileSizeInBytes =
      fileSources?.reduce((acc, file) => acc + (file.size || 0), 0) || 0;

    return (textSizeInBytes + fileSizeInBytes) / 1024;
  }, [textSources, fileSources]);

  const planId = userProfile?.planId || 'free';
  const usageLimitKB = PLAN_LIMITS_KB[planId] || PLAN_LIMITS_KB.free;

  const isLimitReached = currentUsageKB >= usageLimitKB;

  return {
    currentUsageKB,
    usageLimitKB,
    isLimitReached,
    usagePercentage: (currentUsageKB / usageLimitKB) * 100,
  };
}
