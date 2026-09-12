"use client";

import { FormEvent, useEffect, useState } from "react";

type Budget = {
  id: string;
  category: string;
  amount: string;
  month: number;
  year: number;
};

type Transaction = {
  id: string;
  category: string;
  amount: string;
  type: "income" | "expense";
  date: string;
};

const categories = [
  "Food",
  "Bills",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    async function loadData() {
      try {
        const [budgetResponse, transactionResponse] = await Promise.all([
          fetch("/api/budgets"),
          fetch("/api/transactions"),
        ]);

        if (!budgetResponse.ok || !transactionResponse.ok) {
          throw new Error("Failed to load budget data");
        }

        const budgetData = await budgetResponse.json();
        const transactionData = await transactionResponse.json();

        setBudgets(budgetData);
        setTransactions(transactionData);
      } catch (error) {
        console.error("Failed to load budget data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function resetForm() {
    setCategory("Food");
    setAmount("");
    setEditingBudget(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function handleEdit(budget: Budget) {
    setEditingBudget(budget);
    setCategory(budget.category);
    setAmount(budget.amount);
    setShowForm(true);
  }

  function getSpentAmount(budget: Budget) {
    return transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);

        return (
          transaction.type === "expense" &&
          transaction.category === budget.category &&
          transactionDate.getMonth() + 1 === budget.month &&
          transactionDate.getFullYear() === budget.year
        );
      })
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Budget amount must be greater than 0.");
      return;
    }

    if (!category) {
      alert("Please select a category.");
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingBudget !== null;

      const response = await fetch("/api/budgets", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isEditing ? { id: editingBudget.id } : {}),
          category,
          amount: numericAmount,
          month: currentMonth,
          year: currentYear,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save budget");
      }

      if (isEditing) {
        setBudgets((currentBudgets) =>
          currentBudgets.map((budget) =>
            budget.id === data.id ? data : budget
          )
        );
      } else {
        setBudgets((currentBudgets) => [data, ...currentBudgets]);
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save budget:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save budget. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/budgets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete budget");
      }

      setBudgets((currentBudgets) =>
        currentBudgets.filter((budget) => budget.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete budget:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete budget. Please try again."
      );
    }
  }

  const currentBudgets = budgets.filter(
    (budget) =>
      budget.month === currentMonth && budget.year === currentYear
  );

  const totalBudget = currentBudgets.reduce(
    (total, budget) => total + Number(budget.amount),
    0
  );

  const totalSpent = currentBudgets.reduce(
    (total, budget) => total + getSpentAmount(budget),
    0
  );

  const totalRemaining = totalBudget - totalSpent;

  const monthName = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Budgets
            </h1>

            <p className="mt-1 text-slate-600">
              Plan and control your monthly spending.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            + Add Budget
          </button>
        </div>

        {/* Summary */}
        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Budget
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹{totalBudget.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Spent
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Remaining
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                totalRemaining >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              ₹{totalRemaining.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Budget list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold">
              {monthName} Budgets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track your spending against each category.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-slate-500">
              Loading budgets...
            </div>
          ) : currentBudgets.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-700">
                No budgets yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first monthly budget to start tracking
                your spending.
              </p>

              <button
                onClick={openAddForm}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
              >
                Create Budget
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {currentBudgets.map((budget) => {
                const budgetAmount = Number(budget.amount);
                const spent = getSpentAmount(budget);
                const remaining = budgetAmount - spent;

                const percentage =
                  budgetAmount > 0
                    ? Math.min((spent / budgetAmount) * 100, 100)
                    : 0;

                const isOverBudget = spent > budgetAmount;

                return (
                  <div key={budget.id} className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">
                              {budget.category}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              ₹{spent.toLocaleString("en-IN")} spent of ₹
                              {budgetAmount.toLocaleString("en-IN")}
                            </p>
                          </div>

                          <p
                            className={`text-sm font-semibold ${
                              isOverBudget
                                ? "text-red-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {isOverBudget
                              ? `₹${Math.abs(
                                  remaining
                                ).toLocaleString("en-IN")} over`
                              : `₹${remaining.toLocaleString(
                                  "en-IN"
                                )} left`}
                          </p>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOverBudget
                                ? "bg-red-500"
                                : "bg-slate-900"
                            }`}
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex justify-between text-xs text-slate-400">
                          <span>
                            {Math.round(
                              (spent / budgetAmount) * 100
                            ) || 0}
                            % used
                          </span>

                          <span>
                            Budget: ₹
                            {budgetAmount.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {isOverBudget && (
                          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            ⚠️ You have exceeded your {budget.category}{" "}
                            budget.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(budget)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingBudget
                      ? "Edit Budget"
                      : "Add Budget"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Set your spending limit for {monthName}.
                  </p>
                </div>

                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="rounded-lg px-3 py-2 text-slate-500 transition hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="budget-category"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Category
                  </label>

                  <select
                    id="budget-category"
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="budget-amount"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Monthly Budget
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ₹
                    </span>

                    <input
                      id="budget-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      placeholder="0"
                      required
                      className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  This budget applies to{" "}
                  <span className="font-medium text-slate-700">
                    {monthName}
                  </span>
                  .
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingBudget
                        ? "Update Budget"
                        : "Add Budget"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}