import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimsTable } from "@/components/dashboard/claims-table";
import { getProgramDashboard } from "@/lib/dashboard";

type ExportPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExportPage({ params }: ExportPageProps) {
  const { id } = await params;
  const dashboard = await getProgramDashboard(id);

  if (!dashboard.program) {
    notFound();
  }

  const approvedClaims = dashboard.claims.filter((claim) =>
    ["auto_approved", "manually_approved"].includes(claim.status),
  );

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Export
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[var(--color-primary)]">
          Approved claims for payout
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Preview the approved claims and export a CSV for your payout tool.
        </p>

        <div className="mt-6">
          <Link
            className="inline-flex rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-white"
            href={`/api/programs/${dashboard.program.id}/export`}
          >
            Download CSV
          </Link>
        </div>
      </section>

      <ClaimsTable
        claims={approvedClaims}
        emptyMessage="There are no approved claims ready for export."
      />
    </main>
  );
}
