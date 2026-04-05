---
doc: 08-phase-3-claims
depends_on:
  - 01-technical-architecture.md
  - 02-ui-ux-spec.md
  - 03-world-id-integration.md
  - 04-document-processing.md
  - 06-phase-1-foundation.md
  - 07-phase-2-world-id.md
referenced_by:
  - 09-phase-4-processing.md
  - 11-phase-6-polish.md
status: complete
---

# Phase 3 Claims (Hours 8-14)

## 1. Claim Form Component

File: `src/components/claims/claim-form.tsx`

```tsx
"use client";

import { useState } from "react";

type ClaimFormProps = {
  claimId: string;
  program: {
    id: string;
    rules: {
      max_amount_per_claim?: number;
      allowed_categories?: string[];
    };
  };
  onSubmitted: (claimId: string) => void;
};

export function ClaimForm({ claimId, program, onSubmitted }: ClaimFormProps) {
  const [amountRequested, setAmountRequested] = useState("");
  const [category, setCategory] = useState(program.rules.allowed_categories?.[0] ?? "");
  const [description, setDescription] = useState("");
  const [documents, setDocuments] = useState<Array<{ id: string; fileUrl: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/claims", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        claimId,
        amountRequested: Number(amountRequested),
        category,
        description,
        documents,
      }),
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(result.message ?? "Unable to submit claim.");
      return;
    }

    onSubmitted(result.data.claimId);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium">Amount requested</label>
        <input
          className="w-full rounded-2xl border px-4 py-3"
          inputMode="decimal"
          max={program.rules.max_amount_per_claim}
          min={0}
          step="0.01"
          value={amountRequested}
          onChange={(event) => setAmountRequested(event.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Category</label>
        <select className="w-full rounded-2xl border px-4 py-3" value={category} onChange={(event) => setCategory(event.target.value)}>
          {(program.rules.allowed_categories ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Description</label>
        <textarea
          className="min-h-28 w-full rounded-2xl border px-4 py-3"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="rounded-3xl border border-dashed p-6">
        Replace this placeholder with `document-upload.tsx`, then push uploaded document records into `documents`.
      </div>

      {error ? <p className="text-sm text-[--color-error]">{error}</p> : null}

      <button className="w-full rounded-full bg-[--color-primary] px-5 py-3 text-white" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : "Submit Claim"}
      </button>
    </form>
  );
}
```

## 2. Document Upload Implementation

### Client side

- File: `src/components/documents/document-upload.tsx`
- Use `react-dropzone`.
- Validate:
  - accepted type
  - max 10 MB
- Show thumbnail / file name.
- POST multipart form-data to `/api/documents/upload`.

### Storage convention

```text
programs/{programId}/claims/{claimId}/{timestamp}-{filename}
```

### Database insert

```ts
await supabase.from("documents").insert({
  claim_id: claimId,
  file_url: publicUrl,
  storage_path: storagePath,
  file_type: "receipt",
  original_filename: file.name,
});
```

## 3. Claim Creation API

File: `src/app/api/claims/route.ts`

```ts
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { claimId, amountRequested, category, description, documents } = body;

    if (!claimId || !amountRequested || !category || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: "invalid_request", message: "Missing required claim fields." },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data: existingClaim, error: claimLookupError } = await supabase
      .from("claims")
      .select("id, world_id_verified, status")
      .eq("id", claimId)
      .single();

    if (claimLookupError || !existingClaim || !existingClaim.world_id_verified) {
      return NextResponse.json(
        { error: "verification_required", message: "World ID verification is required before claim submission." },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("claims")
      .update({
        amount_requested: amountRequested,
        category,
        description,
        status: "processing",
      })
      .eq("id", claimId);

    if (updateError) {
      return NextResponse.json(
        { error: "server_error", message: "Unable to save claim details." },
        { status: 500 },
      );
    }

    void fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents/process`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ claimId, documentId: documents[0].id }),
    });

    return NextResponse.json({ data: { claimId, status: "processing" } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "server_error", message: error instanceof Error ? error.message : "Unexpected claim creation error." },
      { status: 500 },
    );
  }
}
```

## 4. Claim Confirmation Page

After submission, render:

- Claim ID in mono font
- Current status: `processing`
- “You’ll be notified when your claim is reviewed”
- Link to `/claim/[slug]/status`

## 5. Program Info Fetching

- Read the public program by slug on the server in `src/app/(public)/claim/[slug]/page.tsx`.
- Required fields:
  - `id`
  - `name`
  - `description`
  - `rules`
  - `status`

## 6. Form Validation

### Client side

- amount must be positive
- amount must not exceed `max_amount_per_claim`
- category must be one of allowed options
- at least one document required

### Server side

- repeat the same checks
- ensure verified shell claim exists
- ensure claim status has not already been finalized

## 7. Acceptance Criteria

- A verified user can submit a full claim.
- Documents upload to Supabase Storage.
- Claim row updates with amount, category, and description.
- Processing is triggered asynchronously.
- User sees a confirmation state with claim ID.
