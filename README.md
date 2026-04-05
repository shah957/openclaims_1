# OpenClaims Ops

OpenClaims Ops is a Catapult Hacks 2026 project for running reimbursement, stipend, and grant claim programs with proof-of-personhood at the front door. Claimants verify with World ID, upload supporting documents, pass through OCR and rule checks, and then move into auto-approval, auto-rejection, or a human review queue.

## What is in the app

- Public claim flow with World ID verification, document upload, claim submission, and status lookup.
- Organizer portal with program creation, dashboard analytics, flagged-claim review, and approved-claim CSV export.
- Processing pipeline with receipt extraction, duplicate document hashing, rules evaluation, audit logging, and notification hooks.
- Demo dataset generator for a convincing hackathon walkthrough.

## Stack

- Next.js 16 App Router
- React 19
- Supabase Auth, Postgres, and Storage
- World ID / IDKit
- OpenAI for receipt extraction fallback-aware processing
- Resend for outbound claim notifications
- Tailwind CSS and Recharts

## Project structure

- `src/app` - public pages, organizer pages, and API routes
- `src/components` - claim flow, organizer UI, and shared UI pieces
- `src/lib` - Supabase helpers, dashboard queries, World ID helpers, notifications, and rules logic
- `supabase` - SQL seed output and migrations
- `scripts` - local seed and deployment-readiness checks
- `docs` - concept, architecture, phase plans, and implementation checkpoint

## Quick start

1. Install dependencies with `npm install`.
2. Copy `.env.local.example` to `.env.local`.
3. Fill in the required environment variables.
4. Start the app with `npm run dev`.
5. Generate demo SQL with `npm run seed:demo`.

## Environment variables

Required for the full product flow:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_WORLD_APP_ID`
- `NEXT_PUBLIC_WORLD_ENV`
- `WORLD_RP_ID`
- `WORLD_RP_SIGNING_KEY`

Optional but recommended:

- `OPENAI_API_KEY` for OpenAI-based receipt extraction
- `RCAC_GENAI_API_KEY` for Purdue RCAC GenAI Studio receipt extraction
- `RCAC_GENAI_BASE_URL` if you need to override the default RCAC endpoint
- `RCAC_GENAI_MODEL` to pick a different RCAC model; defaults to `llama4:latest`
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for live email delivery
- `DEMO_SEED_ENABLED` if you want to gate demo-only flows

Apply the migration in [supabase/migrations/002_claim_contact_email.sql](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/supabase/migrations/002_claim_contact_email.sql) before relying on claimant email delivery.

## Useful commands

- `npm run dev` - local development server
- `npm run lint` - lint the app
- `npm run build` - production build validation
- `npm run seed:demo` - regenerate `supabase/seed.sql`
- `npm run check:deploy` - verify required files and environment variables for deployment

## Deployment notes

The app is designed for Vercel plus Supabase.

1. Import the project into Vercel.
2. Copy the required environment variables into the Vercel project.
3. Apply the Supabase migration for `claim_contact_email`.
4. Verify the deployed `/api/rp-signature` and `/api/verify-proof` routes.
5. Test the public claim flow, duplicate-human protection, duplicate-document flow, review queue, and CSV export in the deployed environment.

## Documentation map

- Product concept: [docs/00-concept.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/00-concept.md)
- Architecture: [docs/01-technical-architecture.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/01-technical-architecture.md)
- UI/UX spec: [docs/02-ui-ux-spec.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/02-ui-ux-spec.md)
- Phase docs: [docs/06-phase-1-foundation.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/06-phase-1-foundation.md) through [docs/12-phase-7-submission.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/12-phase-7-submission.md)
- Live checkpoint: [docs/13-progress-check.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/13-progress-check.md)

## Current status

Local validation currently uses:

- `npm run seed:demo`
- `npm run lint`
- `npm run build`

Deployment readiness can be checked with `npm run check:deploy`.
