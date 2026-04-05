import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ProgramSummary } from "@/types/dashboard";

export function ProgramCard({ program }: { program: ProgramSummary }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[--color-primary]">
            {program.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{program.description}</p>
        </div>
        <StatusBadge status={program.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Committed</p>
          <p className="mt-2 text-lg font-semibold text-[--color-primary]">
            ${program.budget_committed.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Total budget</p>
          <p className="mt-2 text-lg font-semibold text-[--color-primary]">
            ${program.budget_total.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="rounded-full bg-[--color-primary] px-4 py-2 text-sm font-semibold text-white"
          href={`/dashboard/programs/${program.id}`}
        >
          Open dashboard
        </Link>
        <Link
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          href={`/claim/${program.slug}`}
        >
          Open claim link
        </Link>
      </div>
    </article>
  );
}
