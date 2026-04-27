import { NextResponse } from "next/server";
import { AuthenticationError, getCurrentAuthUserId } from "@/lib/auth/session";
import { listAgentsByOwnerUserId } from "@/lib/data/agents";

export async function GET() {
  try {
    const authUserId = await getCurrentAuthUserId();
    const agents = await listAgentsByOwnerUserId(authUserId);
    return NextResponse.json({ agents });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to load agents from Postgres:", error);
    return NextResponse.json({ error: "Failed to load agents." }, { status: 500 });
  }
}
