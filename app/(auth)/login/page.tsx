"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginPageContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const urlError = searchParams.get("error");

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="text-2xl font-bold text-slate-900"
            >
              IntelliSpend
            </Link>

            <p className="mt-2 text-sm text-slate-500">
              Welcome back. Sign in to manage your finances.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Sign in
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Access your IntelliSpend dashboard.
            </p>

            {(error || urlError) && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error || "Unable to sign in. Please try again."}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
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
                          d="M10.58 10.58a2 2 0 002.84 2.84"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 8.73 3.11 10 8a10.97 10.97 0 01-4.02 5.32"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.61 6.61C4.62 7.93 3.2 9.73 2 12c1.27 4.89 5 8 10 8 1.61 0 3.09-.34 4.42-.95"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-slate-900 hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
