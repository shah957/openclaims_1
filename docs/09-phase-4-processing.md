---
doc: 09-phase-4-processing
depends_on:
  - 01-technical-architecture.md
  - 04-document-processing.md
  - 05-rules-engine.md
  - 08-phase-3-claims.md
referenced_by:
  - 10-phase-5-organizer.md
  - 11-phase-6-polish.md
status: complete
---

# Phase 4 Processing (Hours 14-20)

## 1. GPT-4o Vision Integration

File: `src/lib/processing/extract-receipt.ts`

```ts
import OpenAI from "openai";
import type { ExtractionResult } from "@/types/claims";

const SYSTEM_PROMPT = `You are a receipt data extraction system for reimbursement claims.
Return ONLY valid JSON with:
merchant_name, date, total_amount, currency, line_items, category_guess, confidence.
Use null when uncertain.`;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractReceipt(imageUrl: string): Promise<ExtractionResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    max_completion_tokens: 500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the structured fields from this receipt." },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI did not return extraction content.");
  }

  return JSON.parse(content) as ExtractionResult;
}
```

## 2. Document Hash Computation

File: `src/lib/processing/duplicate-check.ts`

```ts
import { createHash } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";

export function computeDocumentHash(fileBuffer: Buffer) {
  return createHash("sha256").update(fileBuffer).digest("hex");
}

export async function checkDuplicateDocument(programId: string, duplicateHash: string) {
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .from("documents")
    .select("id, claim_id, claims!inner(program_id)")
    .eq("duplicate_hash", duplicateHash)
    .eq("claims.program_id", programId);

  return {
    isDuplicate: Boolean(data?.length),
    matches: data ?? [],
  };
}
```

## 3. Rules Engine

File: `src/lib/processing/rules-engine.ts`

- Use the complete implementation from [05-rules-engine.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/05-rules-engine.md).
- Export:
  - `runRulesEngine`
  - `RuleCheckResult`
  - `RulesDecision`

## 4. Processing Pipeline Orchestration

File: `src/app/api/documents/process/route.ts`

```ts
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { extractReceipt } from "@/lib/processing/extract-receipt";
import { checkDuplicateDocument, computeDocumentHash } from "@/lib/processing/duplicate-check";
import { runRulesEngine } from "@/lib/processing/rules-engine";

export async function POST(request: Request) {
  try {
    const { claimId, documentId } = await request.json();

    if (!claimId || !documentId) {
      return NextResponse.json(
        { error: "invalid_request", message: "claimId and documentId are required." },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data: claim } = await supabase
      .from("claims")
      .select("id, program_id, amount_requested, category, submitted_at, programs!inner(id, budget_total, budget_committed, rules)")
      .eq("id", claimId)
      .single();

    const { data: document } = await supabase
      .from("documents")
      .select("id, file_url, storage_path")
      .eq("id", documentId)
      .single();

    if (!claim || !document) {
      return NextResponse.json(
        { error: "not_found", message: "Claim or document not found." },
        { status: 404 },
      );
    }

    const fileResponse = await fetch(document.file_url);
    const arrayBuffer = await fileResponse.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const duplicateHash = computeDocumentHash(fileBuffer);
    const extraction = await extractReceipt(document.file_url);
    const duplicate = await checkDuplicateDocument(claim.program_id, duplicateHash);

    const result = runRulesEngine({
      claim,
      program: claim.programs,
      extraction,
      duplicateDocument: duplicate.isDuplicate,
      hasDocument: true,
    });

    const nextStatus =
      result.decision === "auto_approve"
        ? "auto_approved"
        : result.decision === "auto_reject"
          ? "auto_rejected"
          : "flagged";

    await supabase.from("documents").update({
      extraction_data: extraction,
      duplicate_hash: duplicateHash,
      processed_at: new Date().toISOString(),
    }).eq("id", documentId);

    await supabase.from("claims").update({
      extraction_result: extraction,
      rule_check_result: result.results,
      confidence_score: result.confidence,
      status: nextStatus,
      amount_approved: nextStatus === "auto_approved" ? claim.amount_requested : null,
    }).eq("id", claimId);

    return NextResponse.json({
      data: {
        claimId,
        documentId,
        decision: result.decision,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "server_error", message: error instanceof Error ? error.message : "Processing failed." },
      { status: 500 },
    );
  }
}
```

### Error handling

- Extraction failure should set the claim to `flagged`.
- Storage read failure should return `500`.
- Missing document should return `404`.

## 5. Claim Status Updates

Allowed transitions:

- `pending` -> `processing`
- `processing` -> `auto_approved`
- `processing` -> `auto_rejected`
- `processing` -> `flagged`
- `flagged` -> `manually_approved`
- `flagged` -> `manually_rejected`

Every transition should also create an `audit_log` row.

## 6. Acceptance Criteria

- Uploading a clean receipt produces structured extraction.
- Clean claim auto-approves.
- Over-budget claim auto-rejects.
- Amount mismatch gets flagged.
- Duplicate document gets flagged.
