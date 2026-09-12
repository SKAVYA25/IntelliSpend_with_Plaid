"use client";

import { FormEvent, useEffect, useState } from "react";

type Goal = {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [deadline, setDeadline] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadGoals() {
      try {
        const response = await fetch("/api/goals");

        if (!response.ok) {
          throw new Error("Failed to fetch goals");
        }

        const data = await response.json();
        setGoals(data);
      } catch (error) {
        console.error("Failed to load goals:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGoals();
  }, []);

  function resetForm() {
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    setDeadline("");
    setEditingGoal(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function handleEdit(goal: Goal) {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount);
    setCurrentAmount(goal.currentAmount);
    setDeadline(
      goal.deadline ? goal.deadline.slice(0, 10) : ""
    );
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const target = Number(targetAmount);
    const current = Number(currentAmount);

    if (!trimmedName) {
      alert("Please enter a goal name.");
      return;
    }

    if (trimmedName.length > 100) {
      alert("Goal name must be under 100 characters.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      alert("Target amount must be greater than 0.");
      return;
    }

    if (!Number.isFinite(current) || current < 0) {
      alert("Current amount cannot be negative.");
      return;
    }

    if (current > target) {
      alert("Current amount cannot be greater than the target amount.");
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingGoal !== null;

      const response = await fetch("/api/goals", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isEditing ? { id: editingGoal.id } : {}),
          name: trimmedName,
          targetAmount: target,
          currentAmount: current,
          deadline: deadline || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save goal");
      }

      if (isEditing) {
        setGoals((currentGoals) =>
          currentGoals.map((goal) =>
            goal.id === data.id ? data : goal
          )
        );
      } else {
        setGoals((currentGoals) => [data, ...currentGoals]);
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save goal:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save goal. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/goals", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete goal");
      }

      setGoals((currentGoals) =>
        currentGoals.filter((goal) => goal.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete goal:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete goal. Please try again."
      );
    }
  }

  const totalTarget = goals.reduce(
    (total, goal) => total + Number(goal.targetAmount),
    0
  );

  const totalSaved = goals.reduce(
    (total, goal) => total + Number(goal.currentAmount),
    0
  );

  const totalRemaining = totalTarget - totalSaved;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Goals
            </h1>

            <p className="mt-1 text-slate-600">
              Set financial goals and track your progress.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            + Add Goal
          </button>
        </div>

        {/* Summary */}
        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Target
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹{totalTarget.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Saved
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              ₹{totalSaved.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Remaining
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹{totalRemaining.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Goals */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold">
              Your Financial Goals
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track how close you are to reaching each goal.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-slate-500">
              Loading goals...
            </div>
          ) : goals.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-700">
                No goals yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first financial goal to start saving.
              </p>

              <button
                onClick={openAddForm}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
              >
                Create Goal
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {goals.map((goal) => {
                const target = Number(goal.targetAmount);
                const saved = Number(goal.currentAmount);

                const percentage =
                  target > 0
                    ? Math.min((saved / target) * 100, 100)
                    : 0;

                const remaining = target - saved;

                return (
                  <div key={goal.id} className="p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {goal.name}
                            </h3>

                            {goal.deadline && (
                              <p className="mt-1 text-sm text-slate-500">
                                Deadline:{" "}
                                {new Date(
                                  goal.deadline
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-slate-900">
                            {Math.round(percentage)}%
                          </p>
                        </div>

                        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-900 transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-slate-600">
                            ₹{saved.toLocaleString("en-IN")} saved of ₹
                            {target.toLocaleString("en-IN")}
                          </p>

                          <p className="font-medium text-slate-900">
                            {remaining > 0
                              ? `₹${remaining.toLocaleString(
                                  "en-IN"
                                )} remaining`
                              : "🎉 Goal completed!"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(goal)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(goal.id)}
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

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingGoal ? "Edit Goal" : "Add Goal"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Set your target and track your savings.
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
                    htmlFor="goal-name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Goal Name
                  </label>

                  <input
                    id="goal-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="e.g. New Laptop"
                    maxLength={100}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="target-amount"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Target Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ₹
                    </span>

                    <input
                      id="target-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={targetAmount}
                      onChange={(event) =>
                        setTargetAmount(event.target.value)
                      }
                      placeholder="80000"
                      required
                      className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="current-amount"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Current Saved Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ₹
                    </span>

                    <input
                      id="current-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentAmount}
                      onChange={(event) =>
                        setCurrentAmount(event.target.value)
                      }
                      placeholder="0"
                      required
                      className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="goal-deadline"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Deadline
                  </label>

                  <input
                    id="goal-deadline"
                    type="date"
                    value={deadline}
                    onChange={(event) =>
                      setDeadline(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
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
                      : editingGoal
                        ? "Update Goal"
                        : "Add Goal"}
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