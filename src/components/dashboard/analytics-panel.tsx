"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardClaim, DashboardStats } from "@/types/dashboard";

function buildStatusData(stats: DashboardStats) {
  return [
    { name: "Approved", value: stats.approved, fill: "#22c55e" },
    { name: "Rejected", value: stats.rejected, fill: "#ef4444" },
    { name: "Flagged", value: stats.flagged, fill: "#f59e0b" },
    { name: "Pending", value: stats.pending, fill: "#3b82f6" },
  ];
}

function buildClaimsOverTimeData(claims: DashboardClaim[]) {
  const grouped = new Map<string, { submitted: number; approved: number }>();

  claims.forEach((claim) => {
    const date = new Date(claim.submitted_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const entry = grouped.get(date) ?? { submitted: 0, approved: 0 };
    entry.submitted += 1;
    if (["auto_approved", "manually_approved"].includes(claim.status)) {
      entry.approved += 1;
    }
    grouped.set(date, entry);
  });

  return Array.from(grouped.entries()).map(([date, values]) => ({
    date,
    ...values,
  }));
}

export function AnalyticsPanel({
  claims,
  stats,
  budgetCommitted,
  budgetTotal,
}: {
  claims: DashboardClaim[];
  stats: DashboardStats;
  budgetCommitted: number;
  budgetTotal: number;
}) {
  const statusData = buildStatusData(stats);
  const claimsOverTime = buildClaimsOverTimeData(claims);
  const budgetData = [
    { name: "Committed", amount: budgetCommitted, fill: "#1a1f36" },
    {
      name: "Remaining",
      amount: Math.max(budgetTotal - budgetCommitted, 0),
      fill: "#cbd5e1",
    },
  ];

  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <h2 className="text-xl font-semibold text-[var(--color-primary)]">
          Claims over time
        </h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={claimsOverTime}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="submitted" fill="#6c63ff" radius={[8, 8, 0, 0]} />
              <Bar dataKey="approved" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--color-primary)]">
          Status distribution
        </h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={statusData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
        <h2 className="text-xl font-semibold text-[var(--color-primary)]">
          Budget burn
        </h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={90} />
              <Tooltip />
              <Bar dataKey="amount" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
