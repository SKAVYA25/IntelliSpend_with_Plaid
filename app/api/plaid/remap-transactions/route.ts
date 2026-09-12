import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { plaidClient } from "@/lib/plaid";
import { mapPlaidCategory } from "@/lib/plaid-category-mapping";

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

    const plaidItem = await prisma.plaidItem.findFirst({
      where: {
        userId,
      },
    });

    if (!plaidItem) {
      return NextResponse.json(
        { error: "No Plaid account connected" },
        { status: 404 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        source: "PLAID",
        plaidTransactionId: {
          not: null,
        },
      },
    });

    const plaidResponse = await plaidClient.transactionsGet({
      access_token: plaidItem.accessToken,
      start_date: "2020-01-01",
      end_date: "2030-01-01",
      options: {
        include_personal_finance_category: true,
        count: 100,
        offset: 0,
      },
    });

    const plaidTransactions = plaidResponse.data.transactions;

    const plaidTransactionMap = new Map(
      plaidTransactions.map((transaction) => [
        transaction.transaction_id,
        transaction,
      ])
    );

    let updatedCount = 0;

    for (const transaction of transactions) {
      if (!transaction.plaidTransactionId) {
        continue;
      }

      const plaidTransaction = plaidTransactionMap.get(
        transaction.plaidTransactionId
      );

      if (!plaidTransaction) {
        continue;
      }

      const mapped = mapPlaidCategory(
        plaidTransaction.personal_finance_category?.primary ?? "OTHER",
        plaidTransaction.merchant_name ?? plaidTransaction.name
      );

      await prisma.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          category: mapped.category,
          subcategory: mapped.subcategory,
        },
      });

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
    });
  } catch (error) {
    console.error("Plaid Transaction Remap Error:", error);

    return NextResponse.json(
      { error: "Failed to remap Plaid transactions" },
      { status: 500 }
    );
  }
}