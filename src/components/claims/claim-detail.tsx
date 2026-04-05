import type { DashboardClaim } from "@/types/dashboard";

export function ClaimDetail({ claim }: { claim: DashboardClaim }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-lg font-semibold text-[--color-primary]">
          Extracted document data
        </h3>
        {claim.extraction_result ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Merchant
              </dt>
              <dd className="mt-2 text-sm font-medium text-[--color-primary]">
                {claim.extraction_result.merchant_name ?? "Unknown"}
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Total amount
              </dt>
              <dd className="mt-2 text-sm font-medium text-[--color-primary]">
                {claim.extraction_result.total_amount === null
                  ? "Unknown"
                  : `$${claim.extraction_result.total_amount.toFixed(2)}`}
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Date
              </dt>
              <dd className="mt-2 text-sm font-medium text-[--color-primary]">
                {claim.extraction_result.date ?? "Unknown"}
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Confidence
              </dt>
              <dd className="mt-2 text-sm font-medium text-[--color-primary]">
                {claim.extraction_result.confidence.toFixed(2)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No extraction data is available yet.
          </p>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-lg font-semibold text-[--color-primary]">
          Rules engine results
        </h3>
        {claim.rule_check_result?.length ? (
          <ul className="mt-4 space-y-3">
            {claim.rule_check_result.map((rule, index) => (
              <li
                key={`${claim.id}-${rule.rule}-${index}`}
                className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700"
              >
                <span className="font-semibold text-[--color-primary]">
                  {rule.rule}
                </span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="capitalize">{rule.severity}</span>
                <p className="mt-2 text-slate-600">{rule.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No rules output has been saved yet.
          </p>
        )}
      </section>
    </div>
  );
}
