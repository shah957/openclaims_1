import type { DashboardStats } from "@/types/dashboard";

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const items = [
    ["Total claims", stats.total.toString(), "text-[var(--color-primary)]"],
    ["Approved", stats.approved.toString(), "text-[var(--color-success)]"],
    ["Rejected", stats.rejected.toString(), "text-[var(--color-error)]"],
    ["Flagged", stats.flagged.toString(), "text-[var(--color-warning)]"],
    ["Pending", stats.pending.toString(), "text-blue-700"],
    ["Budget left", `$${stats.remainingBudget.toFixed(2)}`, "text-[var(--color-primary)]"],
  ] as const;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value, tone]) => (
        <article
          key={label}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
        </article>
      ))}
    </section>
  );
}
