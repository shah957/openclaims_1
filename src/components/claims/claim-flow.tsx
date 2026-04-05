"use client";

import { useState } from "react";
import { ClaimForm } from "@/components/claims/claim-form";
import { VerifyButton } from "@/components/world-id/verify-button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { PublicProgram } from "@/types/programs";
import type { VerifiedClaimShell } from "@/types/world-id";

type ClaimFlowProps = {
  program: PublicProgram;
  isDemoMode: boolean;
};

export function ClaimFlow({ program, isDemoMode }: ClaimFlowProps) {
  const [verifiedClaim, setVerifiedClaim] = useState<VerifiedClaimShell | null>(
    null,
  );
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);

  if (submittedClaimId) {
    return (
      <div className="rounded-[2rem] border border-green-200 bg-green-50 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
          Claim Submitted
        </p>
        <h2 className="mt-4 text-3xl font-bold text-[--color-primary]">
          Your claim is now processing.
        </h2>
        <p className="mt-4 text-slate-700">
          Claim ID:
          <span className="ml-2 rounded-full bg-white px-3 py-1 font-mono text-sm">
            {submittedClaimId}
          </span>
        </p>
        <p className="mt-4 text-slate-600">
          You can return to the status page later to check progress.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
              Public Claim Link
            </p>
            <h1 className="mt-4 text-4xl font-bold text-[--color-primary]">
              {program.name}
            </h1>
          </div>
          <StatusBadge status={program.status} />
        </div>

        <p className="text-slate-600">{program.description}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Max claim</p>
            <p className="mt-2 text-xl font-semibold text-[--color-primary]">
              ${program.rules.max_amount_per_claim ?? "N/A"}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Deadline</p>
            <p className="mt-2 text-xl font-semibold text-[--color-primary]">
              {program.rules.deadline
                ? new Date(program.rules.deadline).toLocaleString()
                : "Open"}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-[--color-accent]/20 bg-[--color-accent]/5 p-5">
          <p className="text-sm font-semibold text-[--color-accent]">
            Why verification comes first
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            World ID lets the program enforce one human, one claim before the
            receipt form even opens.
          </p>
        </div>

        {isDemoMode ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Demo mode is active because Supabase is not configured yet. The page
            layout works, but claim submission APIs need environment variables to
            complete end-to-end.
          </div>
        ) : null}
      </section>

      <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
            Step 1
          </p>
          <h2 className="mt-4 text-3xl font-bold text-[--color-primary]">
            Verify With World ID
          </h2>
        </div>

        {!verifiedClaim ? (
          <VerifyButton
            programSlug={program.slug}
            onDuplicate={(message) => setDuplicateMessage(message)}
            onVerified={(result) => {
              setDuplicateMessage(null);
              setVerifiedClaim(result);
            }}
          />
        ) : null}

        {duplicateMessage ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            {duplicateMessage}
          </div>
        ) : null}

        {verifiedClaim ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
                Step 2
              </p>
              <h2 className="mt-4 text-3xl font-bold text-[--color-primary]">
                Submit Your Claim
              </h2>
              <p className="mt-3 text-slate-600">
                Your claim shell is verified. Upload your receipt and complete the
                remaining fields.
              </p>
            </div>

            <ClaimForm
              claimId={verifiedClaim.claimId}
              program={program}
              onSubmitted={(claimId) => setSubmittedClaimId(claimId)}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
