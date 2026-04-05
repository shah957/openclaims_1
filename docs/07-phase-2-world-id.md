---
doc: 07-phase-2-world-id
depends_on:
  - 01-technical-architecture.md
  - 02-ui-ux-spec.md
  - 03-world-id-integration.md
  - 06-phase-1-foundation.md
referenced_by:
  - 08-phase-3-claims.md
  - 11-phase-6-polish.md
status: complete
---

# Phase 2 World ID (Hours 4-8)

## 1. World ID Developer Portal Setup

1. Create the OpenClaims Ops app.
2. Enable World ID.
3. Generate RP credentials.
4. Save credentials to `.env.local`.
5. Start in `staging`.
6. Confirm the claim flow uses `openclaims-{program-slug}` actions.

## 2. Install IDKit Packages

```bash
pnpm add @worldcoin/idkit @worldcoin/idkit-core react-qr-code
```

## 3. Implement `/api/rp-signature`

- File: `src/app/api/rp-signature/route.ts`
- Reuse the exact route from [03-world-id-integration.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/03-world-id-integration.md).
- Add input validation and short-lived signatures.

## 4. Implement `/api/verify-proof`

- File: `src/app/api/verify-proof/route.ts`
- Required behavior:
  - load program by slug
  - forward proof to World Verify API
  - extract `nullifier_hash`
  - reject duplicates with `409`
  - create verified pending claim shell

## 5. Implement Verification Component

- File: `src/components/world-id/verify-button.tsx`
- File: `src/components/world-id/verification-status.tsx`

Use the component pattern from [03-world-id-integration.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/03-world-id-integration.md), with these UI states:

- idle
- generating session
- awaiting scan
- verifying
- verified
- already claimed
- failed

## 6. Integrate Into Claim Page

### Flow

1. Load program details by slug.
2. Show program summary and World ID explainer card.
3. Render `VerifyButton`.
4. On success:
   - store `claimId`
   - unlock the claim form section
5. On duplicate:
   - show “already claimed” card with status lookup link

### Suggested state shape

```ts
type ClaimPageState = {
  claimId: string | null;
  verificationStatus: "idle" | "loading" | "verified" | "duplicate" | "error";
  verificationMessage: string | null;
};
```

## 7. Nullifier Storage

Query pattern:

```ts
const { data: existingClaim } = await supabase
  .from("claims")
  .select("id")
  .eq("program_id", program.id)
  .eq("nullifier_hash", nullifierHash)
  .maybeSingle();
```

Insert pattern:

```ts
await supabase.from("claims").insert({
  program_id: program.id,
  nullifier_hash: nullifierHash,
  world_id_verified: true,
  verification_level: verificationLevel,
  status: "pending",
});
```

## 8. Testing Checklist

- Simulator verification works in staging.
- `/api/rp-signature` returns a new nonce each time.
- `/api/verify-proof` forwards correctly to World.
- Nullifier is stored in the database.
- Repeating the same verification for the same program returns `already_claimed`.
- Verifying the same person on a different program is allowed.
