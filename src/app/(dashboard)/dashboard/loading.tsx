import { LoadingPanel } from "@/components/shared/loading-panel";

export default function DashboardLoading() {
  return (
    <main className="space-y-6">
      <LoadingPanel title="Dashboard" lines={3} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`dashboard-card-${index}`}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-7 w-32 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-6 h-20 animate-pulse rounded-[1rem] bg-slate-50" />
          </div>
        ))}
      </section>
    </main>
  );
}
