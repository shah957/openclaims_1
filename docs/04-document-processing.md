---
doc: 04-document-processing
depends_on:
  - 00-concept.md
  - 01-technical-architecture.md
  - 02-ui-ux-spec.md
referenced_by:
  - 08-phase-3-claims.md
  - 09-phase-4-processing.md
  - 11-phase-6-polish.md
status: complete
---

# OpenClaims Ops Document Processing

## 1. Upload Flow

### Client behavior

- Library: `react-dropzone`
- Accepted types:
  - `.jpg`
  - `.jpeg`
  - `.png`
  - `.pdf`
- Max size: `10MB`
- Preview:
  - image thumbnail for JPG/PNG
  - file pill + icon for PDF
- Validation messages:
  - invalid type
  - too large
  - upload failed

### Storage convention

- Bucket: `claim-documents`
- Path:

```text
programs/{programId}/claims/{claimId}/{timestamp}-{filename}
```

### Upload sequence

1. User drops a file in `document-upload.tsx`.
2. Client validates type and size.
3. Client posts the file to `/api/documents/upload`.
4. Backend uploads to Supabase Storage.
5. Backend inserts the `documents` row.
6. Backend returns `{ documentId, publicUrl, storagePath }`.

## 2. GPT-4o Vision Extraction

### System prompt

```text
You are a receipt data extraction system for reimbursement claims.
Extract structured data from the provided receipt or proof document.
Return ONLY valid JSON with the following schema:
{
  "merchant_name": string | null,
  "date": string | null,
  "total_amount": number | null,
  "currency": string,
  "line_items": [{ "description": string, "amount": number }],
  "category_guess": "food" | "transport" | "lodging" | "supplies" | "other",
  "confidence": number
}
Rules:
- Use YYYY-MM-DD for dates when possible.
- Default currency to "USD" when not explicit.
- If a field is uncertain, set it to null instead of guessing.
- Confidence must be between 0.0 and 1.0.
```

### API call shape

```ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractReceipt(imageUrl: string) {
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
          { type: "text", text: "Extract the receipt fields from this document." },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });

  return JSON.parse(response.choices[0]?.message?.content ?? "{}");
}
```

### Fallback behavior

- If OpenAI errors: set extraction to null, flag claim for manual review.
- If JSON parse fails: capture raw text in logs, flag the claim.
- If confidence `< 0.5`: keep extracted fields, but mark `document_quality` as soft fail.

### Cost and rate limits

- Estimated cost: about `$0.01` to `$0.03` per receipt.
- MVP throttle:
  - one extraction per uploaded file
  - retry at most once
  - queue later if the service becomes a bottleneck

## 3. Document Hashing For Duplicate Detection

### Hash approach

- Compute SHA-256 on the raw uploaded file buffer.
- Store the hash in `documents.duplicate_hash`.
- Query matching hashes across documents linked to claims in the same program.

### Behavior on match

- Do not auto-reject based on document hash alone.
- Add a `duplicate_document` soft fail.
- Route the claim to `flagged`.

### Helper implementation

```ts
import { createHash } from "node:crypto";

export function computeDocumentHash(fileBuffer: Buffer) {
  return createHash("sha256").update(fileBuffer).digest("hex");
}
```

## 4. Extraction Result Schema

```ts
export interface ExtractionResult {
  merchant_name: string | null;
  date: string | null;
  total_amount: number | null;
  currency: string;
  line_items: Array<{ description: string; amount: number }>;
  category_guess: "food" | "transport" | "lodging" | "supplies" | "other";
  confidence: number;
}
```

## 5. Processing Sequence

1. Fetch document row by `documentId`.
2. Generate signed download URL from Supabase Storage.
3. Download file buffer.
4. Compute SHA-256 hash.
5. Call OpenAI extraction.
6. Save `duplicate_hash`, `extraction_data`, `processed_at`.
7. Return extraction result to the rules engine.

## 6. Sample Receipt Tests

### Sample 1: Clean food receipt

- Description: Photo of a Chipotle receipt, date visible, total `$18.50`.
- Expected output:

```json
{
  "merchant_name": "Chipotle",
  "date": "2026-04-04",
  "total_amount": 18.5,
  "currency": "USD",
  "line_items": [],
  "category_guess": "food",
  "confidence": 0.92
}
```

### Sample 2: Travel receipt

- Description: Uber emailed receipt screenshot, total `$26.14`.
- Expected output:

```json
{
  "merchant_name": "Uber",
  "date": "2026-04-04",
  "total_amount": 26.14,
  "currency": "USD",
  "line_items": [],
  "category_guess": "transport",
  "confidence": 0.88
}
```

### Sample 3: Hotel invoice

- Description: Marriott PDF invoice with line items and taxes.
- Expected output:

```json
{
  "merchant_name": "Marriott",
  "date": "2026-04-03",
  "total_amount": 142.67,
  "currency": "USD",
  "line_items": [
    { "description": "Room", "amount": 119.0 },
    { "description": "Taxes and fees", "amount": 23.67 }
  ],
  "category_guess": "lodging",
  "confidence": 0.9
}
```

### Edge cases to test

- Blurry phone photo
- Handwritten receipt
- Foreign language receipt
- No visible date

## 7. Storage And Audit Notes

- Preserve original files for organizer review.
- Never overwrite an existing document; create a new row if the user re-uploads.
- Log extraction failures for the demo and future retries.
