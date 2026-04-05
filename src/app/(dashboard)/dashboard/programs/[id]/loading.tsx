import { LoadingPanel } from "@/components/shared/loading-panel";

export default function ProgramDetailLoading() {
  return (
    <main className="space-y-6">
      <LoadingPanel title="Program detail" lines={4} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`stat-card-${index}`}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-8 w-28 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </section>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-72 animate-pulse rounded-[1.5rem] bg-slate-100" />
      </div>
    </main>
  );
}
