"use client";

import { useEffect, useMemo, useState } from "react";
import type { IDKitResult } from "@worldcoin/idkit-core";
import { IDKit } from "@worldcoin/idkit-core";
import QRCode from "react-qr-code";
import type { DashboardClaim } from "@/types/dashboard";
import type { PublicProgram } from "@/types/programs";
import {
  getWorldAction,
  getWorldErrorMessage,
  getWorldLegacyPreset,
} from "@/lib/world-id/config";
import { VerificationStatus } from "@/components/world-id/verification-status";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";

export function ClaimStatusLookup({
  program,
  initialClaimId,
}: {
  program: PublicProgram;
  initialClaimId?: string;
}) {
  const { pushToast } = useToast();
  const [state, setState] = useState<
    "idle" | "loading" | "verifying" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState(
    "Re-verify with World ID to look up your claim.",
  );
  const [connectorUri, setConnectorUri] = useState<string | null>(null);
  const [claim, setClaim] = useState<DashboardClaim | null>(null);
  const action = useMemo(() => getWorldAction(program.slug), [program.slug]);

  useEffect(() => {
    async function loadClaimFromId(claimId: string) {
      setState("loading");
      setMessage("Loading the claim from your submission link...");

      try {
        const response = await fetch(`/api/claims/${claimId}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message ?? "Unable to load the submitted claim.");
        }

        setClaim(payload.data as DashboardClaim);
        setState("success");
        setMessage("Claim found.");
      } catch (error) {
        const nextError =
          error instanceof Error ? error.message : "Unable to load your claim.";
        setClaim(null);
        setState("error");
        setMessage(nextError);
      }
    }

    if (initialClaimId) {
      void loadClaimFromId(initialClaimId);
    }
  }, [initialClaimId]);

  async function handleLookup() {
    if (!process.env.NEXT_PUBLIC_WORLD_APP_ID) {
      setState("error");
      setMessage(
        "NEXT_PUBLIC_WORLD_APP_ID is missing. Add your World ID credentials to continue.",
      );
      return;
    }

    setState("loading");
    setMessage("Creating a secure lookup session...");

    try {
      const signatureResponse = await fetch("/api/rp-signature", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const signaturePayload = await signatureResponse.json();
      if (!signatureResponse.ok) {
        throw new Error(signaturePayload.message ?? "Unable to create lookup session.");
      }

      const request = await IDKit.request({
        app_id: process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`,
        action,
        environment:
          process.env.NEXT_PUBLIC_WORLD_ENV === "production"
            ? "production"
            : "staging",
        rp_context: signaturePayload.data,
        allow_legacy_proofs: true,
      }).preset(getWorldLegacyPreset());

      setConnectorUri(request.connectorURI || null);
      setState("verifying");
      setMessage("Scan the QR code and confirm to look up your claim.");

      const completion = await request.pollUntilCompletion();
      if (!completion.success) {
        throw new Error(getWorldErrorMessage(completion.error));
      }

      const proof = completion.result as IDKitResult;

      const lookupResponse = await fetch("/api/claims/status", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          programSlug: program.slug,
          proof,
        }),
      });

      const lookupPayload = await lookupResponse.json();
      if (!lookupResponse.ok) {
        throw new Error(lookupPayload.message ?? "Unable to find a claim.");
      }

      setClaim(lookupPayload.data as DashboardClaim);
      setState("success");
      setMessage("Claim found.");
      pushToast({
        title: "Claim found",
        description: "Your latest status has been loaded.",
        tone: "success",
      });
    } catch (error) {
      const nextError =
        error instanceof Error ? error.message : "Unable to look up your claim.";
      console.error("[world-id:lookup]", nextError);
      setClaim(null);
      setState("error");
      setMessage(nextError);
      pushToast({
        title: "Claim lookup failed",
        description: nextError,
        tone: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <VerificationStatus message={message} state={state} />

      {connectorUri ? (
        <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <QRCode size={200} value={connectorUri} />
          <a
            className="text-sm font-medium text-[var(--color-accent)] underline-offset-4 hover:underline"
            href={connectorUri}
          >
            Open in World App
          </a>
        </div>
      ) : null}

      {!initialClaimId ? (
        <button
          className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 font-semibold text-white disabled:opacity-60"
          disabled={state === "loading" || state === "verifying"}
          onClick={handleLookup}
          type="button"
        >
          {state === "loading" || state === "verifying"
            ? "Looking Up Claim..."
            : "Look Up Claim With World ID"}
        </button>
      ) : null}

      {claim ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Claim ID</p>
              <p className="mt-1 font-mono text-sm text-[var(--color-primary)]">
                {claim.id}
              </p>
            </div>
            <StatusBadge status={claim.status as never} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Amount requested</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">
                ${claim.amount_requested.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Submitted</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">
                {new Date(claim.submitted_at).toLocaleString()}
              </p>
            </div>
          </div>

          <ol className="mt-6 space-y-3">
            {[
              { label: "Submitted", done: true },
              {
                label: "Processing",
                done: [
                  "processing",
                  "auto_approved",
                  "auto_rejected",
                  "flagged",
                  "manually_approved",
                  "manually_rejected",
                ].includes(claim.status),
              },
              {
                label: "Resolved",
                done: [
                  "auto_approved",
                  "auto_rejected",
                  "flagged",
                  "manually_approved",
                  "manually_rejected",
                ].includes(claim.status),
              },
            ].map(({ label, done }) => (
              <li
                key={label}
                className={`rounded-2xl px-4 py-3 text-sm ${done ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-500"}`}
              >
                {label}
              </li>
            ))}
          </ol>

          {claim.reviewer_notes ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {claim.reviewer_notes}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
