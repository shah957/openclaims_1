import { notFound } from "next/navigation";
import { ClaimFlow } from "@/components/claims/claim-flow";
import { getPublicProgramBySlug } from "@/lib/programs";
import { hasSupabaseConfig } from "@/lib/env";

type ClaimPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { slug } = await params;
  const program = await getPublicProgramBySlug(slug);

  if (!program) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
            OpenClaims Ops
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-[--color-primary]">
            Submit your claim
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Verify once, upload your proof, and let the rules engine do the first
            pass.
          </p>
        </div>

        <ClaimFlow isDemoMode={!hasSupabaseConfig()} program={program} />
      </div>
    </main>
  );
}
