import { notFound } from "next/navigation";
import { ClaimStatusLookup } from "@/components/claims/claim-status-lookup";
import { getPublicProgramBySlug } from "@/lib/programs";

type ClaimStatusPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    claimId?: string;
  }>;
};

export default async function ClaimStatusPage({
  params,
  searchParams,
}: ClaimStatusPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const program = await getPublicProgramBySlug(slug);

  if (!program) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Claim Status
          </p>
          <h1 className="mt-4 text-4xl font-bold text-[var(--color-primary)]">
            Track your {program.name} submission
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            {resolvedSearchParams.claimId
              ? "This page loaded the claim you just submitted. You can bookmark it for local testing."
              : "Re-verify with World ID and we&apos;ll pull the claim associated with your unique nullifier for this program."}
          </p>
        </section>

        <ClaimStatusLookup
          initialClaimId={resolvedSearchParams.claimId}
          program={program}
        />
      </div>
    </main>
  );
}
