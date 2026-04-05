import { notFound } from "next/navigation";
import { ClaimDetail } from "@/components/claims/claim-detail";
import { ReviewActions } from "@/components/claims/review-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { getProgramDashboard } from "@/lib/dashboard";

type ReviewQueuePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReviewQueuePage({ params }: ReviewQueuePageProps) {
  const { id } = await params;
  const dashboard = await getProgramDashboard(id);

  if (!dashboard.program) {
    notFound();
  }

  const flaggedClaims = dashboard.claims.filter((claim) => claim.status === "flagged");

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Review Queue
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[var(--color-primary)]">
          Flagged claims for {dashboard.program.name}
        </h1>
        <p className="mt-4 text-slate-600">
          This queue shows the claims that need human judgment before payout.
        </p>
      </section>

      {flaggedClaims.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
          No flagged claims are waiting for review.
        </section>
      ) : (
        <section className="space-y-5">
          {flaggedClaims.map((claim) => (
            <article
              key={claim.id}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-slate-500">{claim.id}</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--color-primary)]">
                    {claim.description || "Flagged claim"}
                  </h2>
                </div>
                <StatusBadge status={claim.status as never} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">
                    ${claim.amount_requested.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Confidence</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">
                    {claim.confidence_score?.toFixed(2) ?? "Pending"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Merchant</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">
                    {claim.extraction_result?.merchant_name ?? "Unknown"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <ClaimDetail claim={claim} />
              </div>

              <div className="mt-6">
                <ReviewActions
                  claimId={claim.id}
                  requestedAmount={claim.amount_requested}
                />
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
