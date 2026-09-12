import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import PlaidLink from "@/components/PlaidLink";
import PlaidAccounts from "@/components/PlaidAccounts";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userName = session.user.name || "there";

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      date: "desc",
    },
  });

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );

  const totalBalance = totalIncome - totalExpenses;
  const savings = totalIncome - totalExpenses;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
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

  const recentTransactions = transactions.slice(0, 5);

  const categoryTotals = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((totals, transaction) => {
      const category = transaction.category;

      totals[category] =
        (totals[category] || 0) + Number(transaction.amount);

      return totals;
    }, {});

  const spendingCategories = Object.entries(categoryTotals)
    .sort(([, amountA], [, amountB]) => amountB - amountA)
    .slice(0, 5);

  const highestCategoryAmount =
    spendingCategories.length > 0
      ? Math.max(...spendingCategories.map(([, amount]) => amount))
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Personal Finance
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              IntelliSpend
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <PlaidLink />

            <Link
              href="/transactions"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              + Add Transaction
            </Link>
          </div>
        </header>

        {/* Welcome */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold">
            Good evening, {userName} 👋
          </h2>

          <p className="mt-1 text-slate-500">
            Here&apos;s an overview of your finances.
          </p>
        </section>

        {/* Stats */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Balance
            </p>

            <p className="mt-3 text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Income − expenses
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Income
            </p>

            <p className="mt-3 text-2xl font-bold text-emerald-600">
              {formatCurrency(totalIncome)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              All recorded income
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Expenses
            </p>

            <p className="mt-3 text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              All recorded expenses
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Savings
            </p>

            <p
              className={`mt-3 text-2xl font-bold ${
                savings >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(savings)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Current net savings
            </p>
          </div>
        </section>

        {/* Main content */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Spending Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Spending Overview
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your spending activity this month
                </p>
              </div>

              <Link
                href="/analytics"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                View analytics →
              </Link>
            </div>

            {spendingCategories.length === 0 ? (
              <div className="mt-8 flex h-64 items-center justify-center rounded-xl bg-slate-50">
                <p className="text-sm text-slate-400">
                  No expenses recorded this month
                </p>
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                {spendingCategories.map(([category, amount]) => {
                  const percentage =
                    highestCategoryAmount > 0
                      ? (amount / highestCategoryAmount) * 100
                      : 0;

                  return (
                    <div key={category}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">
                          {category}
                        </p>

                        <p className="text-sm font-medium text-slate-900">
                          {formatCurrency(amount)}
                        </p>
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

          {/* AI Insight */}
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-sm font-medium text-slate-400">
              IntelliSpend AI
            </p>

            <h3 className="mt-3 text-xl font-semibold">
              Your spending insight
            </h3>

            {monthlyExpenses === 0 ? (
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Add some transactions this month and IntelliSpend
                will start identifying your spending patterns.
              </p>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-300">
                You&apos;ve spent{" "}
                {formatCurrency(monthlyExpenses)} this month and
                saved {formatCurrency(monthlySavings)} from your
                recorded income.
              </p>
            )}

            <Link
              href="/insights"
              className="mt-6 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
            >
              View insights
            </Link>
          </div>
        </section>

        {/* Monthly Summary */}
        <section className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              This Month&apos;s Income
            </p>

            <p className="mt-2 text-xl font-bold text-emerald-600">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              This Month&apos;s Expenses
            </p>

            <p className="mt-2 text-xl font-bold">
              {formatCurrency(monthlyExpenses)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              This Month&apos;s Savings
            </p>

            <p
              className={`mt-2 text-xl font-bold ${
                monthlySavings >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(monthlySavings)}
            </p>
          </div>
        </section>

        {/* Connected Accounts */}
        <PlaidAccounts />

        {/* Recent Transactions */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Recent Transactions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your latest financial activity
              </p>
            </div>

            <Link
              href="/transactions"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              View all →
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-400">
                No transactions yet
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-slate-200">
              {recentTransactions.map((transaction) => (
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
                      {formatDate(new Date(transaction.date))}
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
                    {Number(transaction.amount).toLocaleString(
                      "en-IN"
                    )}
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