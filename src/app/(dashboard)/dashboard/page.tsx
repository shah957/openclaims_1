import Link from "next/link";
import { ProgramCard } from "@/components/dashboard/program-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { getOrganizerOverview } from "@/lib/dashboard";

export default async function DashboardPage() {
  const overview = await getOrganizerOverview();

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
          Overview
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[--color-primary]">
          Keep the whole claims pipeline in view.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Track program health, spot flagged claims quickly, and jump straight into
          the claim flow or review queue without digging through spreadsheets.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-full bg-[--color-primary] px-5 py-3 font-semibold text-white"
            href="/dashboard/programs/new"
          >
            Launch The Program Wizard
          </Link>
          {overview.programs[0] ? (
            <Link
              className="inline-flex rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700"
              href={`/dashboard/programs/${overview.programs[0].id}/review`}
            >
              Open Review Queue
            </Link>
          ) : null}
        </div>
      </section>

      {overview.programs.length > 0 ? (
        <>
          <StatsCards stats={overview.stats} />

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[--color-primary]">
                    Recent claim activity
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    The latest submissions and decisions across your organizer programs.
                  </p>
                </div>
                <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {overview.recentClaims.length} recent claims
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {overview.recentClaims.map((claim) => (
                  <article
                    key={claim.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {claim.program_name}
                        </p>
                        <p className="mt-2 font-medium text-[--color-primary]">
                          {claim.description || "Claim submission"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          ${claim.amount_requested.toFixed(2)} requested in {claim.category}
                        </p>
                      </div>
                      <StatusBadge status={claim.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      {new Date(claim.submitted_at).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-[--color-primary]">
                Program portfolio
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Quick access to the active claim programs you are running right now.
              </p>

              <div className="mt-5 space-y-4">
                {overview.programs.map((program) => (
                  <div
                    key={program.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[--color-primary]">
                          {program.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          ${program.budget_committed.toFixed(2)} committed of $
                          {program.budget_total.toFixed(2)}
                        </p>
                      </div>
                      <StatusBadge status={program.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
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
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            {overview.programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </section>
        </>
      ) : (
        <EmptyState
          title="No programs yet"
          description="Sign in to create your first claim program, or keep using the public demo flow while organizer auth is still being connected."
          ctaHref="/dashboard/programs/new"
          ctaLabel="Create Your First Program"
        />
      )}
    </main>
  );
}
