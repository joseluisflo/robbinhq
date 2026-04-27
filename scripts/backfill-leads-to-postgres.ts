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
  if (!value) return undefined;
  if (value instanceof Date) return value;

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
    leadsUpserted: 0,
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
      console.warn(`[backfill:leads] Skipping user ${legacyUserId}: no legacyIdentityLink found.`);
      continue;
    }

    const agentsSnapshot = await userDoc.ref.collection("agents").get();

    for (const agentDoc of agentsSnapshot.docs) {
      const leadsSnapshot = await agentDoc.ref.collection("leads").get();

      for (const leadDoc of leadsSnapshot.docs) {
        const lead = leadDoc.data();

        await prisma.lead.upsert({
          where: { id: leadDoc.id },
          update: {
            agentId: agentDoc.id,
            ownerUserId: link.authUserId,
            legacyOwnerId: legacyUserId,
            sessionId: lead.sessionId ?? null,
            name: lead.name ?? null,
            email: lead.email ?? null,
            phone: lead.phone ?? null,
            summary: lead.summary ?? null,
            source: lead.source ?? null,
            createdAt: toDate(lead.createdAt) ?? new Date(),
          },
          create: {
            id: leadDoc.id,
            agentId: agentDoc.id,
            ownerUserId: link.authUserId,
            legacyOwnerId: legacyUserId,
            sessionId: lead.sessionId ?? null,
            name: lead.name ?? null,
            email: lead.email ?? null,
            phone: lead.phone ?? null,
            summary: lead.summary ?? null,
            source: lead.source ?? null,
            createdAt: toDate(lead.createdAt) ?? new Date(),
          },
        });

        summary.leadsUpserted += 1;
      }
    }
  }

  console.log("[backfill:leads] Completed:", JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error("[backfill:leads] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (admin.apps.length) {
      await Promise.all(admin.apps.map((app) => app.delete()));
    }
  });
