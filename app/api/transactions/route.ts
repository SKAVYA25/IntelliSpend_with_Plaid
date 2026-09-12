import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
      include: {
        plaidAccount: {
          include: {
            plaidItem: true,
          },
        },
      },
    });

    const formattedTransactions = transactions.map(
      (transaction) => ({
        id: transaction.id,
        description: transaction.description,
        category: transaction.category,
        subcategory: transaction.subcategory,
        date: transaction.date,
        amount: transaction.amount,
        type: transaction.type,
        source: transaction.source,

        plaidAccount: transaction.plaidAccount
          ? {
              name: transaction.plaidAccount.name,
              mask: transaction.plaidAccount.mask,
              institutionName:
                transaction.plaidAccount.plaidItem
                  ?.institutionName || null,
            }
          : null,
      })
    );

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("GET transactions error:", error);

    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const description = String(body.description || "").trim();
    const amount = Number(body.amount);
    const type = body.type;
    const category = String(body.category || "").trim();
    const subcategory = String(body.subcategory || "").trim();
    const date = body.date;

    if (!description || description.length > 100) {
      return NextResponse.json(
        {
          error:
            "Description is required and must be under 100 characters",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory is required" },
        { status: 400 }
      );
    }

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json(
        { error: "Valid date is required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount,
        type,
        category,
        subcategory,
        date: new Date(date),
        userId: session.user.id,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("POST transactions error:", error);

    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(body.id || "");
    const description = String(body.description || "").trim();
    const amount = Number(body.amount);
    const type = body.type;
    const category = String(body.category || "").trim();
    const subcategory = String(body.subcategory || "").trim();
    const date = body.date;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const existingTransaction =
      await prisma.transaction.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
        select: {
          id: true,
          source: true,
        },
      });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (existingTransaction.source === "PLAID") {
      return NextResponse.json(
        { error: "Plaid transactions cannot be edited" },
        { status: 403 }
      );
    }

    if (!description || description.length > 100) {
      return NextResponse.json(
        {
          error:
            "Description is required and must be under 100 characters",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory is required" },
        { status: 400 }
      );
    }

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json(
        { error: "Valid date is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.updateMany({
      where: {
        id,
        userId: session.user.id,
        source: "MANUAL",
      },
      data: {
        description,
        amount,
        type,
        category,
        subcategory,
        date: new Date(date),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Transaction could not be updated" },
        { status: 403 }
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("PUT transactions error:", error);

    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = String(body.id || "");

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        source: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.source === "PLAID") {
      return NextResponse.json(
        { error: "Plaid transactions cannot be deleted" },
        { status: 403 }
      );
    }

    const deleted = await prisma.transaction.deleteMany({
      where: {
        id,
        userId: session.user.id,
        source: "MANUAL",
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Transaction could not be deleted" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("DELETE transactions error:", error);

    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}