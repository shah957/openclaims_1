import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
            Dashboard
          </p>
          <h2 className="mt-4 text-2xl font-bold text-[--color-primary]">
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
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
