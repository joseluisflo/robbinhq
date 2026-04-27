import "dotenv/config";
import * as admin from "firebase-admin";
import prisma from "../src/lib/prisma";

type FirestoreTimestampLike = {
  toDate?: () => Date;
  _seconds?: number;
  _nanoseconds?: number;
};

function parseServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is required.");
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    if (typeof parsed === "string") {
      return JSON.parse(parsed);
    }
  } catch {
    // Fall through to normalization below.
  }

  const normalized = raw
    .replace(/^"|"$/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n");

  return JSON.parse(normalized);
}

function toDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  if (typeof value === "object") {
    const candidate = value as FirestoreTimestampLike;
    if (typeof candidate.toDate === "function") {
      return candidate.toDate();
    }
    if (typeof candidate._seconds === "number") {
      return new Date(
        candidate._seconds * 1000 + Math.floor((candidate._nanoseconds ?? 0) / 1_000_000)
      );
    }
  }

  return undefined;
}

function jsonOrNull(value: unknown) {
  return value ?? null;
}

async function main() {
  const serviceAccount = parseServiceAccountFromEnv();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const firestore = admin.firestore();
  const usersSnapshot = await firestore.collection("users").get();

  const summary = {
    usersScanned: usersSnapshot.size,
    sessionsUpserted: 0,
    messagesUpserted: 0,
    feedbackUpserted: 0,
    skippedUsers: 0,
  };

  for (const userDoc of usersSnapshot.docs) {
    const legacyUserId = userDoc.id;

    const link = await prisma.legacyIdentityLink.findUnique({
      where: { legacyUserId },
      select: { authUserId: true },
    });

    if (!link?.authUserId) {
      summary.skippedUsers += 1;
      console.warn(`[backfill:chat] Skipping user ${legacyUserId}: no legacyIdentityLink found.`);
      continue;
    }

    const agentsSnapshot = await userDoc.ref.collection("agents").get();

    for (const agentDoc of agentsSnapshot.docs) {
      const sessionsSnapshot = await agentDoc.ref.collection("sessions").get();
      for (const sessionDoc of sessionsSnapshot.docs) {
        const session = sessionDoc.data();

        await prisma.chatSession.upsert({
          where: { id: sessionDoc.id },
          update: {
            agentId: agentDoc.id,
            ownerUserId: link.authUserId,
            legacyOwnerId: legacyUserId,
            title: session.title ?? "Untitled Session",
            lastMessageSnippet: session.lastMessageSnippet ?? "",
            createdAt: toDate(session.createdAt) ?? new Date(),
            lastActivity: toDate(session.lastActivity) ?? toDate(session.createdAt) ?? new Date(),
            lastLeadAnalysisAt: toDate(session.lastLeadAnalysisAt) ?? null,
            visitorInfo: jsonOrNull(session.visitorInfo),
            source: "chat",
            deletedAt: null,
          },
          create: {
            id: sessionDoc.id,
            agentId: agentDoc.id,
            ownerUserId: link.authUserId,
            legacyOwnerId: legacyUserId,
            title: session.title ?? "Untitled Session",
            lastMessageSnippet: session.lastMessageSnippet ?? "",
            createdAt: toDate(session.createdAt) ?? new Date(),
            lastActivity: toDate(session.lastActivity) ?? toDate(session.createdAt) ?? new Date(),
            lastLeadAnalysisAt: toDate(session.lastLeadAnalysisAt) ?? null,
            visitorInfo: jsonOrNull(session.visitorInfo),
            source: "chat",
          },
        });

        summary.sessionsUpserted += 1;

        const messagesSnapshot = await sessionDoc.ref.collection("messages").get();
        for (const messageDoc of messagesSnapshot.docs) {
          const message = messageDoc.data();

          await prisma.chatMessage.upsert({
            where: { id: messageDoc.id },
            update: {
              sessionId: sessionDoc.id,
              sender: message.sender ?? "agent",
              text: message.text ?? "",
              timestamp: toDate(message.timestamp) ?? new Date(),
              options: Array.isArray(message.options) ? message.options : null,
            },
            create: {
              id: messageDoc.id,
              sessionId: sessionDoc.id,
              sender: message.sender ?? "agent",
              text: message.text ?? "",
              timestamp: toDate(message.timestamp) ?? new Date(),
              options: Array.isArray(message.options) ? message.options : null,
            },
          });

          summary.messagesUpserted += 1;
        }
      }

      const feedbackSnapshot = await agentDoc.ref.collection("feedback").get();
      for (const feedbackDoc of feedbackSnapshot.docs) {
        const feedback = feedbackDoc.data();
        const sessionId = typeof feedback.sessionId === "string" ? feedback.sessionId : null;

        if (!sessionId) {
          console.warn(
            `[backfill:chat] Skipping feedback ${feedbackDoc.id} for agent ${agentDoc.id}: missing sessionId.`
          );
          continue;
        }

        const sessionExists = await prisma.chatSession.findUnique({
          where: { id: sessionId },
          select: { id: true },
        });

        if (!sessionExists) {
          console.warn(
            `[backfill:chat] Skipping feedback ${feedbackDoc.id} for agent ${agentDoc.id}: session ${sessionId} not found in Postgres.`
          );
          continue;
        }

        await prisma.messageFeedback.upsert({
          where: { id: feedbackDoc.id },
          update: {
            agentId: agentDoc.id,
            ownerUserId: link.authUserId,
            legacyOwnerId: legacyUserId,
            sessionId,
            messageId: feedback.messageId ?? "",
            rating: feedback.rating ?? "positive",
            comment: feedback.comment ?? null,
            createdAt: toDate(feedback.timestamp) ?? new Date(),
          },
          create: {
            id: feedbackDoc.id,
            agentId: agentDoc.id,
            ownerUserId: link.authUserId,
            legacyOwnerId: legacyUserId,
            sessionId,
            messageId: feedback.messageId ?? "",
            rating: feedback.rating ?? "positive",
            comment: feedback.comment ?? null,
            createdAt: toDate(feedback.timestamp) ?? new Date(),
          },
        });

        summary.feedbackUpserted += 1;
      }
    }
  }

  console.log("[backfill:chat] Completed:", JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error("[backfill:chat] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (admin.apps.length) {
      await Promise.all(admin.apps.map((app) => app.delete()));
    }
  });
