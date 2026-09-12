"use client";

import { FormEvent, useEffect, useState } from "react";

type Transaction = {
  id: string;
  description: string;
  category: string;
  subcategory?: string | null;
  date: string;
  amount: string;
  type: "income" | "expense";
  source: "MANUAL" | "PLAID";
  plaidAccount?: {
    name: string;
    mask?: string | null;
    institutionName?: string | null;
  } | null;
};

const expenseCategories = {
  Food: [
    "Coffee",
    "Lunch",
    "Dinner",
    "Fast Food",
    "Snacks",
    "Groceries",
    "Other",
  ],
  Bills: [
    "Electricity",
    "Water",
    "Internet",
    "Mobile",
    "Rent",
    "Other",
  ],
  Shopping: [
    "Clothing",
    "Electronics",
    "Personal Care",
    "Household",
    "Other",
  ],
  Transport: [
    "Fuel",
    "Taxi",
    "Bus",
    "Train",
    "Parking",
    "Other",
  ],
  Subscriptions: [
    "Streaming",
    "Software",
    "Gaming",
    "Other",
  ],
  Entertainment: [
    "Movies",
    "Events",
    "Games",
    "Other",
  ],
  Health: [
    "Medicine",
    "Doctor",
    "Pharmacy",
    "Other",
  ],
  Education: [
    "Courses",
    "Books",
    "Fees",
    "Other",
  ],
  Other: [
    "Other",
  ],
};

const incomeCategories = {
  Salary: [
    "Monthly Salary",
    "Bonus",
    "Other",
  ],
  Freelance: [
    "Project",
    "Consulting",
    "Other",
  ],
  Business: [
    "Sales",
    "Other",
  ],
  Investment: [
    "Stocks",
    "Mutual Funds",
    "Other",
  ],
  Interest: [
    "Bank Interest",
    "Other",
  ],
  Gift: [
    "Cash Gift",
    "Other",
  ],
  Other: [
    "Other",
  ],
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [subcategory, setSubcategory] = useState("Coffee");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const categories =
    type === "income" ? incomeCategories : expenseCategories;

  const subcategories =
    categories[category as keyof typeof categories] || ["Other"];

  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await fetch("/api/transactions");

        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

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

  const netSavings = totalIncome - totalExpenses;

  function resetForm() {
    setType("expense");
    setDescription("");
    setAmount("");
    setCategory("Food");
    setSubcategory("Coffee");
    setCustomSubcategory("");
    setDate(new Date().toISOString().slice(0, 10));
    setEditingTransaction(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function handleTypeChange(newType: "income" | "expense") {
    setType(newType);
    setCustomSubcategory("");

    if (newType === "income") {
      setCategory("Salary");
      setSubcategory("Monthly Salary");
    } else {
      setCategory("Food");
      setSubcategory("Coffee");
    }
  }

  function handleCategoryChange(newCategory: string) {
    setCategory(newCategory);

    const newSubcategories =
      type === "income"
        ? incomeCategories[
            newCategory as keyof typeof incomeCategories
          ] || ["Other"]
        : expenseCategories[
            newCategory as keyof typeof expenseCategories
          ] || ["Other"];

    setSubcategory(newSubcategories[0]);
    setCustomSubcategory("");
  }

  function handleEdit(transaction: Transaction) {
    if (transaction.source === "PLAID") {
      return;
    }

    setEditingTransaction(transaction);
    setType(transaction.type);
    setDescription(transaction.description);
    setAmount(transaction.amount);
    setCategory(transaction.category);

    const availableSubcategories =
      transaction.type === "income"
        ? incomeCategories[
            transaction.category as keyof typeof incomeCategories
          ] || ["Other"]
        : expenseCategories[
            transaction.category as keyof typeof expenseCategories
          ] || ["Other"];

    const existingSubcategory = transaction.subcategory || "";

    if (availableSubcategories.includes(existingSubcategory)) {
      setSubcategory(existingSubcategory);
      setCustomSubcategory("");
    } else {
      setSubcategory("Other");
      setCustomSubcategory(existingSubcategory);
    }

    setDate(transaction.date.slice(0, 10));
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDescription = description.trim();
    const numericAmount = Number(amount);

    const finalSubcategory =
      subcategory === "Other"
        ? customSubcategory.trim()
        : subcategory;

    if (!trimmedDescription) {
      alert("Please enter a description.");
      return;
    }

    if (trimmedDescription.length > 100) {
      alert("Description must be under 100 characters.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }

    if (!category || !finalSubcategory || !date) {
      alert("Please complete all required fields.");
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingTransaction !== null;

      const response = await fetch("/api/transactions", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isEditing ? { id: editingTransaction.id } : {}),
          description: trimmedDescription,
          amount: numericAmount,
          type,
          category,
          subcategory: finalSubcategory,
          date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save transaction");
      }

      if (isEditing) {
        setTransactions((currentTransactions) =>
          currentTransactions.map((transaction) =>
            transaction.id === data.id ? data : transaction
          )
        );
      } else {
        setTransactions((currentTransactions) => [
          data,
          ...currentTransactions,
        ]);
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save transaction:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save transaction. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const transaction = transactions.find(
      (item) => item.id === id
    );

    if (!transaction || transaction.source === "PLAID") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/transactions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete transaction");
      }

      setTransactions((currentTransactions) =>
        currentTransactions.filter(
          (transaction) => transaction.id !== id
        )
      );
    } catch (error) {
      console.error("Failed to delete transaction:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete transaction. Please try again."
      );
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Transactions
            </h1>

            <p className="mt-1 text-slate-600">
              Manage your income and expenses.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            + Add Transaction
          </button>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Total Income
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              ₹{totalIncome.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Total Expenses
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              ₹{totalExpenses.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Net Savings
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                netSavings >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              ₹{netSavings.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Transactions
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-slate-500">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-slate-500">
              No transactions yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 p-6 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {transaction.description}
                      </p>

                      {transaction.source === "PLAID" && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          Plaid
                        </span>
                      )}

                      {transaction.source === "MANUAL" && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Manual
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {transaction.category}
                      {transaction.subcategory
                        ? ` → ${transaction.subcategory}`
                        : ""}
                      {" · "}
                      {formatDate(transaction.date)}
                    </p>

                    {transaction.source === "PLAID" &&
                      transaction.plaidAccount && (
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          🏦{" "}
                          {transaction.plaidAccount
                            .institutionName ||
                            "Connected Bank"}
                          {transaction.plaidAccount.mask
                            ? ` · •••• ${transaction.plaidAccount.mask}`
                            : ""}
                        </p>
                      )}
                  </div>

                  <div className="flex items-center gap-4">
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

                    {transaction.source === "MANUAL" && (
                      <>
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {editingTransaction
                      ? "Edit Transaction"
                      : "Add Transaction"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {type === "income"
                      ? "Record money you received."
                      : "Record money you spent."}
                  </p>
                </div>

                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="rounded-lg px-3 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Transaction Type
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTypeChange("expense")}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        type === "expense"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Expense
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange("income")}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        type === "income"
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {type === "income"
                      ? "Income Source"
                      : "What did you spend on?"}
                  </label>

                  <input
                    id="description"
                    type="text"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder={
                      type === "income"
                        ? "e.g. Monthly Salary"
                        : "e.g. Netflix Subscription"
                    }
                    maxLength={100}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ₹
                    </span>

                    <input
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      placeholder="0"
                      required
                      className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {type === "income"
                      ? "Income Category"
                      : "Expense Category"}
                  </label>

                  <select
                    id="category"
                    value={category}
                    onChange={(event) =>
                      handleCategoryChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  >
                    {Object.keys(categories).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="subcategory"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {type === "income"
                      ? "Income Subcategory"
                      : "Expense Subcategory"}
                  </label>

                  <select
                    id="subcategory"
                    value={subcategory}
                    onChange={(event) => {
                      setSubcategory(event.target.value);

                      if (event.target.value !== "Other") {
                        setCustomSubcategory("");
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  >
                    {subcategories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  {subcategory === "Other" && (
                    <input
                      type="text"
                      value={customSubcategory}
                      onChange={(event) =>
                        setCustomSubcategory(event.target.value)
                      }
                      placeholder="Enter your own subcategory"
                      maxLength={50}
                      required
                      className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                    />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="date"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Date
                  </label>

                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                  />
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
                      : editingTransaction
                        ? "Update Transaction"
                        : "Add Transaction"}
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