"use client";

import { FormEvent, useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type User = {
  id: string;
  name: string | null;
  email: string;
  createdAt?: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const response = await fetch("/api/settings");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load profile");
      }

      setUser(data);
      setName(data.name || "");
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setProfileError("Name must be at least 2 characters.");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update profile"
        );
      }

      setUser(data.user);
      setName(data.user.name || "");
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to update profile"
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to change password"
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-sm text-slate-500">
              Loading settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Settings
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your IntelliSpend account and profile.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update your personal information.
              </p>
            </div>

            <form
              onSubmit={handleProfileSubmit}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600 placeholder:text-slate-400"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Email cannot be changed from settings.
                </p>
              </div>

              {profileError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {profileError}
                </div>
              )}

              {profileMessage && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {profileMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          {/* Account */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Account
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Account ID
                </p>

                <p className="mt-1 break-all text-sm text-slate-600">
                  {user?.id}
                </p>
              </div>

              {user?.createdAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Member Since
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-5">
                <button
                  onClick={() =>
                    signOut({
                      callbackUrl: "/welcome",
                    })
                  }
                  className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </section>

          {/* Change Password */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Change Password
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep your account secure with a strong password.
              </p>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-5"
            >
              {/* Current Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Current Password
                </label>

                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(event.target.value)
                    }
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword((current) => !current)
                    }
                    aria-label={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showCurrentPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.58 10.58a2 2 0 102.83 2.83"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 8.5 4 9.5 6-.36.72-1.1 1.72-2.2 2.7"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.61 6.61C4.67 7.83 3.44 9.38 2.5 10c1 2 4.5 6 9.5 6 1.13 0 2.18-.18 3.13-.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                        />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  New Password
                </label>

                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword((current) => !current)
                    }
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showNewPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.58 10.58a2 2 0 102.83 2.83"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 8.5 4 9.5 6-.36.72-1.1 1.72-2.2 2.7"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.61 6.61C4.67 7.83 3.44 7.83 2.5 10c1 2 4.5 6 9.5 6 1.13 0 2.18-.18 3.13-.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                        />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Minimum 6 characters.
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.58 10.58a2 2 0 102.83 2.83"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 8.5 4 9.5 6-.36.72-1.1 1.72-2.2 2.7"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.61 6.61C4.67 7.83 3.44 7.83 2.5 10c1 2 4.5 6 9.5 6 1.13 0 2.18-.18 3.13-.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                        />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {passwordMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changingPassword
                  ? "Changing Password..."
                  : "Change Password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
