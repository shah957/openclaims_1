import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { ClaimsTable } from "@/components/dashboard/claims-table";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatusBadge } from "@/components/shared/status-badge";
import { getProgramDashboard } from "@/lib/dashboard";

type ProgramDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProgramDetailPage({
  params,
}: ProgramDetailPageProps) {
  const { id } = await params;
  const dashboard = await getProgramDashboard(id);

  if (!dashboard.program || !dashboard.stats) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
              Program Detail
            </p>
            <h1 className="mt-4 text-4xl font-bold text-[--color-primary]">
              {dashboard.program.name}
            </h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              {dashboard.program.description}
            </p>
          </div>
          <StatusBadge status={dashboard.program.status} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-[--color-primary] px-4 py-2 text-sm font-semibold text-white"
            href={`/dashboard/programs/${dashboard.program.id}/review`}
          >
            Open Review Queue
          </Link>
          <Link
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            href={`/dashboard/programs/${dashboard.program.id}/export`}
          >
            Open Export
          </Link>
          <Link
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            href={`/claim/${dashboard.program.slug}`}
          >
            Open Public Claim Link
          </Link>
        </div>
      </section>

      <StatsCards stats={dashboard.stats} />

      <AnalyticsPanel
        budgetCommitted={dashboard.program.budget_committed}
        budgetTotal={dashboard.program.budget_total}
        claims={dashboard.claims}
        stats={dashboard.stats}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[--color-primary]">
            Recent claims
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Latest claim activity for this program.
          </p>
        </div>
        <ClaimsTable
          claims={dashboard.claims}
          emptyMessage="No claims have been submitted yet."
        />
      </section>
    </main>
  );
}
