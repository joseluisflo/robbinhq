import { getRequiredSession, getViewerContext, getViewerContextFromHeaders } from "@/lib/auth/session";
import { getAgentById } from "@/lib/data/agents";

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAuthenticatedUser() {
  return getRequiredSession();
}

export async function requireLegacyUserContext() {
  const viewer = await getViewerContext();
  return requireLegacyViewerContext(viewer);
}

export async function requireLegacyUserContextFromHeaders(inputHeaders: Headers) {
  const viewer = await getViewerContextFromHeaders(inputHeaders);
  return requireLegacyViewerContext(viewer);
}

function requireLegacyViewerContext<T extends { legacyUserId: string | null }>(
  viewer: T
): T & { legacyUserId: string } {
  if (!viewer.legacyUserId) {
    throw new AuthorizationError(
      "Authenticated user is not linked to a legacy workspace yet."
    );
  }

  return viewer as T & { legacyUserId: string };
}

export async function requireAgentOwner(agentId: string) {
  if (!agentId) {
    throw new AuthorizationError("Agent ID is required.");
  }

  const viewer = await requireLegacyUserContext();
  const agent = await getAgentById(viewer.authUserId, agentId);

  if (!agent) {
    throw new AuthorizationError("Agent not found or not owned by current user.");
  }

  return {
    ...viewer,
    agent,
  };
}

export async function requireAgentOwnerFromHeaders(agentId: string, inputHeaders: Headers) {
  if (!agentId) {
    throw new AuthorizationError("Agent ID is required.");
  }

  const viewer = await requireLegacyUserContextFromHeaders(inputHeaders);
  const agent = await getAgentById(viewer.authUserId, agentId);

  if (!agent) {
    throw new AuthorizationError("Agent not found or not owned by current user.");
  }

  return {
    ...viewer,
    agent,
  };
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
