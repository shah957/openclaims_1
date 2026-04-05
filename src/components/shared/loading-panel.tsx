export function LoadingPanel({
  title = "Loading",
  lines = 3,
}: {
  title?: string;
  lines?: number;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-5 h-10 w-72 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={`${title}-${index}`}
            className="h-4 animate-pulse rounded-full bg-slate-100"
            style={{ width: `${92 - index * 10}%` }}
          />
        ))}
      </div>
    </section>
  );
}
