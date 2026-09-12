import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

const chartColors = [
  "#2563eb",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
  "#f97316",
  "#06b6d4",
  "#64748b",
];

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      date: "asc",
    },
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );

  const monthlyExpenses = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );

  const monthlySavings = monthlyIncome - monthlyExpenses;

  const categoryTotals = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((totals, transaction) => {
      const category = transaction.category;

      totals[category] =
        (totals[category] || 0) + Number(transaction.amount);

      return totals;
    }, {});

  const categories = Object.entries(categoryTotals).sort(
    ([, amountA], [, amountB]) => amountB - amountA
  );

  const highestCategory =
    categories.length > 0 ? categories[0] : null;

  /*
   * Monthly Income Donut
   *
   * The complete green circle represents 100% of monthly income.
   *
   * Expense categories are drawn on top of the green circle.
   * Each category takes a proportional section based on:
   *
   * category expense / monthly income
   *
   * The green portion that remains visible represents savings.
   */

  const chartRadius = 86;
  const chartCircumference = 2 * Math.PI * chartRadius;

  let chartOffset = 0;

  const expenseChartSegments = categories
    .map(([category, amount], index) => {
      if (monthlyIncome <= 0) {
        return null;
      }

      const percentage = Math.min(
        (amount / monthlyIncome) * 100,
        100
      );

      const segmentLength =
        (percentage / 100) * chartCircumference;

      const segment = {
        category,
        amount,
        percentage,
        color: chartColors[index % chartColors.length],
        segmentLength,
        offset: chartOffset,
      };

      chartOffset += segmentLength;

      return segment;
    })
    .filter(
      (
        segment
      ): segment is {
        category: string;
        amount: number;
        percentage: number;
        color: string;
        segmentLength: number;
        offset: number;
      } => segment !== null
    );

  /*
   * Last 6 months
   */
  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      currentYear,
      currentMonth - (5 - index),
      1
    );

    const month = date.getMonth();
    const year = date.getFullYear();

    const monthTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);

      return (
        transactionDate.getMonth() === month &&
        transactionDate.getFullYear() === year
      );
    });

    const income = monthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );

    const expenses = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );

    return {
      month: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
      income,
      expenses,
    };
  });

  const highestMonthlyValue = Math.max(
    ...monthlyData.flatMap((item) => [
      item.income,
      item.expenses,
    ]),
    1
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Financial Overview
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Analytics
            </h1>

            <p className="mt-1 text-slate-600">
              Understand your income, expenses and spending patterns.
            </p>
          </div>

          <Link
            href="/transactions"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            View Transactions
          </Link>
        </div>

        {/* Current Month Summary */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Monthly Income
            </p>

            <p className="mt-3 text-2xl font-bold text-emerald-600">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Monthly Expenses
            </p>

            <p className="mt-3 text-2xl font-bold">
              {formatCurrency(monthlyExpenses)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Monthly Savings
            </p>

            <p
              className={`mt-3 text-2xl font-bold ${
                monthlySavings >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(monthlySavings)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Top Spending Category
            </p>

            <p className="mt-3 text-2xl font-bold">
              {highestCategory ? highestCategory[0] : "—"}
            </p>

            {highestCategory && (
              <p className="mt-1 text-sm text-slate-500">
                {formatCurrency(highestCategory[1])}
              </p>
            )}
          </div>
        </section>

        {/* Income Allocation */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Monthly Money Flow
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  See how your income is being used this month.
                </p>
              </div>

              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Income · {formatCurrency(monthlyIncome)}
              </div>
            </div>
          </div>

          {monthlyIncome === 0 && monthlyExpenses === 0 ? (
            <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500">
                  No financial activity this month
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Add an income transaction to see your money flow.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              {/* Income Donut */}
              <div className="flex justify-center">
                <div className="relative h-80 w-80">
                  <svg
                    viewBox="0 0 220 220"
                    className="h-full w-full -rotate-90"
                  >
                    {/* Entire Income Circle */}
                    <circle
                      cx="110"
                      cy="110"
                      r={chartRadius}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="28"
                    />

                    {/* Expense Sections */}
                    {monthlyIncome > 0 &&
                      expenseChartSegments.map(
                        (segment) => (
                          <circle
                            key={segment.category}
                            cx="110"
                            cy="110"
                            r={chartRadius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="28"
                            strokeLinecap="butt"
                            strokeDasharray={`${Math.min(
                              segment.segmentLength,
                              chartCircumference
                            )} ${chartCircumference}`}
                            strokeDashoffset={
                              -segment.offset
                            }
                          />
                        )
                      )}

                    {/* Inner White Area */}
                    <circle
                      cx="110"
                      cy="110"
                      r="68"
                      fill="white"
                    />

                    {/* Subtle Inner Border */}
                    <circle
                      cx="110"
                      cy="110"
                      r="68"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                  </svg>

                  {/* Center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Monthly Income
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                      {formatCurrency(monthlyIncome)}
                    </p>

                    {monthlyIncome > 0 && (
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          monthlySavings >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {monthlySavings >= 0
                          ? `${(
                              (monthlySavings /
                                monthlyIncome) *
                              100
                            ).toFixed(1)}% saved`
                          : `${(
                              (Math.abs(
                                monthlySavings
                              ) /
                                monthlyIncome) *
                              100
                            ).toFixed(1)}% over`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div>
                {/* Income */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full bg-emerald-500" />

                      <div>
                        <p className="text-base font-bold text-slate-900">
                          Income / Salary
                        </p>

                        <p className="mt-0.5 text-sm text-slate-500">
                          Total income this month
                        </p>
                      </div>
                    </div>

                    <p className="text-lg font-bold text-emerald-700">
                      {formatCurrency(monthlyIncome)}
                    </p>
                  </div>
                </div>

                {/* Expenses */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-slate-900">
                      Expenses
                    </p>

                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(monthlyExpenses)}
                    </p>
                  </div>

                  {categories.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-400">
                        No expenses recorded this month.
                      </p>
                    </div>
                  ) : (
                    categories.map(([category, amount], index) => {
                      const percentageOfIncome =
                        monthlyIncome > 0
                          ? (amount / monthlyIncome) * 100
                          : 0;

                      const percentageOfExpenses =
                        monthlyExpenses > 0
                          ? (amount / monthlyExpenses) * 100
                          : 0;

                      const color =
                        chartColors[
                          index % chartColors.length
                        ];

                      return (
                        <div
                          key={category}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3.5 w-3.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: color,
                              }}
                            />

                            <div>
                              <p className="text-base font-bold text-slate-800">
                                {category}
                              </p>

                              <p className="mt-0.5 text-sm font-medium text-slate-400">
                                {percentageOfExpenses.toFixed(1)}%
                                of expenses
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">
                              {formatCurrency(amount)}
                            </p>

                            {monthlyIncome > 0 && (
                              <p className="mt-0.5 text-sm font-medium text-slate-400">
                                {percentageOfIncome.toFixed(1)}%
                                of income
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Remaining / Savings */}
                  <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500" />

                      <div>
                        <p className="text-base font-bold text-slate-800">
                          Remaining / Savings
                        </p>

                        <p className="mt-0.5 text-sm font-medium text-slate-400">
                          Income after expenses
                        </p>
                      </div>
                    </div>

                    <p
                      className={`text-lg font-bold ${
                        monthlySavings >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(monthlySavings)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Monthly Trend */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-8">
            <h2 className="text-lg font-semibold">
              Income vs Expenses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your financial activity over the last 6 months.
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50">
              <p className="text-sm text-slate-400">
                Add transactions to see your financial trends.
              </p>
            </div>
          ) : (
            <div className="flex h-72 items-end gap-3 sm:gap-6">
              {monthlyData.map((item) => {
                const incomeHeight =
                  (item.income / highestMonthlyValue) * 220;

                const expenseHeight =
                  (item.expenses / highestMonthlyValue) * 220;

                return (
                  <div
                    key={`${item.month}-${item.income}-${item.expenses}`}
                    className="flex h-full flex-1 flex-col justify-end"
                  >
                    <div className="flex items-end justify-center gap-1 sm:gap-2">
                      <div
                        title={`Income: ${formatCurrency(
                          item.income
                        )}`}
                        className="w-5 rounded-t-md bg-emerald-500 transition-all sm:w-8"
                        style={{
                          height: `${Math.max(
                            incomeHeight,
                            item.income > 0 ? 8 : 0
                          )}px`,
                        }}
                      />

                      <div
                        title={`Expenses: ${formatCurrency(
                          item.expenses
                        )}`}
                        className="w-5 rounded-t-md bg-slate-900 transition-all sm:w-8"
                        style={{
                          height: `${Math.max(
                            expenseHeight,
                            item.expenses > 0 ? 8 : 0
                          )}px`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-center text-xs font-medium text-slate-500">
                      {item.month}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Income</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-900" />
              <span className="text-slate-600">Expenses</span>
            </div>
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Spending by Category
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Where your money is going this month.
              </p>
            </div>

            {categories.length === 0 ? (
              <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50">
                <p className="text-sm text-slate-400">
                  No expenses recorded this month.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {categories.map(([category, amount]) => {
                  const percentage =
                    monthlyExpenses > 0
                      ? (amount / monthlyExpenses) * 100
                      : 0;

                  return (
                    <div key={category}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">
                          {category}
                        </p>

                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(amount)}
                        </p>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {percentage.toFixed(1)}% of monthly expenses
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spending Summary */}
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-sm font-medium text-slate-400">
              Monthly Summary
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              {monthlyExpenses === 0
                ? "No spending recorded"
                : "Your spending at a glance"}
            </h2>

            {monthlyExpenses > 0 ? (
              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-sm text-slate-400">
                    Total spent
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {formatCurrency(monthlyExpenses)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Highest category
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {highestCategory?.[0]}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {highestCategory
                      ? formatCurrency(highestCategory[1])
                      : "₹0"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Savings rate
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {monthlyIncome > 0
                      ? `${(
                          (monthlySavings / monthlyIncome) *
                          100
                        ).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-slate-300">
                Add income and expense transactions to start
                generating useful financial analytics.
              </p>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest financial transactions.
              </p>
            </div>

            <Link
              href="/transactions"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              View all →
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-400">
                No transactions yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-slate-200">
              {transactions
                .slice(-5)
                .reverse()
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {transaction.description}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.category} ·{" "}
                        {new Date(
                          transaction.date
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <p
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-emerald-600"
                          : "text-slate-900"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}₹
                      {Number(
                        transaction.amount
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
