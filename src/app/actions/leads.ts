'use server';

import { extractLeadFromConversation } from '@/ai/flows/lead-extraction-flow';
import { requireAgentOwnerRecord } from '@/lib/permissions';
import { listChatMessagesBySession, listChatSessionsByAgent } from '@/lib/data/chat';
import { createLeadRecord, deleteLeadsByAgent } from '@/lib/data/leads';
import prisma from '@/lib/prisma';


export async function analyzeSessionsForLeads(userId: string, agentId: string): Promise<{ success: boolean, leadsFound: number } | { error: string }> {
  if (!agentId) {
    return { error: 'User ID and Agent ID are required.' };
  }
  
  let leadsFound = 0;
  const analysisTime = new Date();

  try {
    const { authUserId, legacyUserId } = await requireAgentOwnerRecord(agentId);
    const sessions = await listChatSessionsByAgent(agentId);

    if (sessions.length === 0) {
      return { success: true, leadsFound: 0 };
    }
    
    const sessionsToAnalyze = sessions.filter((session) => {
      const lastActivity = session.lastActivity ? new Date(session.lastActivity as any) : null;
      const lastAnalysis = session.lastLeadAnalysisAt ? new Date(session.lastLeadAnalysisAt as any) : null;

      return !lastAnalysis || (lastActivity && lastActivity > lastAnalysis);
    });

    if (sessionsToAnalyze.length === 0) {
      return { success: true, leadsFound: 0 };
    }

    const analysisPromises = sessionsToAnalyze.map(async (session) => {
      const messages = await listChatMessagesBySession(agentId, session.id!);

      if (messages.length === 0) {
        await prisma.chatSession.update({
          where: { id: session.id! },
          data: { lastLeadAnalysisAt: analysisTime },
        });
        return;
      }

      const chatHistory = messages
        .map((msg) => {
          return `${msg.sender === 'user' ? 'User' : 'Agent'}: ${msg.text}`;
        })
        .join('\n');

      const extractionResult = await extractLeadFromConversation({ chatHistory });

      if (extractionResult.isLead) {
        await createLeadRecord({
          id: crypto.randomUUID(),
          agentId,
          ownerUserId: authUserId,
          legacyOwnerId: legacyUserId,
          name: extractionResult.name,
          email: extractionResult.email,
          phone: extractionResult.phone,
          summary: extractionResult.summary,
          sessionId: session.id!,
          createdAt: analysisTime,
          source: 'Widget',
        });
        leadsFound++;
      }

      await prisma.chatSession.update({
        where: { id: session.id! },
        data: { lastLeadAnalysisAt: analysisTime },
      });
    });

    await Promise.all(analysisPromises);

    return { success: true, leadsFound };

  } catch (e: any) {
    console.error('Failed to analyze sessions for leads:', e);
    return { error: e.message || 'An unknown error occurred during lead analysis.' };
  }
}

export async function deleteAgentLeads(userId: string, agentId: string): Promise<{ success: boolean } | { error: string }> {
    if (!agentId) {
        return { error: 'User ID and Agent ID are required.' };
    }

    try {
        await requireAgentOwnerRecord(agentId);
        await deleteLeadsByAgent(agentId);
        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete leads:', e);
        return { error: e.message || 'An unknown error occurred while deleting leads.' };
    }
}
