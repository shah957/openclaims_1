import { LoadingPanel } from "@/components/shared/loading-panel";

export default function ClaimPageLoading() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <LoadingPanel title="Claim page" lines={3} />
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-64 animate-pulse rounded-[1.5rem] bg-slate-100" />
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-80 animate-pulse rounded-[1.5rem] bg-slate-100" />
          </div>
        </section>
      </div>
    </main>
  );
}
