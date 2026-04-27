import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export class AuthenticationError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getSessionFromHeaders(inputHeaders: Headers) {
  return auth.api.getSession({
    headers: inputHeaders,
  });
}

export async function getRequiredSession() {
  const session = await getSession();

  if (!session) {
    throw new AuthenticationError();
  }

  return session;
}

export async function getCurrentAuthUserId() {
  const session = await getRequiredSession();
  return session.user.id;
}

export async function getCurrentLegacyUserId() {
  const authUserId = await getCurrentAuthUserId();
  const link = await prisma.legacyIdentityLink.findUnique({
    where: { authUserId },
    select: { legacyUserId: true },
  });

  return link?.legacyUserId ?? null;
}

export async function getViewerContext() {
  const session = await getRequiredSession();
  return getViewerContextFromSession(session);
}

export async function getViewerContextFromHeaders(inputHeaders: Headers) {
  const session = await getSessionFromHeaders(inputHeaders);

  if (!session) {
    throw new AuthenticationError();
  }

  return getViewerContextFromSession(session);
}

async function getViewerContextFromSession(session: Awaited<ReturnType<typeof getRequiredSession>>) {
  const link = await prisma.legacyIdentityLink.findUnique({
    where: { authUserId: session.user.id },
    select: { legacyUserId: true },
  });

  return {
    session,
    authUserId: session.user.id,
    legacyUserId: link?.legacyUserId ?? null,
  };
}
