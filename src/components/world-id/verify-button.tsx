"use client";

import { useMemo, useState } from "react";
import type { IDKitResult } from "@worldcoin/idkit-core";
import { IDKit, orbLegacy } from "@worldcoin/idkit-core";
import QRCode from "react-qr-code";
import { getWorldAction } from "@/lib/world-id/config";
import type { VerifiedClaimShell } from "@/types/world-id";
import { VerificationStatus } from "@/components/world-id/verification-status";
import { useToast } from "@/components/shared/toast-provider";

type VerifyButtonProps = {
  programSlug: string;
  onVerified: (result: VerifiedClaimShell) => void;
  onDuplicate: (message: string) => void;
};

export function VerifyButton({
  programSlug,
  onVerified,
  onDuplicate,
}: VerifyButtonProps) {
  const { pushToast } = useToast();
  const [state, setState] = useState<
    "idle" | "loading" | "verifying" | "success" | "duplicate" | "error"
  >("idle");
  const [message, setMessage] = useState(
    "Verify with World ID to unlock the claim form.",
  );
  const [connectorUri, setConnectorUri] = useState<string | null>(null);
  const action = useMemo(() => getWorldAction(programSlug), [programSlug]);

  async function handleVerification() {
    if (!process.env.NEXT_PUBLIC_WORLD_APP_ID) {
      setState("error");
      setMessage(
        "NEXT_PUBLIC_WORLD_APP_ID is missing. Add your World ID credentials to continue.",
      );
      return;
    }

    setState("loading");
    setMessage("Creating a secure World ID session...");

    try {
      const rpSignatureResponse = await fetch("/api/rp-signature", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const rpSignaturePayload = await rpSignatureResponse.json();

      if (!rpSignatureResponse.ok) {
        throw new Error(
          rpSignaturePayload.message ?? "Unable to create verification session.",
        );
      }

      const request = await IDKit.request({
        app_id: process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`,
        action,
        environment:
          process.env.NEXT_PUBLIC_WORLD_ENV === "production"
            ? "production"
            : "staging",
        rp_context: rpSignaturePayload.data,
        allow_legacy_proofs: true,
      }).preset(
        orbLegacy({
          signal:
            globalThis.crypto?.randomUUID?.() ??
            `claim-attempt-${Date.now().toString()}`,
        }),
      );

      setConnectorUri(request.connectorURI || null);
      setState("verifying");
      setMessage(
        request.connectorURI
          ? "Scan the QR code with World App and confirm the verification."
          : "Complete the verification in World App.",
      );

      const completion = await request.pollUntilCompletion();

      if (!completion.success) {
        throw new Error(
          `World ID did not complete successfully: ${completion.error}`,
        );
      }

      const proof = completion.result as IDKitResult;

      const verifyResponse = await fetch("/api/verify-proof", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          programSlug,
          proof,
        }),
      });

      const verifyPayload = await verifyResponse.json();

      if (!verifyResponse.ok) {
        if (verifyPayload.error === "already_claimed") {
          setState("duplicate");
          setMessage(verifyPayload.message);
          pushToast({
            title: "Already claimed",
            description: verifyPayload.message,
            tone: "info",
          });
          onDuplicate(verifyPayload.message);
          return;
        }

        throw new Error(verifyPayload.message ?? "Verification failed.");
      }

      setState("success");
      setMessage(
        "Verification complete. Your claim form is ready below.",
      );
      pushToast({
        title: "Verification complete",
        description: "Your claim form is unlocked.",
        tone: "success",
      });
      onVerified(verifyPayload.data);
    } catch (error) {
      const nextError =
        error instanceof Error
          ? error.message
          : "Verification did not complete successfully.";
      setState("error");
      setMessage(nextError);
      pushToast({
        title: "Verification failed",
        description: nextError,
        tone: "error",
      });
    }
  }

  return (
    <div className="space-y-4">
      <VerificationStatus message={message} state={state} />

      {connectorUri ? (
        <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <QRCode size={200} value={connectorUri} />
          <a
            className="text-center text-sm font-medium text-[--color-accent] underline-offset-4 hover:underline"
            href={connectorUri}
          >
            Open in World App
          </a>
        </div>
      ) : null}

      <button
        className="w-full rounded-full bg-[--color-accent] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={state === "loading" || state === "verifying"}
        onClick={handleVerification}
        type="button"
      >
        {state === "loading" || state === "verifying"
          ? "Verification In Progress..."
          : "Verify With World ID"}
      </button>
    </div>
  );
}
