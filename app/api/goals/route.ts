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

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("GET goals error:", error);

    return NextResponse.json(
      { error: "Failed to fetch goals" },
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

    const name = String(body.name || "").trim();
    const targetAmount = Number(body.targetAmount);
    const currentAmount = Number(body.currentAmount ?? 0);
    const deadline = body.deadline;

    if (!name || name.length > 100) {
      return NextResponse.json(
        {
          error:
            "Goal name is required and must be under 100 characters",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Target amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(currentAmount) ||
      currentAmount < 0
    ) {
      return NextResponse.json(
        { error: "Current amount cannot be negative" },
        { status: 400 }
      );
    }

    if (currentAmount > targetAmount) {
      return NextResponse.json(
        {
          error:
            "Current amount cannot be greater than target amount",
        },
        { status: 400 }
      );
    }

    let parsedDeadline: Date | null = null;

    if (deadline) {
      parsedDeadline = new Date(deadline);

      if (Number.isNaN(parsedDeadline.getTime())) {
        return NextResponse.json(
          { error: "Invalid deadline" },
          { status: 400 }
        );
      }
    }

    const goal = await prisma.goal.create({
      data: {
        name,
        targetAmount,
        currentAmount,
        deadline: parsedDeadline,
        userId: session.user.id,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("POST goals error:", error);

    return NextResponse.json(
      { error: "Failed to create goal" },
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
    const name = String(body.name || "").trim();
    const targetAmount = Number(body.targetAmount);
    const currentAmount = Number(body.currentAmount ?? 0);
    const deadline = body.deadline;

    if (!id) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    if (!name || name.length > 100) {
      return NextResponse.json(
        {
          error:
            "Goal name is required and must be under 100 characters",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Target amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(currentAmount) ||
      currentAmount < 0
    ) {
      return NextResponse.json(
        { error: "Current amount cannot be negative" },
        { status: 400 }
      );
    }

    if (currentAmount > targetAmount) {
      return NextResponse.json(
        {
          error:
            "Current amount cannot be greater than target amount",
        },
        { status: 400 }
      );
    }

    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    let parsedDeadline: Date | null = null;

    if (deadline) {
      parsedDeadline = new Date(deadline);

      if (Number.isNaN(parsedDeadline.getTime())) {
        return NextResponse.json(
          { error: "Invalid deadline" },
          { status: 400 }
        );
      }
    }

    const goal = await prisma.goal.update({
      where: {
        id,
      },
      data: {
        name,
        targetAmount,
        currentAmount,
        deadline: parsedDeadline,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("PUT goals error:", error);

    return NextResponse.json(
      { error: "Failed to update goal" },
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
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    const deleted = await prisma.goal.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Goal deleted successfully",
    });
  } catch (error) {
    console.error("DELETE goals error:", error);

    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}