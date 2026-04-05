import { StatusBadge } from "@/components/shared/status-badge";
import type { DashboardClaim } from "@/types/dashboard";

export function ClaimsTable({
  claims,
  emptyMessage,
}: {
  claims: DashboardClaim[];
  emptyMessage: string;
}) {
  if (claims.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Claim</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id} className="border-t border-slate-100">
                <td className="px-4 py-4">
                  <p className="font-mono text-xs text-slate-500">{claim.id}</p>
                  <p className="mt-1 font-medium text-[var(--color-primary)]">
                    {claim.description || "No description"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={claim.status as never} />
                </td>
                <td className="px-4 py-4 font-medium text-[var(--color-primary)]">
                  ${claim.amount_requested.toFixed(2)}
                </td>
                <td className="px-4 py-4 text-slate-600">{claim.category}</td>
                <td className="px-4 py-4 text-slate-600">
                  {claim.confidence_score === null
                    ? "Pending"
                    : claim.confidence_score.toFixed(2)}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {new Date(claim.submitted_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
