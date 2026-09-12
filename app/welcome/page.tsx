import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9f7] text-slate-900">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute -left-32 top-1/2 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Navigation */}
        <header className="flex items-center justify-between py-6">
          <Link href="/welcome" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white shadow-sm">
              I
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                IntelliSpend
              </p>

              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Personal Finance
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-14 pb-20 pt-14 lg:grid-cols-[1fr_0.9fr] lg:pb-28 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Smarter money. Clearer decisions.
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Know where your money
              <span className="text-emerald-600">
                {" "}goes.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
              IntelliSpend brings your income, spending, budgets,
              savings goals and financial insights into one simple
              place.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Start managing your money
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500">
              <span>✓ Track spending</span>
              <span>✓ Plan budgets</span>
              <span>✓ Build goals</span>
              <span>✓ Get insights</span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-emerald-200/50 via-white/20 to-blue-200/50 blur-2xl" />

            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10">
              {/* Preview Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    FINANCIAL OVERVIEW
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    Your money at a glance
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  This month
                </div>
              </div>

              {/* Balance */}
              <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
                <p className="text-xs text-slate-400">
                  Total balance
                </p>

                <p className="mt-2 text-3xl font-bold">
                  ₹50,000
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300">
                  <span>↑</span>
                  <span>Healthy financial overview</span>
                </div>
              </div>

              {/* Mini Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Income
                  </p>

                  <p className="mt-1 text-lg font-bold text-emerald-600">
                    ₹50,000
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Expenses
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    ₹18,400
                  </p>
                </div>
              </div>

              {/* Spending */}
              <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Spending
                    </p>

                    <p className="text-xs text-slate-400">
                      This month
                    </p>
                  </div>

                  <p className="text-sm font-bold text-slate-900">
                    ₹18,400
                  </p>
                </div>

                <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="w-[40%] bg-emerald-500" />
                  <div className="w-[25%] bg-blue-500" />
                  <div className="w-[20%] bg-amber-400" />
                  <div className="w-[15%] bg-violet-500" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Food
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Bills
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    Shopping
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                    Other
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="border-t border-slate-200 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Everything in one place
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Make your finances easier to understand.
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              IntelliSpend turns everyday financial activity into
              information you can actually use.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
                ₹
              </div>

              <h3 className="mt-5 font-semibold">
                Track spending
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Keep your income and expenses organized by category.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                ◫
              </div>

              <h3 className="mt-5 font-semibold">
                Set budgets
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Give every spending category a clear monthly limit.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600">
                ◎
              </div>

              <h3 className="mt-5 font-semibold">
                Reach goals
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Track your progress toward the things you want to
                achieve.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-lg text-violet-600">
                ✦
              </div>

              <h3 className="mt-5 font-semibold">
                Get insights
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Understand your financial patterns with personalized
                insights.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <div className="rounded-[2rem] bg-emerald-600 px-7 py-12 text-center text-white shadow-xl shadow-emerald-900/10 sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your money deserves a clearer picture.
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-emerald-50">
              Start tracking your finances and turn everyday
              spending into better financial decisions.
            </p>

            <Link
              href="/register"
              className="mt-7 inline-block rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Create your IntelliSpend account
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-7 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} IntelliSpend · Smart personal
          finance management
        </footer>
      </div>
    </main>
  );
}