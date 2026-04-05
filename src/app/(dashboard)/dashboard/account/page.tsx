import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getOrganizerUser } from "@/lib/dashboard";
import { hasSupabaseConfig } from "@/lib/env";

export default async function AccountPage() {
  const user = await getOrganizerUser();

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Account
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[var(--color-primary)]">
          Manage your organizer session
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Use this page to confirm which organizer account is active and sign out
          cleanly before switching accounts.
        </p>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Signed-in email</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">
              {user?.email ?? "No live organizer session"}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Auth mode</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">
              {hasSupabaseConfig() ? "Supabase auth" : "Demo / local UI preview"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
          <Link
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            href="/auth"
          >
            Open auth page
          </Link>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
