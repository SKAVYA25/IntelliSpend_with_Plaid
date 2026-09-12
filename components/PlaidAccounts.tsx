"use client";

import { useEffect, useState } from "react";

type PlaidAccount = {
  accountId: string;
  plaidItemId: string;
  institutionName?: string | null;
  name: string;
  officialName?: string | null;
  mask?: string | null;
  type: string;
  subtype?: string | null;
};

type PlaidBank = {
  plaidItemId: string;
  itemId: string;
  institutionName: string;
  accounts: PlaidAccount[];
};

export default function PlaidAccounts() {
  const [banks, setBanks] = useState<PlaidBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBanks, setExpandedBanks] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/plaid/accounts", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        console.log("Plaid accounts response:", data);

        if (!response.ok) {
          setError(
            data.error || "Failed to load connected accounts."
          );
          return;
        }

        if (!data.success) {
          setError("Failed to load connected accounts.");
          return;
        }

        setBanks(data.banks || []);
      } catch (error) {
        console.error("Error loading Plaid accounts:", error);
        setError("Unable to load connected accounts.");
      } finally {
        setLoading(false);
      }
    };

    // Initial account load.
    loadAccounts();

    // Reload accounts whenever a Plaid connection changes.
    const handlePlaidAccountsUpdated = () => {
      console.log(
        "Plaid account update detected. Reloading accounts..."
      );

      loadAccounts();
    };

    window.addEventListener(
      "plaid-accounts-updated",
      handlePlaidAccountsUpdated
    );

    return () => {
      window.removeEventListener(
        "plaid-accounts-updated",
        handlePlaidAccountsUpdated
      );
    };
  }, []);

  const toggleBank = (plaidItemId: string) => {
    setExpandedBanks((current) => ({
      ...current,
      [plaidItemId]: !current[plaidItemId],
    }));
  };

  const getAccountType = (account: PlaidAccount) => {
    if (
      account.type === "credit" ||
      account.subtype === "credit card"
    ) {
      return "Credit Card";
    }

    if (account.subtype === "checking") {
      return "Debit / Checking";
    }

    if (account.subtype === "savings") {
      return "Savings";
    }

    if (account.subtype === "money market") {
      return "Money Market";
    }

    if (account.type === "investment") {
      return "Investment";
    }

    if (account.type === "loan") {
      return "Loan";
    }

    if (account.subtype) {
      return account.subtype
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    return account.type;
  };

  const getAccountIcon = (account: PlaidAccount) => {
    if (
      account.type === "credit" ||
      account.subtype === "credit card"
    ) {
      return "💳";
    }

    if (account.type === "investment") {
      return "📈";
    }

    if (account.type === "loan") {
      return "🏠";
    }

    return "🏦";
  };

  const renderDebitCard = (
    bank: PlaidBank,
    account: PlaidAccount
  ) => {
    const lastFour = account.mask || "••••";

    return (
      <div className="group relative min-h-[235px] overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-950 via-slate-800 to-slate-700 p-6 text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                Debit / Checking
              </p>

              <p className="mt-2 max-w-[190px] truncate text-lg font-semibold tracking-tight">
                {bank.institutionName || "Connected Bank"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-lg backdrop-blur-sm">
              🏦
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="relative h-9 w-12 overflow-hidden rounded-md border border-yellow-200/40 bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-500">
              <div className="absolute left-1/2 top-0 h-full w-px bg-yellow-700/30" />
              <div className="absolute left-0 top-1/2 h-px w-full bg-yellow-700/30" />
              <div className="absolute left-1/4 top-1/4 h-1/2 w-1/2 rounded-sm border border-yellow-700/30" />
            </div>

            <span className="text-xl text-white/70">)))</span>
          </div>

          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              Account
            </p>

            <p className="mt-1 font-mono text-xl tracking-[0.18em] text-white">
              •••• •••• •••• {lastFour}
            </p>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                Account name
              </p>

              <p className="mt-1 max-w-[190px] truncate text-sm font-medium text-white/90">
                {account.name}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                Status
              </p>

              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Connected
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCreditCard = (
    bank: PlaidBank,
    account: PlaidAccount
  ) => {
    const lastFour = account.mask || "••••";

    return (
      <div className="group relative min-h-[235px] overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-900 p-6 text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-20 h-16 w-[150%] rotate-[25deg] bg-white/5 blur-xl" />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                Credit Card
              </p>

              <p className="mt-2 max-w-[190px] truncate text-lg font-semibold tracking-tight">
                {bank.institutionName || "Connected Bank"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-lg backdrop-blur-sm">
              💳
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="relative h-9 w-12 overflow-hidden rounded-md border border-yellow-200/40 bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-500">
              <div className="absolute left-1/2 top-0 h-full w-px bg-yellow-700/30" />
              <div className="absolute left-0 top-1/2 h-px w-full bg-yellow-700/30" />
              <div className="absolute left-1/4 top-1/4 h-1/2 w-1/2 rounded-sm border border-yellow-700/30" />
            </div>

            <span className="text-xl text-white/70">)))</span>
          </div>

          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              Card number
            </p>

            <p className="mt-1 font-mono text-xl tracking-[0.18em] text-white">
              •••• •••• •••• {lastFour}
            </p>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                Card
              </p>

              <p className="mt-1 max-w-[190px] truncate text-sm font-medium text-white/90">
                {account.name}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                IntelliSpend
              </p>

              <p className="mt-1 text-xs font-semibold tracking-wider text-white/80">
                FINANCE
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBankAccounts = (bank: PlaidBank) => {
    const accounts = bank.accounts || [];

    const checkingAccount =
      accounts.find(
        (account) => account.subtype === "checking"
      ) ||
      accounts.find(
        (account) => account.type === "depository"
      );

    const creditCard = accounts.find(
      (account) =>
        account.type === "credit" ||
        account.subtype === "credit card"
    );

    const primaryAccountIds = new Set(
      [
        checkingAccount?.accountId,
        creditCard?.accountId,
      ].filter(Boolean)
    );

    const otherAccounts = accounts.filter(
      (account) => !primaryAccountIds.has(account.accountId)
    );

    const isExpanded =
      expandedBanks[bank.plaidItemId] || false;

    return (
      <div
        key={bank.plaidItemId}
        className="overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
              🏦
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                {bank.institutionName || "Connected Bank"}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <p className="text-xs font-medium text-emerald-600">
                  Connected
                </p>
              </div>
            </div>
          </div>

          <div className="w-fit rounded-full bg-slate-50 px-3 py-1.5">
            <p className="text-xs font-medium text-slate-500">
              {accounts.length} account
              {accounts.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {checkingAccount &&
            renderDebitCard(bank, checkingAccount)}

          {creditCard &&
            renderCreditCard(bank, creditCard)}
        </div>

        {otherAccounts.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => toggleBank(bank.plaidItemId)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  + {otherAccounts.length} other connected account
                  {otherAccounts.length === 1 ? "" : "s"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {isExpanded
                    ? "Hide additional accounts"
                    : "View savings, investments, loans and other accounts"}
                </p>
              </div>

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-500">
                {isExpanded ? "⌃" : "⌄"}
              </span>
            </button>

            {isExpanded && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                {otherAccounts.map((account, index) => (
                  <div
                    key={account.accountId}
                    className={`flex items-center justify-between gap-4 px-4 py-4 ${
                      index !== otherAccounts.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-lg">
                        {getAccountIcon(account)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {account.name}
                        </p>

                        <p className="mt-1 text-xs capitalize text-slate-400">
                          {getAccountType(account)}
                        </p>
                      </div>
                    </div>

                    {account.mask && (
                      <p className="shrink-0 text-sm font-medium text-slate-500">
                        •••• {account.mask}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Financial Accounts
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your connected bank accounts and cards
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-5">
          <p className="text-sm text-slate-400">
            Loading your financial accounts...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Financial Accounts
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your connected bank accounts and cards
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-red-50 p-5">
          <p className="text-sm font-medium text-red-600">
            {error}
          </p>
        </div>
      </section>
    );
  }

  if (banks.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Connected finances
          </p>

          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Financial Accounts
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your connected bank accounts and cards
          </p>
        </div>

        <p className="text-xs font-medium text-slate-400">
          {banks.length} connected bank
          {banks.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {banks.map((bank) => renderBankAccounts(bank))}
      </div>
    </section>
  );
}
