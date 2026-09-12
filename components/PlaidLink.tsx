"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

type BankConnection = {
  plaidItemId: string;
  itemId: string;
  institutionName: string;
};

export default function PlaidLink() {
  const router = useRouter();

  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [banks, setBanks] = useState<BankConnection[]>([]);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(
    null
  );

  const [showBankSelector, setShowBankSelector] = useState(false);
  const [selectedBank, setSelectedBank] =
    useState<BankConnection | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Prevent duplicate requests during React development re-renders.
  const connectionLoadedRef = useRef(false);
  const creatingLinkTokenRef = useRef(false);
  const syncingTransactionsRef = useRef(false);
  const initialSyncCompletedRef = useRef(false);

  const syncTransactions = async (refreshDashboard = true) => {
    if (syncingTransactionsRef.current) {
      return;
    }

    syncingTransactionsRef.current = true;

    try {
      console.log("Starting Plaid transaction sync...");

      const syncResponse = await fetch("/api/plaid/transactions", {
        method: "GET",
        cache: "no-store",
      });

      const syncData = await syncResponse.json();

      if (syncResponse.ok && syncData.success) {
        console.log(
          "Plaid transactions synced successfully:",
          syncData
        );

        if (refreshDashboard) {
          router.refresh();
        }
      } else {
        console.error(
          "Plaid transaction sync failed:",
          syncData
        );
      }
    } catch (error) {
      console.error(
        "Error syncing Plaid transactions:",
        error
      );
    } finally {
      syncingTransactionsRef.current = false;
    }
  };

  const loadConnection = async () => {
    try {
      setLoadingConnection(true);

      const response = await fetch("/api/plaid/exchange-token", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok) {
        const connectedBanks = data.banks || [];

        setBanks(connectedBanks);

        return connectedBanks as BankConnection[];
      } else {
        console.error(
          "Failed to get Plaid connections:",
          data
        );

        setBanks([]);
        return [];
      }
    } catch (error) {
      console.error(
        "Error checking Plaid connections:",
        error
      );

      setBanks([]);
      return [];
    } finally {
      setLoadingConnection(false);
    }
  };

  useEffect(() => {
    if (connectionLoadedRef.current) {
      return;
    }

    connectionLoadedRef.current = true;

    const initializeConnection = async () => {
      const connectedBanks = await loadConnection();

      /*
       * If a Plaid bank is already connected, automatically
       * sync its transactions when the component loads.
       *
       * This is important for existing connections because
       * the initial transaction sync in exchange-token POST
       * only runs when a new Plaid connection is created.
       */
      if (
        connectedBanks.length > 0 &&
        !initialSyncCompletedRef.current
      ) {
        initialSyncCompletedRef.current = true;

        await syncTransactions(true);
      }
    };

    initializeConnection();
  }, []);

  const createLinkToken = async () => {
    if (creatingLinkTokenRef.current) {
      return;
    }

    // Don't create another token if one already exists.
    if (linkToken) {
      return;
    }

    creatingLinkTokenRef.current = true;

    try {
      const response = await fetch(
        "/api/plaid/create-link-token",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.link_token) {
        setLinkToken(data.link_token);
      } else {
        console.error(
          "Failed to get Plaid Link token:",
          data
        );
      }
    } catch (error) {
      console.error(
        "Error creating Plaid Link token:",
        error
      );
    } finally {
      creatingLinkTokenRef.current = false;
    }
  };

  useEffect(() => {
    if (!loadingConnection && !linkToken) {
      createLinkToken();
    }
  }, [loadingConnection, linkToken]);

  const { open, ready } = usePlaidLink({
    token: linkToken,

    onSuccess: async (publicToken, metadata) => {
      console.log("Plaid connection successful!");
      console.log("Metadata:", metadata);

      try {
        const response = await fetch(
          "/api/plaid/exchange-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              public_token: publicToken,
            }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          console.log(
            "Plaid account saved successfully!"
          );

          console.log(data.message);

          /*
           * The server-side exchange-token POST already performs
           * the initial transaction sync for a newly connected bank.
           *
           * We also call the sync route here so the dashboard
           * remains consistent with the existing sync flow.
           */
          setLinkToken(null);

          console.log(
            "Starting automatic Plaid transaction sync..."
          );

          await syncTransactions(true);

          /*
           * Reload connected banks.
           */
          await loadConnection();

          /*
           * Tell the Financial Accounts component that the
           * connected accounts have changed.
           *
           * This makes newly connected cards/accounts appear
           * immediately without requiring a browser refresh.
           */
          window.dispatchEvent(
            new Event("plaid-accounts-updated")
          );
        } else {
          console.error(
            "Failed to save Plaid account:",
            data
          );
        }
      } catch (error) {
        console.error(
          "Error saving Plaid account:",
          error
        );
      }
    },
  });

  const handleDisconnectClick = () => {
    setSelectedBank(null);
    setShowConfirmation(false);
    setShowBankSelector(true);
  };

  const handleContinueDisconnect = () => {
    if (!selectedBank) {
      return;
    }

    setShowBankSelector(false);
    setShowConfirmation(true);
  };

  const handleCancelDisconnect = () => {
    setShowBankSelector(false);
    setShowConfirmation(false);
    setSelectedBank(null);
  };

  const handleConfirmDisconnect = async () => {
    if (!selectedBank) {
      return;
    }

    try {
      setDisconnectingId(selectedBank.plaidItemId);

      const response = await fetch(
        "/api/plaid/exchange-token",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plaidItemId: selectedBank.plaidItemId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setShowConfirmation(false);
        setSelectedBank(null);

        await loadConnection();

        /*
         * Tell the Financial Accounts component that the
         * connected accounts have changed.
         *
         * This removes the disconnected bank's cards immediately
         * without requiring a browser refresh.
         */
        window.dispatchEvent(
          new Event("plaid-accounts-updated")
        );
      } else {
        console.error(
          "Failed to disconnect Plaid account:",
          data
        );

        alert(
          data.error ||
            "Failed to disconnect bank account."
        );
      }
    } catch (error) {
      console.error(
        "Error disconnecting Plaid account:",
        error
      );

      alert(
        "Something went wrong while disconnecting the bank account."
      );
    } finally {
      setDisconnectingId(null);
    }
  };

  if (loadingConnection) {
    return (
      <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
        Checking bank...
      </div>
    );
  }

  if (banks.length === 0) {
    return (
      <button
        type="button"
        onClick={() => open()}
        disabled={!ready}
        className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ready
          ? "Connect Bank Account"
          : "Loading..."}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {/* Connected bank cards */}
      <div className="flex flex-col gap-3">
        {banks.map((bank) => (
          <div
            key={bank.plaidItemId}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🏦</span>

              <div>
                <p className="text-sm font-medium text-slate-900">
                  {bank.institutionName ||
                    "Bank Account"}
                </p>

                <p className="text-xs text-emerald-600">
                  Connected
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main connection controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleDisconnectClick}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
        >
          Disconnect
        </button>

        <button
          type="button"
          onClick={() => open()}
          disabled={!ready}
          className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ready
            ? "+ Connect Another Bank"
            : "Loading..."}
        </button>
      </div>

      {/* Bank selection box */}
      {showBankSelector && (
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Disconnect a bank
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Select the bank you want to disconnect.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {banks.map((bank) => {
              const isSelected =
                selectedBank?.plaidItemId ===
                bank.plaidItemId;

              return (
                <button
                  key={bank.plaidItemId}
                  type="button"
                  onClick={() =>
                    setSelectedBank(bank)
                  }
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base">
                    🏦
                  </span>

                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-900">
                      {bank.institutionName ||
                        "Bank Account"}
                    </span>

                    <span className="mt-0.5 block text-xs text-emerald-600">
                      Connected
                    </span>
                  </span>

                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-slate-900"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelDisconnect}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleContinueDisconnect}
              disabled={!selectedBank}
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Confirmation box */}
      {showConfirmation && selectedBank && (
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Disconnect{" "}
              {selectedBank.institutionName}?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              If you disconnect, you'll need to log in
              through Plaid again to connect this bank.
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowConfirmation(false);
                setShowBankSelector(true);
              }}
              disabled={disconnectingId !== null}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleConfirmDisconnect}
              disabled={disconnectingId !== null}
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {disconnectingId !== null
                ? "Disconnecting..."
                : "Disconnect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
