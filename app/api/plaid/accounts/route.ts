import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { plaidClient } from "@/lib/plaid";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get every Plaid connection belonging to this user.
    const plaidItems = await prisma.plaidItem.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (plaidItems.length === 0) {
      return NextResponse.json(
        { error: "No Plaid account connected" },
        { status: 404 }
      );
    }

    const banks = [];

    for (const plaidItem of plaidItems) {
      try {
        // Get the institution name for this specific Plaid Item.
        const itemResponse = await plaidClient.itemGet({
          access_token: plaidItem.accessToken,
        });

        const institutionName =
          itemResponse.data.item.institution_name ||
          "Connected Bank";

        // Get every account belonging to this specific bank connection.
        const accountsResponse = await plaidClient.accountsGet({
          access_token: plaidItem.accessToken,
        });

        const accounts = accountsResponse.data.accounts;

        for (const account of accounts) {
          await prisma.plaidAccount.upsert({
            where: {
              accountId: account.account_id,
            },
            update: {
              name: account.name,
              officialName: account.official_name,
              mask: account.mask,
              type: account.type,
              subtype: account.subtype,
              plaidItemId: plaidItem.id,
            },
            create: {
              accountId: account.account_id,
              name: account.name,
              officialName: account.official_name,
              mask: account.mask,
              type: account.type,
              subtype: account.subtype,
              plaidItemId: plaidItem.id,
            },
          });
        }

        banks.push({
          plaidItemId: plaidItem.id,
          itemId: plaidItem.itemId,
          institutionName,
          accounts: accounts.map((account) => ({
            accountId: account.account_id,
            name: account.name,
            officialName: account.official_name,
            mask: account.mask,
            type: account.type,
            subtype: account.subtype,
          })),
        });
      } catch (itemError) {
        console.error(
          `Plaid Item Error for ${plaidItem.itemId}:`,
          itemError
        );

        // Keep processing other connected banks even if one
        // Plaid connection has an issue.
        banks.push({
          plaidItemId: plaidItem.id,
          itemId: plaidItem.itemId,
          institutionName: "Connected Bank",
          accounts: [],
          error: "Unable to retrieve accounts from this connection",
        });
      }
    }

    const allAccounts = banks.flatMap((bank) =>
      bank.accounts.map((account) => ({
        ...account,
        plaidItemId: bank.plaidItemId,
        institutionName: bank.institutionName,
      }))
    );

    return NextResponse.json({
      success: true,
      banks,
      accounts: allAccounts,
    });
  } catch (error) {
    console.error("Plaid Accounts Error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve Plaid accounts" },
      { status: 500 }
    );
  }
}