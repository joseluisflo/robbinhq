import { NextResponse } from "next/server";
import { AuthenticationError, getCurrentAuthUserId } from "@/lib/auth/session";
import { getUserBillingProfile } from "@/lib/data/credits";

export async function GET() {
  try {
    const authUserId = await getCurrentAuthUserId();
    const profile = await getUserBillingProfile(authUserId);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to load user profile:", error);
    return NextResponse.json({ error: "Failed to load user profile." }, { status: 500 });
  }
}
