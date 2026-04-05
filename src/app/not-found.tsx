import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Not Found
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[var(--color-primary)]">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-4 text-slate-600">
          The link may be expired, the program may not exist, or the route has
          not been set up yet.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            className="rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white"
            href="/"
          >
            Go Home
          </Link>
          <Link
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            href="/dashboard"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
