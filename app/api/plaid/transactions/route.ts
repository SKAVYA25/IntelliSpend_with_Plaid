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

    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;

    const syncedBanks = [];

    for (const plaidItem of plaidItems) {
      let cursor = plaidItem.syncCursor;

      /*
       * Recovery for an incomplete initial sync.
       *
       * If this Plaid Item already has a cursor but IntelliSpend
       * has no transactions saved for its accounts, the initial
       * transaction import may have been skipped or interrupted.
       *
       * In that case, start transactionsSync from the beginning
       * instead of asking Plaid only for changes after the cursor.
       */
      if (cursor) {
        const plaidAccounts = await prisma.plaidAccount.findMany({
          where: {
            plaidItemId: plaidItem.id,
          },
          select: {
            id: true,
          },
        });

        const plaidAccountIds = plaidAccounts.map(
          (account) => account.id
        );

        if (plaidAccountIds.length > 0) {
          const existingTransactionCount =
            await prisma.transaction.count({
              where: {
                userId,
                plaidAccountId: {
                  in: plaidAccountIds,
                },
              },
            });

          if (existingTransactionCount === 0) {
            console.log(
              `No transactions found for Plaid Item ${plaidItem.id}. Restarting initial Plaid transaction sync.`
            );

            cursor = null;

            await prisma.plaidItem.update({
              where: {
                id: plaidItem.id,
              },
              data: {
                syncCursor: null,
              },
            });
          }
        }
      }

      let hasMore = true;

      let bankAddedCount = 0;
      let bankModifiedCount = 0;
      let bankRemovedCount = 0;

      while (hasMore) {
        const response = await plaidClient.transactionsSync({
          access_token: plaidItem.accessToken,
          ...(cursor ? { cursor } : {}),
        });

        const {
          added,
          modified,
          removed,
          next_cursor,
          has_more,
        } = response.data;

        for (const transaction of added) {
          const account = await prisma.plaidAccount.findUnique({
            where: {
              accountId: transaction.account_id,
            },
          });

          if (!account) {
            console.warn(
              `Skipping Plaid transaction ${transaction.transaction_id}: account not found.`
            );

            continue;
          }

          // Make sure this account belongs to the Plaid Item
          // currently being synchronized.
          if (account.plaidItemId !== plaidItem.id) {
            console.warn(
              `Skipping Plaid transaction ${transaction.transaction_id}: account belongs to another Plaid Item.`
            );

            continue;
          }

          const amount = Number(transaction.amount);

          const plaidCategory =
            transaction.personal_finance_category?.primary ??
            "OTHER";

          const mapped = mapPlaidCategory(
            plaidCategory,
            transaction.merchant_name ?? transaction.name
          );

          await prisma.transaction.upsert({
            where: {
              plaidTransactionId: transaction.transaction_id,
            },
            update: {
              description:
                transaction.merchant_name ??
                transaction.name,
              amount: Math.abs(amount),
              type: amount < 0 ? "income" : "expense",
              category: mapped.category,
              subcategory: mapped.subcategory,
              date: new Date(transaction.date),
              source: "PLAID",
              plaidAccountId: account.id,
            },
            create: {
              description:
                transaction.merchant_name ??
                transaction.name,
              amount: Math.abs(amount),
              type: amount < 0 ? "income" : "expense",
              category: mapped.category,
              subcategory: mapped.subcategory,
              date: new Date(transaction.date),
              source: "PLAID",
              plaidTransactionId: transaction.transaction_id,
              userId,
              plaidAccountId: account.id,
            },
          });

          addedCount++;
          bankAddedCount++;
        }

        for (const transaction of modified) {
          const amount = Number(transaction.amount);

          const plaidCategory =
            transaction.personal_finance_category?.primary ??
            "OTHER";

          const mapped = mapPlaidCategory(
            plaidCategory,
            transaction.merchant_name ?? transaction.name
          );

          await prisma.transaction.updateMany({
            where: {
              plaidTransactionId: transaction.transaction_id,
              userId,
            },
            data: {
              description:
                transaction.merchant_name ??
                transaction.name,
              amount: Math.abs(amount),
              type: amount < 0 ? "income" : "expense",
              category: mapped.category,
              subcategory: mapped.subcategory,
              date: new Date(transaction.date),
            },
          });

          modifiedCount++;
          bankModifiedCount++;
        }

        for (const transaction of removed) {
          await prisma.transaction.deleteMany({
            where: {
              plaidTransactionId: transaction.transaction_id,
              userId,
            },
          });

          removedCount++;
          bankRemovedCount++;
        }

        cursor = next_cursor;
        hasMore = has_more;
      }

      // Save the latest cursor for this specific Plaid Item.
      await prisma.plaidItem.update({
        where: {
          id: plaidItem.id,
        },
        data: {
          syncCursor: cursor,
        },
      });

      syncedBanks.push({
        plaidItemId: plaidItem.id,
        added: bankAddedCount,
        modified: bankModifiedCount,
        removed: bankRemovedCount,
      });
    }

    console.log("Plaid transaction sync completed:", {
      added: addedCount,
      modified: modifiedCount,
      removed: removedCount,
    });

    return NextResponse.json({
      success: true,
      added: addedCount,
      modified: modifiedCount,
      removed: removedCount,
      banks: syncedBanks,
    });
  } catch (error) {
    console.error("Plaid Transactions Error:", error);

    return NextResponse.json(
      { error: "Failed to sync Plaid transactions" },
      { status: 500 }
    );
  }
}
