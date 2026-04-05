"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";

type ProgramWizardProps = {
  baseUrl: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProgramWizard({ baseUrl }: ProgramWizardProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Catapult Hacks 2026 Meal Stipend");
  const [slug, setSlug] = useState("catapult-hacks-2026-meal-stipend");
  const [description, setDescription] = useState(
    "Reimburse one meal purchase during Catapult Hacks 2026.",
  );
  const [maxAmount, setMaxAmount] = useState("25");
  const [deadline, setDeadline] = useState("2026-04-05T10:00");
  const [budgetTotal, setBudgetTotal] = useState("1000");
  const [autoApproveThreshold, setAutoApproveThreshold] = useState("0.85");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shareableUrl = useMemo(
    () => `${baseUrl}/claim/${slug || "your-program-slug"}`,
    [baseUrl, slug],
  );

  async function handlePublish() {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          description,
          budgetTotal: Number(budgetTotal),
          rules: {
            max_amount_per_claim: Number(maxAmount),
            deadline: new Date(deadline).toISOString(),
            required_proof_types: ["receipt"],
            allowed_categories: ["food"],
            auto_approve_threshold: Number(autoApproveThreshold),
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Program creation failed.");
      }

      setMessage(`Program created. Public link: ${baseUrl}/claim/${payload.data.slug}`);
      pushToast({
        title: "Program created",
        description: `Public claim link ready at /claim/${payload.data.slug}.`,
        tone: "success",
      });
      router.push(`/dashboard/programs/${payload.data.id}`);
      router.refresh();
    } catch (publishError) {
      const nextError =
        publishError instanceof Error
          ? publishError.message
          : "Program creation failed.";
      setError(
        nextError,
      );
      pushToast({
        title: "Program creation failed",
        description: nextError,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((value) => (
          <div
            key={value}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              value === step
                ? "bg-[var(--color-primary)] text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            Step {value}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Program name</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSlug(slugify(event.target.value));
              }}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Slug</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Max amount per claim
            </label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              inputMode="decimal"
              value={maxAmount}
              onChange={(event) => setMaxAmount(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Deadline</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Auto-approve threshold
            </label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              inputMode="decimal"
              value={autoApproveThreshold}
              onChange={(event) => setAutoApproveThreshold(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Total budget</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              inputMode="decimal"
              value={budgetTotal}
              onChange={(event) => setBudgetTotal(event.target.value)}
            />
          </div>
          <div className="rounded-3xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-4 text-sm text-slate-700">
            The MVP wizard currently hardcodes required proof type to receipt and
            allowed category to food. We can broaden this next.
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Program summary</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-primary)]">
              {name}
            </h2>
            <p className="mt-3 text-sm text-slate-600">{description}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Shareable claim link</p>
            <p className="mt-2 break-all font-mono text-sm text-[var(--color-primary)]">
              {shareableUrl}
            </p>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      {message ? (
        <p className="text-sm text-[var(--color-success)]">{message}</p>
      ) : null}

      <div className="flex justify-between gap-3">
        <button
          className="rounded-full border border-slate-300 px-5 py-3 font-medium text-slate-700 disabled:opacity-50"
          disabled={step === 1}
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          type="button"
        >
          Back
        </button>

        {step < 4 ? (
          <button
            className="rounded-full bg-[var(--color-primary)] px-5 py-3 font-medium text-white"
            onClick={() => setStep((current) => Math.min(4, current + 1))}
            type="button"
          >
            Next
          </button>
        ) : (
          <button
            className="rounded-full bg-[var(--color-primary)] px-5 py-3 font-medium text-white disabled:opacity-60"
            disabled={isSubmitting}
            onClick={handlePublish}
            type="button"
          >
            {isSubmitting ? "Publishing..." : "Publish Program"}
          </button>
        )}
      </div>
    </div>
  );
}
