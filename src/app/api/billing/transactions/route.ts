import { NextResponse } from "next/server";
import { AuthenticationError, getCurrentAuthUserId } from "@/lib/auth/session";
import { listCreditTransactionsByUserId } from "@/lib/data/credits";

export async function GET() {
  try {
    const authUserId = await getCurrentAuthUserId();
    const transactions = await listCreditTransactionsByUserId(authUserId);

    return NextResponse.json({ transactions });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to load billing transactions:", error);
    return NextResponse.json({ error: "Failed to load billing transactions." }, { status: 500 });
  }
}
