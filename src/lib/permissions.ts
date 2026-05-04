import { getViewerContext, getViewerContextFromHeaders } from "@/lib/auth/session";
import { getAgentById } from "@/lib/data/agents";

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAuthenticatedUser() {
  return getViewerContext();
}

export async function requireAgentOwnerRecord(agentId: string) {
  if (!agentId) {
    throw new AuthorizationError("Agent ID is required.");
  }

  const viewer = await getViewerContext();
  const agent = await getAgentById(viewer.authUserId, agentId);

  if (!agent) {
    throw new AuthorizationError("Agent not found or not owned by current user.");
  }

  return {
    ...viewer,
    agent,
  };
}

export async function requireAgentOwnerRecordFromHeaders(agentId: string, inputHeaders: Headers) {
  if (!agentId) {
    throw new AuthorizationError("Agent ID is required.");
  }

  const viewer = await getViewerContextFromHeaders(inputHeaders);
  const agent = await getAgentById(viewer.authUserId, agentId);

  if (!agent) {
    throw new AuthorizationError("Agent not found or not owned by current user.");
  }

  return {
    ...viewer,
    agent,
  };
}
