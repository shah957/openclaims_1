"use client";

import { useState } from "react";
import { DocumentUpload } from "@/components/documents/document-upload";
import { useToast } from "@/components/shared/toast-provider";
import type { ClaimSubmissionPayload, UploadedDocument } from "@/types/claims";
import type { AllowedCategory, PublicProgram } from "@/types/programs";

type ClaimFormProps = {
  claimId: string;
  program: PublicProgram;
  onSubmitted: (claimId: string) => void;
};

export function ClaimForm({
  claimId,
  program,
  onSubmitted,
}: ClaimFormProps) {
  const { pushToast } = useToast();
  const [claimantEmail, setClaimantEmail] = useState("");
  const [amountRequested, setAmountRequested] = useState("");
  const [category, setCategory] = useState<AllowedCategory>(
    program.rules.allowed_categories?.[0] ?? "other",
  );
  const [description, setDescription] = useState("");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amountRequested);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (
      program.rules.max_amount_per_claim &&
      parsedAmount > program.rules.max_amount_per_claim
    ) {
      setError(
        `This program caps claims at $${program.rules.max_amount_per_claim}.`,
      );
      return;
    }

    if (documents.length === 0) {
      setError("Upload at least one supporting document.");
      return;
    }

    if (claimantEmail.trim() && !/\S+@\S+\.\S+/.test(claimantEmail.trim())) {
      setError("Enter a valid email address or leave it blank.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: ClaimSubmissionPayload = {
        claimId,
        claimantEmail: claimantEmail.trim() || undefined,
        amountRequested: parsedAmount,
        category: category as ClaimSubmissionPayload["category"],
        description,
        documents,
      };

      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? "Claim submission failed.");
      }

      pushToast({
        title: "Claim submitted",
        description: `Claim ${result.data.claimId} is now processing.`,
        tone: "success",
      });
      onSubmitted(result.data.claimId);
    } catch (submissionError) {
      const nextError =
        submissionError instanceof Error
          ? submissionError.message
          : "Claim submission failed.";
      setError(
        nextError,
      );
      pushToast({
        title: "Claim submission failed",
        description: nextError,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor="claimant-email"
          >
            Email for updates
          </label>
          <input
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            id="claimant-email"
            placeholder="you@example.com"
            type="email"
            value={claimantEmail}
            onChange={(event) => setClaimantEmail(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="amount">
            Amount requested
          </label>
          <input
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            id="amount"
            inputMode="decimal"
            max={program.rules.max_amount_per_claim}
            min="0"
            placeholder="18.50"
            step="0.01"
            value={amountRequested}
            onChange={(event) => setAmountRequested(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="category">
            Category
          </label>
          <select
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            id="category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as AllowedCategory)
            }
          >
            {(program.rules.allowed_categories ?? ["other"]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="description">
          Description
        </label>
        <textarea
          className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
          id="description"
          placeholder="Optional context for the organizer"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-4">
        <DocumentUpload
          claimId={claimId}
          programId={program.id}
          disabled={isSubmitting}
          onUploaded={(document) =>
            setDocuments((existing) => [...existing, document])
          }
        />

        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-[var(--color-primary)]">
                  {document.originalFilename}
                </span>
                <a
                  className="text-[var(--color-accent)] underline-offset-4 hover:underline"
                  href={document.fileUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Preview
                </a>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}

      <button
        className="w-full rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Submitting Claim..." : "Submit Claim"}
      </button>
    </form>
  );
}
