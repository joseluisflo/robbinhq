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
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.parse(raw));
  }
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
    agentsUpserted: 0,
    textsUpserted: 0,
    filesUpserted: 0,
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
      console.warn(`[backfill] Skipping user ${legacyUserId}: no legacyIdentityLink found.`);
      continue;
    }

    const agentsSnapshot = await userDoc.ref.collection("agents").get();

    for (const agentDoc of agentsSnapshot.docs) {
      const data = agentDoc.data();

      await prisma.agent.upsert({
        where: { id: agentDoc.id },
        update: {
          ownerUserId: link.authUserId,
          legacyOwnerId: legacyUserId,
          name: data.name ?? "Untitled Agent",
          description: data.description ?? "",
          instructions: data.instructions ?? null,
          status: data.status ?? "idle",
          temperature: typeof data.temperature === "number" ? data.temperature : null,
          welcomeMessage: data.welcomeMessage ?? null,
          inCallWelcomeMessage: data.inCallWelcomeMessage ?? null,
          isWelcomeMessageEnabled:
            typeof data.isWelcomeMessageEnabled === "boolean" ? data.isWelcomeMessageEnabled : null,
          isDisplayNameEnabled:
            typeof data.isDisplayNameEnabled === "boolean" ? data.isDisplayNameEnabled : null,
          logoUrl: data.logoUrl ?? null,
          themeColor: data.themeColor ?? null,
          chatButtonColor: data.chatButtonColor ?? null,
          chatBubbleAlignment: data.chatBubbleAlignment ?? null,
          chatInputPlaceholder: data.chatInputPlaceholder ?? null,
          isFeedbackEnabled:
            typeof data.isFeedbackEnabled === "boolean" ? data.isFeedbackEnabled : null,
          isBargeInEnabled:
            typeof data.isBargeInEnabled === "boolean" ? data.isBargeInEnabled : null,
          isBrandingEnabled:
            typeof data.isBrandingEnabled === "boolean" ? data.isBrandingEnabled : null,
          agentVoice: data.agentVoice ?? null,
          emailSignature: data.emailSignature ?? null,
          handoffEmail: data.handoffEmail ?? null,
          conversationStarters: data.conversationStarters ?? [],
          goals: data.goals ?? [],
          tasks: data.tasks ?? [],
          rateLimiting: jsonOrNull(data.rateLimiting),
          orbColors: jsonOrNull(data.orbColors),
          phoneConfig: jsonOrNull(data.phoneConfig),
          createdAt: toDate(data.createdAt) ?? new Date(),
          lastModified: toDate(data.lastModified) ?? null,
          updatedAt: toDate(data.lastModified) ?? toDate(data.createdAt) ?? new Date(),
          deletedAt: null,
        },
        create: {
          id: agentDoc.id,
          ownerUserId: link.authUserId,
          legacyOwnerId: legacyUserId,
          name: data.name ?? "Untitled Agent",
          description: data.description ?? "",
          instructions: data.instructions ?? null,
          status: data.status ?? "idle",
          temperature: typeof data.temperature === "number" ? data.temperature : null,
          welcomeMessage: data.welcomeMessage ?? null,
          inCallWelcomeMessage: data.inCallWelcomeMessage ?? null,
          isWelcomeMessageEnabled:
            typeof data.isWelcomeMessageEnabled === "boolean" ? data.isWelcomeMessageEnabled : null,
          isDisplayNameEnabled:
            typeof data.isDisplayNameEnabled === "boolean" ? data.isDisplayNameEnabled : null,
          logoUrl: data.logoUrl ?? null,
          themeColor: data.themeColor ?? null,
          chatButtonColor: data.chatButtonColor ?? null,
          chatBubbleAlignment: data.chatBubbleAlignment ?? null,
          chatInputPlaceholder: data.chatInputPlaceholder ?? null,
          isFeedbackEnabled:
            typeof data.isFeedbackEnabled === "boolean" ? data.isFeedbackEnabled : null,
          isBargeInEnabled:
            typeof data.isBargeInEnabled === "boolean" ? data.isBargeInEnabled : null,
          isBrandingEnabled:
            typeof data.isBrandingEnabled === "boolean" ? data.isBrandingEnabled : null,
          agentVoice: data.agentVoice ?? null,
          emailSignature: data.emailSignature ?? null,
          handoffEmail: data.handoffEmail ?? null,
          conversationStarters: data.conversationStarters ?? [],
          goals: data.goals ?? [],
          tasks: data.tasks ?? [],
          rateLimiting: jsonOrNull(data.rateLimiting),
          orbColors: jsonOrNull(data.orbColors),
          phoneConfig: jsonOrNull(data.phoneConfig),
          createdAt: toDate(data.createdAt) ?? new Date(),
          lastModified: toDate(data.lastModified) ?? null,
          updatedAt: toDate(data.lastModified) ?? toDate(data.createdAt) ?? new Date(),
        },
      });

      summary.agentsUpserted += 1;

      const textsSnapshot = await agentDoc.ref.collection("texts").get();
      for (const textDoc of textsSnapshot.docs) {
        const text = textDoc.data();

        await prisma.agentText.upsert({
          where: { id: textDoc.id },
          update: {
            agentId: agentDoc.id,
            title: text.title ?? "Untitled Text",
            content: text.content ?? "",
            createdAt: toDate(text.createdAt) ?? new Date(),
          },
          create: {
            id: textDoc.id,
            agentId: agentDoc.id,
            title: text.title ?? "Untitled Text",
            content: text.content ?? "",
            createdAt: toDate(text.createdAt) ?? new Date(),
          },
        });

        summary.textsUpserted += 1;
      }

      const filesSnapshot = await agentDoc.ref.collection("files").get();
      for (const fileDoc of filesSnapshot.docs) {
        const file = fileDoc.data();

        await prisma.agentFile.upsert({
          where: { id: fileDoc.id },
          update: {
            agentId: agentDoc.id,
            name: file.name ?? "Untitled File",
            type: file.type ?? "application/octet-stream",
            size: typeof file.size === "number" ? file.size : 0,
            url: file.url ?? "",
            storagePath: file.storagePath ?? "",
            extractedText: file.extractedText ?? null,
            createdAt: toDate(file.createdAt) ?? new Date(),
          },
          create: {
            id: fileDoc.id,
            agentId: agentDoc.id,
            name: file.name ?? "Untitled File",
            type: file.type ?? "application/octet-stream",
            size: typeof file.size === "number" ? file.size : 0,
            url: file.url ?? "",
            storagePath: file.storagePath ?? "",
            extractedText: file.extractedText ?? null,
            createdAt: toDate(file.createdAt) ?? new Date(),
          },
        });

        summary.filesUpserted += 1;
      }
    }
  }

  console.log("[backfill] Completed:", JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error("[backfill] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (admin.apps.length) {
      await Promise.all(admin.apps.map((app) => app.delete()));
    }
  });
