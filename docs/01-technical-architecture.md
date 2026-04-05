---
doc: 01-technical-architecture
depends_on:
  - 00-concept.md
referenced_by:
  - 02-ui-ux-spec.md
  - 03-world-id-integration.md
  - 04-document-processing.md
  - 05-rules-engine.md
  - 06-phase-1-foundation.md
  - 07-phase-2-world-id.md
  - 08-phase-3-claims.md
  - 09-phase-4-processing.md
  - 10-phase-5-organizer.md
  - 11-phase-6-polish.md
status: complete
---

# OpenClaims Ops Technical Architecture

## 1. System Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                                Claimants                                   │
│                 Public claim link, World ID verification, upload           │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │ HTTPS
                                │
┌───────────────────────────────▼────────────────────────────────────────────┐
│                           Next.js Frontend                                 │
│  App Router pages, shadcn/ui, Tailwind, IDKit QR flow, organizer UI       │
└───────────────┬───────────────────────────────┬────────────────────────────┘
                │ fetch JSON                    │ signed upload / realtime UI
                │                               │
┌───────────────▼────────────────────────────────────────────────────────────┐
│                      Next.js Route Handlers (`src/app/api`)               │
│  Auth checks, World ID proof verification, CRUD, export, orchestration    │
└───────┬──────────────────────┬──────────────────────┬──────────────────────┘
        │ SQL / Auth / Storage │ POST verify proof    │ POST vision extract
        │                      │                      │
┌───────▼─────────────┐  ┌─────▼────────────────┐  ┌──▼─────────────────────┐
│      Supabase       │  │   World ID API       │  │     OpenAI API         │
│ Postgres + Auth +   │  │ `POST /api/v4/verify`│  │ Vision receipt parsing │
│ Storage buckets     │  │ RP signature flow    │  │ Structured JSON output │
└───────┬─────────────┘  └──────────────────────┘  └────────────────────────┘
        │
        │ optional notifications / payout side effects
┌───────▼────────────────────────────────────────────────────────────────────┐
│ External add-ons: Resend email, CSV payout export, demo seed scripts      │
└────────────────────────────────────────────────────────────────────────────┘
```

### Core data flows

1. Organizer signs in with Supabase Auth and creates a program in `/dashboard/programs/new`.
2. Public claimant opens `/claim/[slug]`, requests an RP signature, completes World ID, and sends proof to `/api/verify-proof`.
3. Backend verifies proof with World, checks `(program_id, nullifier_hash)` uniqueness, and creates a pending verified claim shell.
4. Claimant completes the form, uploads a document to Supabase Storage, and submits `/api/claims`.
5. Backend stores the claim, document rows, hashes the upload, calls OpenAI for extraction, runs the rules engine, and updates claim status.
6. Organizers review flagged claims, export approved claims, and monitor budget/status in the dashboard.

## 2. Technology Stack

Versions below were checked against the npm registry on April 4, 2026.

### Frontend dependencies

| Package | Version | Use |
|---|---:|---|
| `next` | `16.2.2` | Full-stack React framework, App Router, route handlers |
| `react` | `19.2.4` | UI rendering |
| `react-dom` | `19.2.4` | Client/server DOM rendering |
| `tailwindcss` | `4.2.2` | Utility-first styling |
| `lucide-react` | `1.7.0` | Icon system |
| `react-dropzone` | `15.0.0` | Claim document uploads |
| `recharts` | `3.8.1` | Organizer dashboard charts |
| `@worldcoin/idkit` | `4.0.11` | World ID React widgets |
| `@worldcoin/idkit-core` | `4.1.0` | Low-level QR/connect flow and polling |
| `class-variance-authority` | `0.7.1` | Variant-driven component styling |
| `clsx` | `2.1.1` | Class composition |
| `tailwind-merge` | `3.5.0` | Tailwind class dedupe |
| `zod` | `4.3.6` | Request validation and schema typing |

### Backend dependencies

| Package | Version | Use |
|---|---:|---|
| `@supabase/supabase-js` | `2.101.1` | DB, auth, storage access |
| `@supabase/ssr` | `0.10.0` | Server/browser Supabase helpers for App Router |
| `openai` | `6.33.0` | GPT-4o receipt extraction |
| `resend` | `6.10.0` | Transactional notifications |

### Dev dependencies

| Package | Version | Use |
|---|---:|---|
| `typescript` | `6.0.2` | Strict typing |
| `eslint` | `9.x` | Linting |
| `eslint-config-next` | `16.2.2` | Next.js lint rules |
| `prettier` | `3.8.1` | Formatting |
| `shadcn` | `4.1.2` | CLI for component installation |

### External services

| Service | Version / Plan | Use |
|---|---|---|
| World ID Developer Portal | IDKit 4.x / Verify API v4 | Proof-of-personhood, RP signatures, nullifiers |
| Supabase | Hosted Postgres + Storage + Auth | App database, file storage, auth |
| OpenAI | `gpt-4o` or latest GPT-4o vision-capable model | Receipt extraction |
| Resend | API v2 | Email notifications |
| Vercel | Hobby / Pro | Deployment |

## 3. Project Structure

```text
openclaims-ops/
├── docs/
│   ├── 00-concept.md
│   ├── 01-technical-architecture.md
│   ├── 02-ui-ux-spec.md
│   ├── 03-world-id-integration.md
│   ├── 04-document-processing.md
│   ├── 05-rules-engine.md
│   ├── 06-phase-1-foundation.md
│   ├── 07-phase-2-world-id.md
│   ├── 08-phase-3-claims.md
│   ├── 09-phase-4-processing.md
│   ├── 10-phase-5-organizer.md
│   ├── 11-phase-6-polish.md
│   └── 12-phase-7-submission.md
├── public/
│   ├── receipts/
│   └── world-id-badge.svg
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   └── claim/
│   │   │       └── [slug]/
│   │   │           ├── page.tsx
│   │   │           └── status/
│   │   │               └── page.tsx
│   │   ├── (auth)/
│   │   │   └── auth/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       └── programs/
│   │   │           ├── new/
│   │   │           │   └── page.tsx
│   │   │           └── [id]/
│   │   │               ├── page.tsx
│   │   │               ├── review/
│   │   │               │   └── page.tsx
│   │   │               └── export/
│   │   │                   └── page.tsx
│   │   ├── api/
│   │   │   ├── rp-signature/route.ts
│   │   │   ├── verify-proof/route.ts
│   │   │   ├── claims/route.ts
│   │   │   ├── claims/[id]/route.ts
│   │   │   ├── programs/route.ts
│   │   │   ├── programs/[id]/route.ts
│   │   │   ├── programs/[id]/export/route.ts
│   │   │   ├── documents/upload/route.ts
│   │   │   ├── documents/process/route.ts
│   │   │   └── notifications/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── world-id/
│   │   ├── claims/
│   │   ├── programs/
│   │   ├── dashboard/
│   │   ├── documents/
│   │   └── shared/
│   ├── hooks/
│   ├── lib/
│   │   ├── notifications/
│   │   ├── processing/
│   │   ├── supabase/
│   │   ├── world-id/
│   │   └── utils.ts
│   └── types/
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── scripts/
│   └── seed-demo-data.ts
├── .env.local.example
├── components.json
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 4. API Route Specification

### World ID

| Method | Path | Auth | Request body | Success response | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/rp-signature` | No | `{ action: string }` | `{ data: { rp_id, sig, nonce, created_at, expires_at } }` | `200`, `400`, `500` |
| `POST` | `/api/verify-proof` | No | `{ programSlug: string, proof: IDKitCompletedVerificationResponse }` | `{ data: { claimId, nullifierHash, verificationLevel, verified: true } }` | `200`, `400`, `404`, `409`, `500` |

### Programs

| Method | Path | Auth | Request body | Success response | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/programs` | Yes | none | `{ data: ProgramSummary[] }` | `200`, `401`, `500` |
| `POST` | `/api/programs` | Yes | `{ name, slug, description, rules, budgetTotal }` | `{ data: Program }` | `201`, `400`, `401`, `409`, `500` |
| `GET` | `/api/programs/[id]` | Yes | none | `{ data: ProgramDetail }` | `200`, `401`, `404`, `500` |
| `PATCH` | `/api/programs/[id]` | Yes | partial update payload | `{ data: Program }` | `200`, `400`, `401`, `404`, `500` |
| `GET` | `/api/programs/[id]/export` | Yes | query params: `status`, `from`, `to` | CSV stream or `{ data: { url } }` | `200`, `401`, `404`, `500` |

### Claims

| Method | Path | Auth | Request body | Success response | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/claims` | Yes | query params: `programId`, `status` | `{ data: ClaimListItem[] }` | `200`, `401`, `500` |
| `POST` | `/api/claims` | No | `{ claimId, amountRequested, category, description, documents }` | `{ data: { claimId, status } }` | `201`, `400`, `404`, `409`, `500` |
| `GET` | `/api/claims/[id]` | Mixed | none | `{ data: ClaimDetail }` | `200`, `401`, `404`, `500` |
| `PATCH` | `/api/claims/[id]` | Yes | `{ status, amountApproved?, reviewerNotes? }` | `{ data: ClaimDetail }` | `200`, `400`, `401`, `404`, `500` |

### Documents

| Method | Path | Auth | Request body | Success response | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/documents/upload` | No | multipart form-data with `claimId`, `programId`, `file` | `{ data: { documentId, storagePath, publicUrl } }` | `201`, `400`, `404`, `413`, `415`, `500` |
| `POST` | `/api/documents/process` | Yes or internal | `{ claimId, documentId }` | `{ data: { claimId, documentId, decision } }` | `200`, `400`, `404`, `500` |

### Notifications

| Method | Path | Auth | Request body | Success response | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/notifications` | Yes or internal | `{ type, claimId, email?, payload }` | `{ data: { queued: true } }` | `200`, `400`, `401`, `500` |

## 5. Database Schema (`supabase/migrations/001_initial_schema.sql`)

```sql
create extension if not exists "pgcrypto";

create type public.program_status as enum ('active', 'paused', 'closed');
create type public.claim_status as enum (
  'pending',
  'processing',
  'auto_approved',
  'auto_rejected',
  'flagged',
  'manually_approved',
  'manually_rejected'
);
create type public.document_type as enum ('receipt', 'invoice', 'id', 'other');
create type public.verification_level as enum ('orb', 'device', 'document', 'unknown');
create type public.audit_action as enum (
  'submitted',
  'verified',
  'processing_started',
  'auto_approved',
  'auto_rejected',
  'flagged',
  'manually_approved',
  'manually_rejected',
  'exported'
);

create table if not exists public.organizers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  world_id_action text not null unique,
  description text not null,
  rules jsonb not null default '{}'::jsonb,
  budget_total numeric(12,2) not null check (budget_total >= 0),
  budget_committed numeric(12,2) not null default 0 check (budget_committed >= 0),
  status public.program_status not null default 'active',
  created_by uuid not null references public.organizers(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  nullifier_hash text not null,
  world_id_verified boolean not null default false,
  verification_level public.verification_level not null default 'unknown',
  status public.claim_status not null default 'pending',
  amount_requested numeric(12,2),
  amount_approved numeric(12,2),
  category text,
  description text,
  extraction_result jsonb,
  rule_check_result jsonb,
  confidence_score numeric(4,3),
  reviewer_notes text,
  reviewed_by uuid references public.organizers(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  file_url text not null,
  storage_path text not null,
  file_type public.document_type not null default 'receipt',
  original_filename text not null,
  extraction_data jsonb,
  duplicate_hash text,
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  action public.audit_action not null,
  actor text not null,
  details jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now(),
  ip_address inet
);

create unique index if not exists claims_program_id_nullifier_hash_key
  on public.claims(program_id, nullifier_hash);

create index if not exists claims_program_id_idx
  on public.claims(program_id);

create index if not exists documents_claim_id_idx
  on public.documents(claim_id);

create index if not exists documents_duplicate_hash_idx
  on public.documents(duplicate_hash);

create index if not exists audit_log_claim_id_idx
  on public.audit_log(claim_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_organizers_updated_at on public.organizers;
create trigger set_organizers_updated_at
before update on public.organizers
for each row execute procedure public.set_updated_at();

drop trigger if exists set_programs_updated_at on public.programs;
create trigger set_programs_updated_at
before update on public.programs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_claims_updated_at on public.claims;
create trigger set_claims_updated_at
before update on public.claims
for each row execute procedure public.set_updated_at();

alter table public.organizers enable row level security;
alter table public.programs enable row level security;
alter table public.claims enable row level security;
alter table public.documents enable row level security;
alter table public.audit_log enable row level security;

create policy "organizers can read own profile"
on public.organizers
for select
using (auth.uid() = id);

create policy "organizers can upsert own profile"
on public.organizers
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "organizers can manage own programs"
on public.programs
for all
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "organizers can read claims for owned programs"
on public.claims
for select
using (
  exists (
    select 1
    from public.programs
    where programs.id = claims.program_id
      and programs.created_by = auth.uid()
  )
);

create policy "public can insert claims"
on public.claims
for insert
with check (true);

create policy "organizers can update claims for owned programs"
on public.claims
for update
using (
  exists (
    select 1
    from public.programs
    where programs.id = claims.program_id
      and programs.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.programs
    where programs.id = claims.program_id
      and programs.created_by = auth.uid()
  )
);

create policy "organizers can read documents for owned programs"
on public.documents
for select
using (
  exists (
    select 1
    from public.claims
    join public.programs on programs.id = claims.program_id
    where claims.id = documents.claim_id
      and programs.created_by = auth.uid()
  )
);

create policy "public can insert documents"
on public.documents
for insert
with check (true);

create policy "organizers can read audit logs for owned programs"
on public.audit_log
for select
using (
  exists (
    select 1
    from public.claims
    join public.programs on programs.id = claims.program_id
    where claims.id = audit_log.claim_id
      and programs.created_by = auth.uid()
  )
);
```

## 6. External Service Integration Specs

### World ID

| Item | Value |
|---|---|
| Frontend SDK | `@worldcoin/idkit` + `@worldcoin/idkit-core` |
| Verify endpoint | `POST https://developer.world.org/api/v4/verify/{WORLD_RP_ID}` |
| Auth method | RP context signed with `WORLD_RP_SIGNING_KEY`; client sends proof payload; server forwards proof |
| Request body | IDKit completed proof payload plus `action`, `signal_hash`, `proof`, `nullifier_hash`, `merkle_root`, `verification_level` |
| Success shape | `success: true`, proof metadata, nullifier, optional verification results |
| Failure modes | invalid proof, expired signature, environment mismatch, duplicate nullifier, malformed request |

### OpenAI

| Item | Value |
|---|---|
| Model | `gpt-4o` for MVP, or latest GPT-4o vision-capable replacement with JSON output |
| Endpoint | `POST /v1/chat/completions` via `openai.chat.completions.create()` |
| Max completion tokens | 500 for extraction response |
| Input | One image URL or signed download URL plus short extraction prompt |
| Expected cost | Roughly `$0.01` to `$0.03` per receipt in the MVP flow |
| Failure handling | mark document as low-confidence, flag claim for manual review |

### Supabase Storage

| Item | Value |
|---|---|
| Bucket | `claim-documents` |
| Public/private | Private bucket; signed URLs for organizer review, optional public read for demo only |
| Path convention | `programs/{programId}/claims/{claimId}/{timestamp}-{sanitizedFilename}` |
| Max file size | `10MB` |
| Accepted MIME types | `image/jpeg`, `image/png`, `application/pdf` |

### Resend

| Item | Value |
|---|---|
| Endpoint | `POST https://api.resend.com/emails` |
| Use | Submission, approval, rejection, reviewer alert emails |
| MVP fallback | Console logging when `RESEND_API_KEY` is absent |

## 7. Environment Variables

| Variable | Public? | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL for links and metadata |
| `NEXT_PUBLIC_WORLD_APP_ID` | Yes | World app identifier used by the client |
| `NEXT_PUBLIC_WORLD_ENV` | Yes | `staging` or `production` for IDKit |
| `SUPABASE_URL` | No | Supabase project URL for server clients |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Full-access server key for route handlers |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser anon key |
| `WORLD_RP_ID` | No | World relying party identifier |
| `WORLD_RP_SIGNING_KEY` | No | Server-only RP signing key |
| `OPENAI_API_KEY` | No | Receipt extraction access |
| `RESEND_API_KEY` | No | Email delivery API key |
| `RESEND_FROM_EMAIL` | No | Sender email for notifications |
| `DEMO_SEED_ENABLED` | No | Toggle demo seeding in non-production |

## 8. Architecture Decisions

1. Next.js App Router remains the single frontend and backend surface to keep the hackathon repo simple.
2. Supabase owns persistence, auth, and storage to reduce infrastructure overhead.
3. World ID verification happens before full claim submission, because nullifier uniqueness is the trust gate.
4. Claim creation is split into two moments:
   - verification shell claim creation
   - full claim submission with document metadata
5. Extraction and rules processing are asynchronous but still initiated from the same backend for MVP speed.
