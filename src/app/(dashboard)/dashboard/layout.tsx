import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getOrganizerUser } from "@/lib/dashboard";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const organizer = await getOrganizerUser();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Dashboard
          </p>
          <h2 className="mt-4 text-2xl font-bold text-[var(--color-primary)]">
            Organizer Portal
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Create programs, monitor claims, and review the flagged queue here.
          </p>
          <nav className="mt-8 space-y-3 text-sm text-slate-600">
            <Link className="block rounded-2xl bg-slate-50 px-4 py-3" href="/dashboard">
              Overview
            </Link>
            <Link
              className="block rounded-2xl bg-slate-50 px-4 py-3"
              href="/dashboard/programs/new"
            >
              New Program
            </Link>
            <Link
              className="block rounded-2xl bg-slate-50 px-4 py-3"
              href="/dashboard/account"
            >
              Account
            </Link>
          </nav>
          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Session
            </p>
            <p className="mt-3 break-all text-sm font-medium text-[var(--color-primary)]">
              {organizer?.email ?? "Demo mode or not signed in"}
            </p>
            <div className="mt-4">
              <SignOutButton className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60" />
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
