import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { plaidClient } from "@/lib/plaid";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: "IntelliSpend",
      products: ["transactions" as any],
      country_codes: ["US" as any],
      language: "en",
    });

    return NextResponse.json({
      link_token: response.data.link_token,
    });
  } catch (error) {
    console.error("Plaid Link Token Error:", error);

    return NextResponse.json(
      { error: "Failed to create Plaid Link token" },
      { status: 500 }
    );
  }
}
