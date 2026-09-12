import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export default async function InsightsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const now = new Date();

  const currentMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const nextMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  const previousMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const [
    currentTransactions,
    previousTransactions,
    budgets,
    goals,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
      orderBy: {
        date: "desc",
      },
    }),

    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: previousMonthStart,
          lt: currentMonthStart,
        },
      },
    }),

    prisma.budget.findMany({
      where: {
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    }),

    prisma.goal.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  // -----------------------------
  // Current month calculations
  // -----------------------------

  const income = currentTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const expenses = currentTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const savings = income - expenses;

  const savingsRate =
    income > 0 ? Math.round((savings / income) * 100) : 0;

  // -----------------------------
  // Previous month calculations
  // -----------------------------

  const previousExpenses = previousTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const previousIncome = previousTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  let expenseChange = 0;

  if (previousExpenses > 0) {
    expenseChange = Math.round(
      ((expenses - previousExpenses) / previousExpenses) * 100
    );
  }

  // -----------------------------
  // Spending by category
  // -----------------------------

  const categoryTotals: Record<string, number> = {};

  currentTransactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const category = transaction.category || "Other";

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        Number(transaction.amount);
    });

  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const topCategory = sortedCategories[0];

  // -----------------------------
  // Budget analysis
  // -----------------------------

  const budgetInsights = budgets.map((budget) => {
    const spent = currentTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category.toLowerCase() ===
            budget.category.toLowerCase()
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const budgetAmount = Number(budget.amount);

    const percentage =
      budgetAmount > 0
        ? Math.round((spent / budgetAmount) * 100)
        : 0;

    return {
      category: budget.category,
      budget: budgetAmount,
      spent,
      percentage,
    };
  });

  const exceededBudgets = budgetInsights.filter(
    (budget) => budget.spent > budget.budget
  );

  const warningBudgets = budgetInsights.filter(
    (budget) =>
      budget.spent <= budget.budget &&
      budget.percentage >= 80
  );

  // -----------------------------
  // Goal analysis
  // -----------------------------

  const activeGoals = goals.filter(
    (goal) =>
      Number(goal.currentAmount) < Number(goal.targetAmount)
  );

  const completedGoals = goals.filter(
    (goal) =>
      Number(goal.currentAmount) >= Number(goal.targetAmount)
  );

  // -----------------------------
  // Generate insights
  // -----------------------------

  const insights: {
    title: string;
    message: string;
    type: "positive" | "warning" | "info";
  }[] = [];

  if (income === 0 && expenses === 0) {
    insights.push({
      title: "Start tracking your money",
      message:
        "Add your income and expenses to IntelliSpend so it can identify your spending patterns and give you personalized insights.",
      type: "info",
    });
  }

  if (income > 0 && savings > 0) {
    insights.push({
      title: "You're saving money",
      message:
        `You have saved ₹${savings.toLocaleString("en-IN")} this month, which is ${savingsRate}% of your recorded income.`,
      type: "positive",
    });
  }

  if (income > 0 && savings <= 0) {
    insights.push({
      title: "Your spending is high",
      message:
        "Your expenses are currently equal to or higher than your recorded income. Consider reviewing your largest spending categories.",
      type: "warning",
    });
  }

  if (topCategory) {
    insights.push({
      title: `Highest spending: ${topCategory[0]}`,
      message:
        `You have spent ₹${topCategory[1].toLocaleString("en-IN")} on ${topCategory[0]} this month. This is currently your largest expense category.`,
      type: "info",
    });
  }

  if (expenseChange > 0 && previousExpenses > 0) {
    insights.push({
      title: "Expenses increased",
      message:
        `Your spending is ${expenseChange}% higher than last month. Check your recent transactions to see where the increase came from.`,
      type: "warning",
    });
  }

  if (expenseChange < 0 && previousExpenses > 0) {
    insights.push({
      title: "Spending improved",
      message:
        `Your expenses are ${Math.abs(expenseChange)}% lower than last month. Keep maintaining this spending pattern.`,
      type: "positive",
    });
  }

  exceededBudgets.forEach((budget) => {
    insights.push({
      title: `${budget.category} budget exceeded`,
      message:
        `You have spent ₹${budget.spent.toLocaleString("en-IN")} against a budget of ₹${budget.budget.toLocaleString("en-IN")}.`,
      type: "warning",
    });
  });

  warningBudgets.forEach((budget) => {
    insights.push({
      title: `${budget.category} budget almost reached`,
      message:
        `You have used ${budget.percentage}% of your ${budget.category} budget. Only ₹${Math.max(
          budget.budget - budget.spent,
          0
        ).toLocaleString("en-IN")} remains.`,
      type: "warning",
    });
  });

  if (activeGoals.length > 0) {
    const closestGoal = activeGoals[0];

    const target = Number(closestGoal.targetAmount);
    const current = Number(closestGoal.currentAmount);

    const progress =
      target > 0 ? Math.round((current / target) * 100) : 0;

    insights.push({
      title: `Goal progress: ${closestGoal.name}`,
      message:
        `You've reached ${progress}% of your ₹${target.toLocaleString(
          "en-IN"
        )} goal. Keep going!`,
      type: progress >= 50 ? "positive" : "info",
    });
  }

  if (completedGoals.length > 0) {
    insights.push({
      title: "Goal completed 🎉",
      message:
        `You have completed ${completedGoals.length} financial ${
          completedGoals.length === 1 ? "goal" : "goals"
        }. Great work!`,
      type: "positive",
    });
  }

  // -----------------------------
  // Page
  // -----------------------------

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              AI Insights
            </h1>

            <p className="mt-2 text-slate-500">
              Personalized insights based on your financial activity.
            </p>
          </div>

          <Link
            href="/transactions"
            className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View Transactions
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Monthly Income
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              ₹{income.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Monthly Expenses
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              ₹{expenses.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Monthly Savings
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                savings >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              ₹{savings.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Savings Rate
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {savingsRate}%
            </p>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Your Insights
          </h2>

          <div className="space-y-4">
            {insights.map((insight, index) => {
              const containerClass =
                insight.type === "warning"
                  ? "border-amber-200 bg-amber-50"
                  : insight.type === "positive"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-white";

              const icon =
                insight.type === "warning"
                  ? "⚠️"
                  : insight.type === "positive"
                  ? "✓"
                  : "💡";

              return (
                <div
                  key={`${insight.title}-${index}`}
                  className={`rounded-2xl border p-6 ${containerClass}`}
                >
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                      {icon}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {insight.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spending breakdown */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Spending Breakdown
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Where your money is going this month.
            </p>

            {sortedCategories.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                No expense data available yet.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                {sortedCategories.map(([category, amount]) => {
                  const percentage =
                    expenses > 0
                      ? Math.round((amount / expenses) * 100)
                      : 0;

                  return (
                    <div key={category}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {category}
                        </span>

                        <span className="text-slate-500">
                          ₹{amount.toLocaleString("en-IN")} ·{" "}
                          {percentage}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Budget overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Budget Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              How your spending compares with your budgets.
            </p>

            {budgetInsights.length === 0 ? (
              <div className="mt-6">
                <p className="text-sm text-slate-500">
                  No budgets have been created for this month.
                </p>

                <Link
                  href="/budgets"
                  className="mt-4 inline-block text-sm font-semibold text-slate-900 underline"
                >
                  Create a budget
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {budgetInsights.map((budget) => {
                  const progress = Math.min(
                    budget.percentage,
                    100
                  );

                  return (
                    <div key={budget.category}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {budget.category}
                        </span>

                        <span className="text-slate-500">
                          ₹{budget.spent.toLocaleString("en-IN")} / ₹
                          {budget.budget.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {budget.percentage}% used
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Financial Goals
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your current progress toward your goals.
              </p>
            </div>

            <Link
              href="/goals"
              className="text-sm font-semibold text-slate-900 underline"
            >
              Manage goals
            </Link>
          </div>

          {goals.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No financial goals created yet.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {goals.slice(0, 4).map((goal) => {
                const target = Number(goal.targetAmount);
                const current = Number(goal.currentAmount);

                const progress =
                  target > 0
                    ? Math.min(
                        Math.round((current / target) * 100),
                        100
                      )
                    : 0;

                return (
                  <div
                    key={goal.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-800">
                        {goal.name}
                      </span>

                      <span className="text-sm text-slate-500">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      ₹{current.toLocaleString("en-IN")} saved of ₹
                      {target.toLocaleString("en-IN")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-sm text-slate-500">
            Insights are generated from your IntelliSpend
            transaction, budget, and goal data.
          </p>
        </div>
      </div>
    </main>
  );
}