import Link from "next/link";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between rounded-full border border-slate-200/80 bg-white/85 px-5 py-3 shadow-sm backdrop-blur">
      <Link className="flex items-center gap-3" href="/">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white">
          OC
        </span>
        <span>
          <span className="block text-sm font-semibold text-[var(--color-primary)]">
            OpenClaims Ops
          </span>
          <span className="block text-xs text-slate-500">
            Catapult Hacks 2026
          </span>
        </span>
      </Link>

      <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
        <a href="#how-it-works">How it works</a>
        <a href="#world-id">Why World ID</a>
        <Link
          className="rounded-full bg-[var(--color-primary)] px-4 py-2 font-medium text-white"
          href="/auth"
        >
          Create a Program
        </Link>
      </div>
    </nav>
  );
}
