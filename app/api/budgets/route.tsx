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

    const budgets = await prisma.budget.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { category: "asc" },
      ],
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("GET budgets error:", error);

    return NextResponse.json(
      { error: "Failed to fetch budgets" },
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

    const category = String(body.category || "").trim();
    const amount = Number(body.amount);
    const month = Number(body.month);
    const year = Number(body.year);

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Budget amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json(
        { error: "Invalid month" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(year) ||
      year < 2020 ||
      year > 2100
    ) {
      return NextResponse.json(
        { error: "Invalid year" },
        { status: 400 }
      );
    }

    const existingBudget = await prisma.budget.findUnique({
      where: {
        userId_category_month_year: {
          userId: session.user.id,
          category,
          month,
          year,
        },
      },
    });

    if (existingBudget) {
      return NextResponse.json(
        {
          error:
            "A budget for this category already exists for this month",
        },
        { status: 409 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        category,
        amount,
        month,
        year,
        userId: session.user.id,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("POST budgets error:", error);

    return NextResponse.json(
      { error: "Failed to create budget" },
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
    const category = String(body.category || "").trim();
    const amount = Number(body.amount);

    if (!id) {
      return NextResponse.json(
        { error: "Budget ID is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Budget amount must be greater than 0" },
        { status: 400 }
      );
    }

    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      );
    }

    const duplicateBudget = await prisma.budget.findFirst({
      where: {
        userId: session.user.id,
        category,
        month: existingBudget.month,
        year: existingBudget.year,
        NOT: {
          id,
        },
      },
    });

    if (duplicateBudget) {
      return NextResponse.json(
        {
          error:
            "A budget for this category already exists for this month",
        },
        { status: 409 }
      );
    }

    const budget = await prisma.budget.update({
      where: {
        id,
      },
      data: {
        category,
        amount,
      },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("PUT budgets error:", error);

    return NextResponse.json(
      { error: "Failed to update budget" },
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
        { error: "Budget ID is required" },
        { status: 400 }
      );
    }

    const deleted = await prisma.budget.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("DELETE budgets error:", error);

    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
}