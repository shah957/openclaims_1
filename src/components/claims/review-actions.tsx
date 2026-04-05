"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/shared/toast-provider";

type ReviewActionsProps = {
  claimId: string;
  requestedAmount: number;
};

export function ReviewActions({
  claimId,
  requestedAmount,
}: ReviewActionsProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [amountApproved, setAmountApproved] = useState(
    requestedAmount.toFixed(2),
  );
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitDecision(status: "manually_approved" | "manually_rejected") {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status,
          amountApproved:
            status === "manually_approved" ? Number(amountApproved) : null,
          reviewerNotes,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to update the claim.");
      }

      setMessage(
        status === "manually_approved"
          ? "Claim approved."
          : "Claim rejected.",
      );
      pushToast({
        title:
          status === "manually_approved" ? "Claim approved" : "Claim rejected",
        description: `Claim ${claimId} was updated successfully.`,
        tone: "success",
      });
      router.refresh();
    } catch (reviewError) {
      const nextError =
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to update the claim.";
      setError(
        nextError,
      );
      pushToast({
        title: "Review update failed",
        description: nextError,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-semibold text-[var(--color-primary)]">
        Reviewer actions
      </h3>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Approved amount
          </label>
          <input
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            inputMode="decimal"
            value={amountApproved}
            onChange={(event) => setAmountApproved(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Reviewer notes
          </label>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            value={reviewerNotes}
            onChange={(event) => setReviewerNotes(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        {message ? (
          <p className="text-sm text-[var(--color-success)]">{message}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-[var(--color-success)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => submitDecision("manually_approved")}
            type="button"
          >
            Approve
          </button>
          <button
            className="rounded-full bg-[var(--color-error)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => submitDecision("manually_rejected")}
            type="button"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
