import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { plaidClient } from "@/lib/plaid";
import { mapPlaidCategory } from "@/lib/plaid-category-mapping";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const publicToken = body.public_token;

    if (!publicToken) {
      return NextResponse.json(
        { error: "Missing public_token" },
        { status: 400 }
      );
    }

    // Exchange Plaid public token for access token.
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Prevent the same Plaid Item from being connected twice.
    const existingItem = await prisma.plaidItem.findUnique({
      where: {
        itemId,
      },
    });

    if (existingItem) {
      return NextResponse.json({
        success: true,
        message: "Plaid account is already connected",
      });
    }

    // Get institution information.
    let institutionName: string | null = null;

    try {
      const itemResponse = await plaidClient.itemGet({
        access_token: accessToken,
      });

      institutionName =
        itemResponse.data.item.institution_name || null;
    } catch (error) {
      console.error(
        "Error retrieving Plaid institution:",
        error
      );
    }

    // Create the Plaid Item first.
    const plaidItem = await prisma.plaidItem.create({
      data: {
        itemId,
        accessToken,
        userId,
        institutionName,
      },
    });

    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;

    try {
      /*
       * ---------------------------------------------------------
       * STEP 1: Fetch and save all Plaid accounts
       * ---------------------------------------------------------
       */

      const accountsResponse =
        await plaidClient.accountsGet({
          access_token: accessToken,
        });

      for (const account of accountsResponse.data.accounts) {
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

      /*
       * ---------------------------------------------------------
       * STEP 2: Initial transaction sync
       * ---------------------------------------------------------
       */

      let cursor: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const syncResponse =
          await plaidClient.transactionsSync({
            access_token: accessToken,
            ...(cursor ? { cursor } : {}),
          });

        const {
          added,
          modified,
          removed,
          next_cursor,
          has_more,
        } = syncResponse.data;

        /*
         * -------------------------------------------------------
         * Added transactions
         * -------------------------------------------------------
         */

        for (const transaction of added) {
          const account = await prisma.plaidAccount.findUnique({
            where: {
              accountId: transaction.account_id,
            },
          });

          if (!account) {
            console.warn(
              `Plaid account not found for transaction ${transaction.transaction_id}`
            );

            continue;
          }

          if (account.plaidItemId !== plaidItem.id) {
            console.warn(
              `Plaid account does not belong to current Plaid Item for transaction ${transaction.transaction_id}`
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
              plaidTransactionId:
                transaction.transaction_id,
              userId,
              plaidAccountId: account.id,
            },
          });

          addedCount++;
        }

        /*
         * -------------------------------------------------------
         * Modified transactions
         * -------------------------------------------------------
         */

        for (const transaction of modified) {
          const amount = Number(transaction.amount);

          const plaidCategory =
            transaction.personal_finance_category?.primary ??
            "OTHER";

          const mapped = mapPlaidCategory(
            plaidCategory,
            transaction.merchant_name ?? transaction.name
          );

          const result = await prisma.transaction.updateMany({
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

          if (result.count > 0) {
            modifiedCount++;
          }
        }

        /*
         * -------------------------------------------------------
         * Removed transactions
         * -------------------------------------------------------
         */

        for (const transaction of removed) {
          const result = await prisma.transaction.deleteMany({
            where: {
              plaidTransactionId: transaction.transaction_id,
              userId,
            },
          });

          if (result.count > 0) {
            removedCount++;
          }
        }

        cursor = next_cursor;
        hasMore = has_more;
      }

      // Save the cursor so future syncs only fetch changes.
      await prisma.plaidItem.update({
        where: {
          id: plaidItem.id,
        },
        data: {
          syncCursor: cursor,
        },
      });
    } catch (syncError) {
      /*
       * The bank connection itself was successfully created.
       * If the initial sync fails, return an error so the client
       * knows that the connection needs attention.
       */
      console.error(
        "Initial Plaid transaction sync error:",
        syncError
      );

      return NextResponse.json(
        {
          error:
            "Plaid account connected, but the initial transaction sync failed.",
          plaidItemId: plaidItem.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plaid account connected successfully",
      sync: {
        added: addedCount,
        modified: modifiedCount,
        removed: removedCount,
      },
    });
  } catch (error) {
    console.error("Plaid Token Exchange Error:", error);

    return NextResponse.json(
      { error: "Failed to connect Plaid account" },
      { status: 500 }
    );
  }
}

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

    const plaidItems = await prisma.plaidItem.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (plaidItems.length === 0) {
      return NextResponse.json({
        connected: false,
        banks: [],
      });
    }

    const banks = [];

    for (const plaidItem of plaidItems) {
      let institutionName = plaidItem.institutionName;

      try {
        const itemResponse = await plaidClient.itemGet({
          access_token: plaidItem.accessToken,
        });

        institutionName =
          itemResponse.data.item.institution_name ||
          institutionName ||
          "Connected Bank";

        if (institutionName !== plaidItem.institutionName) {
          await prisma.plaidItem.update({
            where: {
              id: plaidItem.id,
            },
            data: {
              institutionName,
            },
          });
        }
      } catch (plaidError) {
        console.error(
          `Error retrieving Plaid institution for ${plaidItem.itemId}:`,
          plaidError
        );

        institutionName =
          institutionName || "Connected Bank";
      }

      banks.push({
        plaidItemId: plaidItem.id,
        itemId: plaidItem.itemId,
        institutionName,
      });
    }

    return NextResponse.json({
      connected: true,
      banks,
    });
  } catch (error) {
    console.error("Plaid Connection Check Error:", error);

    return NextResponse.json(
      { error: "Failed to check Plaid connections" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const plaidItemId = body.plaidItemId;

    if (!plaidItemId) {
      return NextResponse.json(
        { error: "Missing plaidItemId" },
        { status: 400 }
      );
    }

    const plaidItem = await prisma.plaidItem.findFirst({
      where: {
        id: plaidItemId,
        userId,
      },
    });

    if (!plaidItem) {
      return NextResponse.json(
        { error: "Connected bank account not found" },
        { status: 404 }
      );
    }

    try {
      await plaidClient.itemRemove({
        access_token: plaidItem.accessToken,
      });
    } catch (plaidError) {
      console.error(
        `Plaid Item Remove Error for ${plaidItem.itemId}:`,
        plaidError
      );
    }

    await prisma.plaidItem.delete({
      where: {
        id: plaidItem.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Plaid account disconnected successfully",
      plaidItemId: plaidItem.id,
    });
  } catch (error) {
    console.error("Plaid Disconnect Error:", error);

    return NextResponse.json(
      { error: "Failed to disconnect Plaid account" },
      { status: 500 }
    );
  }
}
