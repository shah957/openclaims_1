import type { DashboardClaim } from "@/types/dashboard";

export function ClaimDetail({ claim }: { claim: DashboardClaim }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-lg font-semibold text-[var(--color-primary)]">
          Extracted document data
        </h3>
        {claim.extraction_result ? (
          <div className="mt-4 space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Merchant
                </dt>
                <dd className="mt-2 text-sm font-medium text-[var(--color-primary)]">
                  {claim.extraction_result.merchant_name ?? "Unknown"}
                </dd>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Total amount
                </dt>
                <dd className="mt-2 text-sm font-medium text-[var(--color-primary)]">
                  {claim.extraction_result.total_amount === null
                    ? "Unknown"
                    : `$${claim.extraction_result.total_amount.toFixed(2)}`}
                </dd>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Date
                </dt>
                <dd className="mt-2 text-sm font-medium text-[var(--color-primary)]">
                  {claim.extraction_result.date ?? "Unknown"}
                </dd>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Confidence
                </dt>
                <dd className="mt-2 text-sm font-medium text-[var(--color-primary)]">
                  {claim.extraction_result.confidence.toFixed(2)}
                </dd>
              </div>
            </dl>

            {claim.extraction_result.debug ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Debug metadata
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Source:{" "}
                    <span className="font-semibold text-[var(--color-primary)]">
                      {claim.extraction_result.debug.source}
                    </span>
                    {" · "}
                    Provider:{" "}
                    <span className="font-semibold text-[var(--color-primary)]">
                      {claim.extraction_result.debug.provider ?? "unknown"}
                    </span>
                    {claim.extraction_result.debug.model
                      ? ` · Model: ${claim.extraction_result.debug.model}`
                      : ""}
                  </p>
                </div>

                {claim.extraction_result.debug.llm_output_raw ? (
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Gemini output
                    </p>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
                      {claim.extraction_result.debug.llm_output_raw}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No extraction data is available yet.
          </p>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-lg font-semibold text-[var(--color-primary)]">
          Rules engine results
        </h3>
        {claim.rule_check_result?.length ? (
          <ul className="mt-4 space-y-3">
            {claim.rule_check_result.map((rule, index) => (
              <li
                key={`${claim.id}-${rule.rule}-${index}`}
                className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700"
              >
                <span className="font-semibold text-[var(--color-primary)]">
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
