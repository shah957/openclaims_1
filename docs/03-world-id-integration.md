---
doc: 03-world-id-integration
depends_on:
  - 00-concept.md
  - 01-technical-architecture.md
  - 02-ui-ux-spec.md
referenced_by:
  - 07-phase-2-world-id.md
  - 08-phase-3-claims.md
  - 11-phase-6-polish.md
status: complete
---

# OpenClaims Ops World ID Integration

## 1. Developer Portal Setup Checklist

1. Go to the World developer portal and sign in with the team account.
2. Create a new app named `OpenClaims Ops`.
3. Enable World ID 4.x for the app.
4. Create an RP and record:
   - `NEXT_PUBLIC_WORLD_APP_ID`
   - `WORLD_RP_ID`
   - `WORLD_RP_SIGNING_KEY`
5. Set development environment to `staging`.
6. Set production environment to `production` before the final demo.
7. Add these to `.env.local`:

```dotenv
NEXT_PUBLIC_WORLD_APP_ID=app_xxxxx
NEXT_PUBLIC_WORLD_ENV=staging
WORLD_RP_ID=rp_xxxxx
WORLD_RP_SIGNING_KEY=sk_xxxxx
```

## 2. Frontend IDKit 4.x Integration

### Component responsibilities

- Request a fresh RP signature from the backend.
- Create an IDKit request for the program-specific action.
- Render a QR code / connect URL.
- Poll until the user completes verification.
- Hand the proof payload to the backend.

### Verification component

```tsx
"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { IDKit, type VerificationState } from "@worldcoin/idkit-core";
import { orbLegacy } from "@worldcoin/idkit-core/presets";

type VerifyHumanProps = {
  programSlug: string;
  claimId: string;
  onVerified: (payload: { claimId: string; nullifierHash: string }) => void;
};

export function VerifyHuman({ programSlug, claimId, onVerified }: VerifyHumanProps) {
  const [connectorUri, setConnectorUri] = useState<string | null>(null);
  const [status, setStatus] = useState<VerificationState>("idle");
  const [message, setMessage] = useState<string>("Verify with World ID to unlock the claim form.");

  async function startVerification() {
    setStatus("loading");
    setMessage("Generating a secure verification session...");

    const signatureResponse = await fetch("/api/rp-signature", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: `openclaims-${programSlug}` }),
    });

    if (!signatureResponse.ok) {
      setStatus("error");
      setMessage("Unable to start verification. Please try again.");
      return;
    }

    const { data: rpContext } = await signatureResponse.json();

    const request = await IDKit.request({
      app_id: process.env.NEXT_PUBLIC_WORLD_APP_ID!,
      action: `openclaims-${programSlug}`,
      environment: process.env.NEXT_PUBLIC_WORLD_ENV === "production" ? "production" : "staging",
      rp_context: {
        rp_id: rpContext.rp_id,
        nonce: rpContext.nonce,
        created_at: rpContext.created_at,
        expires_at: rpContext.expires_at,
        signature: rpContext.sig,
      },
      allow_legacy_proofs: true,
    }).preset(orbLegacy({ signal: claimId }));

    setConnectorUri(request.connectorURI);
    setMessage("Scan the QR code with World App.");

    try {
      const proof = await request.pollUntilCompletion();

      const verificationResponse = await fetch("/api/verify-proof", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ programSlug, proof }),
      });

      const result = await verificationResponse.json();

      if (!verificationResponse.ok) {
        setStatus(result.error === "already_claimed" ? "error" : "error");
        setMessage(result.message ?? "Verification failed.");
        return;
      }

      setStatus("success");
      setMessage("Verification complete. You can finish your claim now.");
      onVerified(result.data);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Verification did not complete.");
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-md">
      <h2 className="text-xl font-semibold">Verify you&apos;re human</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      {connectorUri ? (
        <div className="mt-6 flex justify-center rounded-2xl bg-slate-50 p-4">
          <QRCode value={connectorUri} size={220} />
        </div>
      ) : null}
      <button className="mt-6 w-full rounded-full bg-[--color-accent] px-5 py-3 text-white" onClick={startVerification}>
        {status === "loading" ? "Starting..." : "Verify With World ID"}
      </button>
    </div>
  );
}
```

### Error handling expectations

- User cancels: show a neutral retry state.
- Timeout: invalidate the QR and request a fresh RP signature.
- Invalid proof: show an error badge and keep the form locked.
- Already claimed: show a non-destructive warning card with link to status lookup.

## 3. RP Signature Generation Backend

### Route: `/api/rp-signature`

```ts
import { NextResponse } from "next/server";
import { signRequest } from "@/lib/world-id/sign-request";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.action || typeof body.action !== "string") {
      return NextResponse.json(
        { error: "invalid_request", message: "A World ID action is required." },
        { status: 400 },
      );
    }

    const signed = await signRequest(body.action);

    return NextResponse.json({ data: signed });
  } catch (error) {
    return NextResponse.json(
      { error: "server_error", message: error instanceof Error ? error.message : "Failed to sign request." },
      { status: 500 },
    );
  }
}
```

### `signRequest` helper

```ts
import { createHmac, randomUUID } from "node:crypto";

export async function signRequest(action: string) {
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 5).toISOString();
  const nonce = randomUUID();

  const payload = `${process.env.WORLD_RP_ID}.${action}.${nonce}.${createdAt}.${expiresAt}`;
  const sig = createHmac("sha256", process.env.WORLD_RP_SIGNING_KEY!).update(payload).digest("hex");

  return {
    rp_id: process.env.WORLD_RP_ID!,
    sig,
    nonce,
    created_at: createdAt,
    expires_at: expiresAt,
  };
}
```

### Security notes

- Never expose `WORLD_RP_SIGNING_KEY` to the client.
- Generate a fresh signature for every attempt.
- Keep the validity window short, five minutes or less.

## 4. Proof Verification Backend

### Route: `/api/verify-proof`

```ts
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { programSlug, proof } = await request.json();

    if (!programSlug || !proof) {
      return NextResponse.json(
        { error: "invalid_request", message: "programSlug and proof are required." },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data: program, error: programError } = await supabase
      .from("programs")
      .select("id, slug")
      .eq("slug", programSlug)
      .single();

    if (programError || !program) {
      return NextResponse.json(
        { error: "not_found", message: "Program not found." },
        { status: 404 },
      );
    }

    const worldResponse = await fetch(
      `https://developer.world.org/api/v4/verify/${process.env.WORLD_RP_ID}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(proof),
      },
    );

    const verificationResult = await worldResponse.json();

    if (!worldResponse.ok || !verificationResult.success) {
      return NextResponse.json(
        { error: "verification_failed", message: verificationResult.detail ?? "World ID proof verification failed." },
        { status: 400 },
      );
    }

    const nullifierHash = proof.nullifier_hash ?? verificationResult.nullifier_hash ?? verificationResult.nullifier;
    const verificationLevel = verificationResult.verification_level ?? "unknown";

    const { data: existingClaim } = await supabase
      .from("claims")
      .select("id")
      .eq("program_id", program.id)
      .eq("nullifier_hash", nullifierHash)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json(
        {
          error: "already_claimed",
          message: "You have already submitted a claim for this program.",
        },
        { status: 409 },
      );
    }

    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .insert({
        program_id: program.id,
        nullifier_hash: nullifierHash,
        world_id_verified: true,
        verification_level: verificationLevel,
        status: "pending",
      })
      .select("id, nullifier_hash, verification_level")
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        { error: "server_error", message: "Unable to create verified claim shell." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        claimId: claim.id,
        nullifierHash: claim.nullifier_hash,
        verificationLevel: claim.verification_level,
        verified: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "server_error", message: error instanceof Error ? error.message : "Unexpected verification failure." },
      { status: 500 },
    );
  }
}
```

### Failure modes to handle

- `400`: malformed payload, expired signature, invalid proof.
- `404`: unknown program slug.
- `409`: duplicate nullifier for the same program.
- `500`: Supabase or upstream outage.

## 5. Action String Management

- Convention: `openclaims-{program-slug}`
- Example: `openclaims-catapult-hacks-meal-stipend-2026`
- Why it matters:
  - same person + same app + same action = same nullifier
  - same person + same app + different action = different nullifier
  - this enables one claim per program without blocking a person from other programs

## 6. Testing With The Simulator

1. Set `NEXT_PUBLIC_WORLD_ENV=staging`.
2. Start the local app.
3. Open the simulator at `https://simulator.worldcoin.org/`.
4. Use the generated QR/connect URL from the claim page.
5. Complete the proof in the simulator and confirm the backend receives the payload.

### Demo behavior

- Staging proofs only verify against staging configuration.
- Production proofs only verify against production configuration.
- For the hackathon demo, preload the simulator tab and a claim link.

## 7. Common Pitfalls And Debugging

| Pitfall | Symptom | Fix |
|---|---|---|
| Signature expiry | QR scans but verify fails | Regenerate RP signature per attempt |
| Environment mismatch | Staging proof rejected in production | Align `NEXT_PUBLIC_WORLD_ENV`, portal config, and verify endpoint |
| Duplicate nullifier confusion | Same person sees different result across programs | Confirm action string is program-specific |
| Stale claim shell | User verified but never submits | Add cleanup job later; acceptable for MVP |
| Missing signal binding | Proof replay concerns | Bind the initial `claimId` into the proof signal |
