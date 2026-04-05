# OpenClaims Ops — Claude Code Master Prompt

## Instructions for Claude Code / Codex

You are building **OpenClaims Ops**, a hackathon project for Catapult Hacks 2026 at Purdue University (April 3–5, 2026). This document is your master reference. It tells you exactly what documentation to generate, in what order, and what each document must contain. After all documentation is generated, you will then implement the code phase by phase using these docs as your blueprint.

---

## How This Works

### Step 1: Generate Documentation (this prompt)
Read the concept document at `docs/00-concept.md` (the full OpenClaims Ops concept doc provided alongside this prompt). Then generate every document listed below in order. Each document lives in a `docs/` folder at the project root.

### Step 2: Implement Code Phase by Phase
After all docs are generated, implement the actual codebase phase by phase. Before starting each phase, re-read the relevant docs. Each phase doc contains exact file paths, code patterns, and acceptance criteria.

### Document Index
Every generated document must include a header block with cross-references so you can always navigate:

```markdown
---
doc: [document number and name]
depends_on: [list of docs this one references]
referenced_by: [list of docs that reference this one]
status: draft | complete
---
```

---

## Documents to Generate

Generate these in exact order. Each section below specifies exactly what must be in the document.

---

### `docs/00-concept.md`
**This already exists.** It is the full OpenClaims Ops concept document provided to you. Copy it into the docs folder as-is. All other documents reference it.

---

### `docs/01-technical-architecture.md`

**Purpose:** The single source of truth for how the entire system is built. Any implementation question about "where does X live" or "how does Y connect to Z" is answered here.

**Must contain:**

1. **System architecture diagram** (ASCII art)
   - Show: Next.js frontend → Next.js API routes → Supabase (DB + Auth + Storage) → External services (World ID API, OpenAI API)
   - Show data flow arrows with labels

2. **Technology stack table**
   - Every dependency with exact package name, version (pin to latest stable as of April 2026), and what it's used for
   - Separate sections: frontend deps, backend deps, dev deps, external services

3. **Project structure** — exact file tree
   ```
   openclaims-ops/
   ├── docs/                    # All documentation (this folder)
   ├── public/                  # Static assets
   ├── src/
   │   ├── app/                 # Next.js App Router pages
   │   │   ├── (public)/        # Public routes (no auth required)
   │   │   │   ├── page.tsx           # Landing page
   │   │   │   └── claim/
   │   │   │       └── [slug]/
   │   │   │           ├── page.tsx   # Claim submission page
   │   │   │           └── status/
   │   │   │               └── page.tsx  # Claim status lookup
   │   │   ├── (auth)/          # Auth routes
   │   │   │   └── auth/
   │   │   │       └── page.tsx       # Login/signup
   │   │   ├── (dashboard)/     # Protected organizer routes
   │   │   │   └── dashboard/
   │   │   │       ├── page.tsx       # Dashboard home
   │   │   │       ├── programs/
   │   │   │       │   ├── new/
   │   │   │       │   │   └── page.tsx  # Program creation wizard
   │   │   │       │   └── [id]/
   │   │   │       │       ├── page.tsx     # Program detail/dashboard
   │   │   │       │       ├── review/
   │   │   │       │       │   └── page.tsx # Review queue
   │   │   │       │       └── export/
   │   │   │       │           └── page.tsx # Export/payout
   │   │   │       └── layout.tsx     # Dashboard layout with sidebar
   │   │   ├── api/             # API routes
   │   │   │   ├── rp-signature/
   │   │   │   │   └── route.ts
   │   │   │   ├── verify-proof/
   │   │   │   │   └── route.ts
   │   │   │   ├── claims/
   │   │   │   │   ├── route.ts       # POST create, GET list
   │   │   │   │   └── [id]/
   │   │   │   │       └── route.ts   # GET detail, PATCH update status
   │   │   │   ├── programs/
   │   │   │   │   ├── route.ts       # POST create, GET list
   │   │   │   │   └── [id]/
   │   │   │   │       ├── route.ts   # GET detail, PATCH update
   │   │   │   │       └── export/
   │   │   │   │           └── route.ts  # GET export CSV
   │   │   │   ├── documents/
   │   │   │   │   ├── upload/
   │   │   │   │   │   └── route.ts   # POST upload
   │   │   │   │   └── process/
   │   │   │   │       └── route.ts   # POST trigger extraction
   │   │   │   └── notifications/
   │   │   │       └── route.ts
   │   │   ├── layout.tsx       # Root layout
   │   │   └── globals.css      # Global styles + Tailwind
   │   ├── components/          # Shared UI components
   │   │   ├── ui/              # shadcn/ui components
   │   │   ├── world-id/        # World ID verification components
   │   │   │   ├── verify-button.tsx
   │   │   │   └── verification-status.tsx
   │   │   ├── claims/          # Claim-related components
   │   │   │   ├── claim-form.tsx
   │   │   │   ├── claim-card.tsx
   │   │   │   ├── claim-detail.tsx
   │   │   │   └── claim-status-timeline.tsx
   │   │   ├── programs/        # Program-related components
   │   │   │   ├── program-wizard.tsx
   │   │   │   ├── program-card.tsx
   │   │   │   └── program-dashboard.tsx
   │   │   ├── dashboard/       # Dashboard components
   │   │   │   ├── sidebar.tsx
   │   │   │   ├── stats-cards.tsx
   │   │   │   ├── budget-meter.tsx
   │   │   │   └── claims-table.tsx
   │   │   ├── documents/       # Document components
   │   │   │   ├── document-upload.tsx
   │   │   │   ├── document-viewer.tsx
   │   │   │   └── extraction-display.tsx
   │   │   └── shared/          # Generic shared components
   │   │       ├── navbar.tsx
   │   │       ├── footer.tsx
   │   │       ├── confidence-badge.tsx
   │   │       └── status-badge.tsx
   │   ├── lib/                 # Utility libraries
   │   │   ├── supabase/
   │   │   │   ├── client.ts        # Browser client
   │   │   │   ├── server.ts        # Server client
   │   │   │   └── middleware.ts     # Auth middleware
   │   │   ├── world-id/
   │   │   │   ├── config.ts        # World ID constants
   │   │   │   ├── sign-request.ts  # RP signature generation
   │   │   │   └── verify.ts        # Backend verification helper
   │   │   ├── processing/
   │   │   │   ├── extract-receipt.ts   # GPT-4o Vision extraction
   │   │   │   ├── rules-engine.ts      # Rules evaluation
   │   │   │   └── duplicate-check.ts   # Document hash comparison
   │   │   ├── notifications/
   │   │   │   └── send.ts          # Email/notification helper
   │   │   └── utils.ts             # General utilities
   │   ├── types/               # TypeScript type definitions
   │   │   ├── database.ts          # Supabase generated types
   │   │   ├── claims.ts
   │   │   ├── programs.ts
   │   │   └── world-id.ts
   │   └── hooks/               # Custom React hooks
   │       ├── use-world-id.ts
   │       ├── use-claims.ts
   │       └── use-programs.ts
   ├── supabase/
   │   └── migrations/
   │       └── 001_initial_schema.sql
   ├── .env.local.example
   ├── next.config.ts
   ├── tailwind.config.ts
   ├── tsconfig.json
   ├── package.json
   └── README.md
   ```

4. **API route specification table**
   - Every route: method, path, auth required (y/n), request body shape, response shape, status codes
   - Group by domain: World ID, Programs, Claims, Documents, Export

5. **Database schema** — exact SQL for the Supabase migration file
   - All tables from concept doc section 4
   - Indexes on: nullifier_hash + program_id (unique), program_id on claims, claim_id on documents
   - Row-level security policies (organizers see own programs' claims, public can insert claims)
   - Timestamps default to now()

6. **External service integration specs**
   - World ID: endpoints, auth method, request/response shapes, error codes
   - OpenAI: model, endpoint, token limits, expected cost per call
   - Supabase Storage: bucket config, file size limits, accepted types
   - Resend (optional): API shape

7. **Environment variables** — full list with descriptions, which are public vs secret

---

### `docs/02-ui-ux-spec.md`

**Purpose:** Every page and component fully specified so implementation produces consistent, polished UI.

**Must contain:**

1. **Design system**
   - Color tokens (with CSS variable names): primary, accent, success, warning, error, background, surface, text, muted
   - Typography scale (heading sizes, body, small, mono)
   - Spacing scale (consistent with Tailwind defaults)
   - Border radius convention
   - Shadow levels
   - Animation/transition defaults

2. **shadcn/ui components to install**
   - Exact list: button, card, input, label, select, textarea, badge, dialog, dropdown-menu, table, tabs, toast, tooltip, progress, separator, sheet, avatar, skeleton
   - Configuration: default theme overrides in tailwind.config.ts

3. **Page-by-page wireframe descriptions**
   For each page, specify:
   - Layout (sidebar? navbar? full-width?)
   - Every UI element on the page, top to bottom, left to right
   - Interactive states (hover, active, disabled, loading, empty, error)
   - Mobile layout adjustments
   - Data displayed and where it comes from (which API route)

   Pages to spec:
   - Landing page (`/`)
   - Auth page (`/auth`)
   - Dashboard home (`/dashboard`)
   - Program creation wizard (`/dashboard/programs/new`) — all 4 steps
   - Program detail/dashboard (`/dashboard/programs/[id]`)
   - Review queue (`/dashboard/programs/[id]/review`)
   - Export page (`/dashboard/programs/[id]/export`)
   - Claim page (`/claim/[slug]`) — all steps including World ID
   - Claim status page (`/claim/[slug]/status`)

4. **Component specifications**
   For each component in `src/components/`, specify:
   - Props interface (TypeScript)
   - Visual states
   - Responsive behavior
   - Accessibility requirements (aria labels, keyboard nav)

5. **Responsive breakpoints**
   - Mobile: < 768px
   - Tablet: 768–1024px
   - Desktop: > 1024px
   - Which pages are mobile-first vs desktop-first

---

### `docs/03-world-id-integration.md`

**Purpose:** Everything needed to implement World ID correctly. A developer should be able to implement the full integration reading only this doc.

**Must contain:**

1. **Developer Portal setup checklist**
   - Step-by-step: create account, create app, enable World ID 4.0, get credentials
   - Where each credential goes in `.env.local`

2. **IDKit 4.x integration — frontend**
   - Exact code for the verification component
   - How to generate the connect URL
   - How to display the QR code
   - How to handle `pollUntilCompletion()`
   - How to handle errors (user cancels, timeout, invalid proof)
   - How to pass the response to the backend

3. **RP signature generation — backend**
   - Exact code for `/api/rp-signature` route
   - How `signRequest` works
   - Security: never expose signing key to client

4. **Proof verification — backend**
   - Exact code for `/api/verify-proof` route
   - Forward payload to World API
   - Handle success/failure responses
   - Extract nullifier from response
   - Check nullifier uniqueness in database
   - Error handling for all failure modes

5. **Action string management**
   - Convention: `openclaims-{program-slug}`
   - How actions scope nullifiers per program
   - Why this matters for the product (different programs = different claims allowed)

6. **Testing with the simulator**
   - How to set environment to staging
   - Simulator URL: https://simulator.worldcoin.org/
   - What the simulator returns vs production
   - How to demo using the simulator

7. **Common pitfalls and debugging**
   - Signature expiry (short window, generate fresh each time)
   - Nullifier is deterministic: same user + same app + same action = same nullifier always
   - Environment mismatch (staging proof won't verify against production endpoint)

---

### `docs/04-document-processing.md`

**Purpose:** Everything needed to implement the receipt OCR and extraction pipeline.

**Must contain:**

1. **Upload flow**
   - Client: react-dropzone config, accepted file types, max size, preview
   - Upload to Supabase Storage: bucket name, path convention (`programs/{programId}/claims/{claimId}/{filename}`)
   - Get public URL after upload

2. **GPT-4o Vision extraction**
   - Exact system prompt (from concept doc section 11)
   - How to send image URL to OpenAI API
   - How to parse the JSON response
   - Fallback for when extraction fails or returns low confidence
   - Cost estimate per call (~$0.01–0.03 per receipt)
   - Rate limiting considerations

3. **Document hashing for duplicate detection**
   - SHA-256 hash of file buffer
   - Store hash on document record
   - Query for matching hashes within same program
   - What to do on match: flag claim, don't auto-reject

4. **Extraction result schema**
   ```typescript
   interface ExtractionResult {
     merchant_name: string | null;
     date: string | null;          // YYYY-MM-DD
     total_amount: number | null;
     currency: string;             // default "USD"
     line_items: Array<{ description: string; amount: number }>;
     category_guess: "food" | "transport" | "lodging" | "supplies" | "other";
     confidence: number;           // 0.0 - 1.0
   }
   ```

5. **Testing with sample receipts**
   - Include 3 sample receipt descriptions to test with
   - Expected extraction output for each
   - Edge cases: blurry photo, handwritten receipt, foreign language, no date visible

---

### `docs/05-rules-engine.md`

**Purpose:** Complete specification of the rules engine that routes claims to auto-approve, auto-reject, or flag.

**Must contain:**

1. **Rule definitions** — each rule with:
   - Name and ID
   - What it checks
   - Input data required
   - Pass/fail/warning conditions
   - Severity level (hard_fail, soft_fail, warning, pass)
   - Score output (0.0–1.0)

2. **Full rules list:**
   - Deadline check
   - Amount cap check
   - Amount vs receipt match
   - Category validation
   - Document quality check
   - Duplicate document check
   - Budget availability check

3. **Confidence scoring formula**
   - Weight per rule
   - Weighted average calculation
   - Example calculations for: clean claim (score ~0.95), borderline claim (score ~0.72), bad claim (score ~0.3)

4. **Routing logic**
   - Hard fail on any rule → auto_reject
   - Any soft fail OR confidence below threshold → flag
   - All pass AND confidence above threshold → auto_approve
   - Flowchart (ASCII)

5. **Complete TypeScript implementation**
   - Full `runRulesEngine()` function
   - All supporting types
   - Unit test cases (input → expected output) for at least 5 scenarios

---

### `docs/06-phase-1-foundation.md`

**Purpose:** Exact implementation steps for Phase 1 (Hours 0–4). A developer reads this and executes line by line.

**Must contain:**

1. **Project initialization**
   ```bash
   npx create-next-app@latest openclaims-ops --typescript --tailwind --eslint --app --src-dir
   cd openclaims-ops
   ```

2. **Dependency installation** — exact pnpm commands for every package

3. **shadcn/ui setup** — init command + every component install command

4. **Tailwind config** — full tailwind.config.ts with custom colors, fonts

5. **Global CSS** — full globals.css with CSS variables for the design system

6. **Supabase setup**
   - Create project at supabase.com
   - Run migration SQL (from architecture doc)
   - Create storage bucket
   - Get credentials → .env.local

7. **Environment variables file** — .env.local.example with all vars and comments

8. **Root layout** — full code for src/app/layout.tsx with fonts, metadata, providers

9. **Landing page** — full code for the landing page component

10. **Basic routing structure** — create all page.tsx files with placeholder content

11. **Shared components** — navbar, footer, basic layout wrappers

12. **Acceptance criteria** — what must work before moving to Phase 2:
    - `pnpm dev` runs without errors
    - Landing page renders with correct branding
    - All routes accessible (even if placeholder)
    - Supabase connection works (test query)
    - Environment variables loaded correctly

---

### `docs/07-phase-2-world-id.md`

**Purpose:** Exact implementation steps for Phase 2 (Hours 4–8). World ID integration.

**Must contain:**

1. **World ID Developer Portal setup** — step by step with screenshots descriptions

2. **Install IDKit packages** — exact commands

3. **Implement `/api/rp-signature`** — full route code

4. **Implement `/api/verify-proof`** — full route code

5. **Implement World ID verification component** — full React component code
   - QR code display
   - Loading states
   - Success/failure handling
   - "Already claimed" state

6. **Integrate into claim page** — how the claim page flow works:
   - Step 1: Show program info + "Verify with World ID" button
   - Step 2: After verification, show claim form
   - State management between steps

7. **Nullifier storage** — Supabase query to check + store nullifiers

8. **Testing checklist:**
   - Simulator verification works
   - Proof forwards to World API correctly
   - Nullifier stored in DB
   - Second verification with same identity shows "already claimed"
   - Different action (different program) allows fresh verification

---

### `docs/08-phase-3-claims.md`

**Purpose:** Exact implementation steps for Phase 3 (Hours 8–14). Claim submission flow.

**Must contain:**

1. **Claim form component** — full code
   - Amount input with max from program rules
   - Category dropdown from program's allowed categories
   - Description textarea
   - Document upload zone (react-dropzone)

2. **Document upload implementation**
   - Client-side: file validation, preview, upload to Supabase Storage
   - Storage path convention
   - Get public URL
   - Create document record in DB

3. **Claim creation API** — `/api/claims` POST route
   - Validate World ID verification happened (check session/token)
   - Create claim record with status = "pending"
   - Trigger document processing (async)
   - Return claim ID

4. **Claim confirmation page** — what user sees after submission

5. **Program info fetching** — how claim page loads program details from slug

6. **Form validation** — client-side and server-side validation rules

7. **Acceptance criteria:**
   - Full claim submission flow works end-to-end
   - Document uploads to Supabase Storage
   - Claim record created in DB with correct program linkage
   - User sees confirmation with claim ID

---

### `docs/09-phase-4-processing.md`

**Purpose:** Exact implementation steps for Phase 4 (Hours 14–20). Document processing + rules engine.

**Must contain:**

1. **GPT-4o Vision integration** — full implementation of `extract-receipt.ts`
   - OpenAI client setup
   - Exact API call with system prompt
   - Response parsing
   - Error handling
   - Store results on document record

2. **Document hash computation** — full implementation of `duplicate-check.ts`

3. **Rules engine** — full implementation of `rules-engine.ts`
   - All 7 rules
   - Confidence scoring
   - Routing decision

4. **Processing pipeline orchestration**
   - After claim created: trigger extraction → run rules → update claim status
   - Implementation as async function called from claim creation API
   - Error handling: if extraction fails, flag for manual review

5. **Claim status updates** — how status transitions work in the DB

6. **Acceptance criteria:**
   - Upload a receipt photo → extraction returns structured data
   - Clean claim auto-approves
   - Over-budget claim auto-rejects
   - Mismatched amount claim gets flagged
   - Duplicate document gets flagged

---

### `docs/10-phase-5-organizer.md`

**Purpose:** Exact implementation steps for Phase 5 (Hours 20–28). Organizer portal.

**Must contain:**

1. **Auth implementation**
   - Supabase Auth setup (email/password)
   - Login/signup page
   - Auth middleware for dashboard routes
   - Session management

2. **Dashboard layout** — sidebar + main content area

3. **Program creation wizard** — multi-step form
   - Step 1: Basic info (name, description, slug)
   - Step 2: Rules config (all rule fields)
   - Step 3: Budget
   - Step 4: Review + publish
   - API call to create program
   - Generate shareable claim link

4. **Program dashboard page**
   - Stats cards: total, approved, flagged, rejected, pending, budget
   - Claims table with sorting and filtering
   - Budget meter component

5. **Review queue**
   - Fetch flagged claims for this program
   - Claim detail view with document preview + extraction data + rule results
   - Approve/reject buttons
   - API calls to update claim status

6. **Export page**
   - Filter by status and date range
   - Preview table
   - CSV download endpoint
   - Audit log display

7. **Dashboard analytics** — Recharts integration
   - Claims over time (bar chart)
   - Status distribution (pie chart)
   - Budget burn (line chart)

8. **Acceptance criteria:**
   - Organizer can sign up, log in
   - Create a program with all rules configured
   - View dashboard with real data
   - Review and approve/reject flagged claims
   - Export approved claims as CSV

---

### `docs/11-phase-6-polish.md`

**Purpose:** Exact implementation steps for Phase 6 (Hours 28–34). Polish and demo prep.

**Must contain:**

1. **Notification system** — toast notifications at minimum, email if time allows

2. **Claim status page for claimants** — re-verify with World ID to look up claim

3. **Loading states** — skeleton components for every data-loading view

4. **Error states** — error boundaries, friendly error messages

5. **Empty states** — what to show when no claims, no programs, etc.

6. **Mobile responsive pass** — specific fixes for claim page on mobile

7. **Demo data seeding script** — Node script that creates:
   - 1 demo program ("Catapult Meal Stipend")
   - 50 sample claims in various statuses
   - Sample documents with extraction data
   - Realistic budget numbers

8. **Deployment to Vercel**
   - vercel.json config if needed
   - Environment variables in Vercel dashboard
   - Test deployed version

9. **Demo recording prep**
   - Exact demo script (from concept doc section 6)
   - Which browser, resolution, theme
   - Pre-load World ID Simulator
   - Pre-upload test receipt images
   - Practice runs checklist

---

### `docs/12-phase-7-submission.md`

**Purpose:** Submission checklist and pitch prep.

**Must contain:**

1. **Devpost submission requirements**
   - Video upload (3–5 minutes)
   - Project description
   - Technologies used list
   - Links: GitHub repo, live demo, video

2. **Video recording checklist**
   - Screen recording software recommendation
   - Resolution/FPS settings
   - Audio: microphone check, quiet room
   - Script rehearsal

3. **Shark Tank pitch outline** (for Round 2, if we make top 12)
   - Slide 1: The problem (30 sec)
   - Slide 2: The solution — live demo (2.5 min)
   - Slide 3: How World ID makes it possible (30 sec)
   - Slide 4: Scale and impact (30 sec)
   - Slide 5: The team (15 sec)
   - Prepared answers for likely judge questions

4. **GitHub repo polish**
   - README with screenshots, setup instructions, architecture overview
   - License file
   - .env.example
   - Clean commit history (squash messy commits)

---

## Cross-Reference Map

When implementing, use this map to find the right doc for any question:

| Question | Doc |
|---|---|
| What's the file structure? | `01-technical-architecture.md` |
| What does this page look like? | `02-ui-ux-spec.md` |
| How does World ID work? | `03-world-id-integration.md` |
| How does receipt OCR work? | `04-document-processing.md` |
| How does auto-approve logic work? | `05-rules-engine.md` |
| What do I build first? | `06-phase-1-foundation.md` |
| How do I add World ID? | `07-phase-2-world-id.md` |
| How does claim submission work? | `08-phase-3-claims.md` |
| How does the backend processing pipeline work? | `09-phase-4-processing.md` |
| How do I build the organizer dashboard? | `10-phase-5-organizer.md` |
| How do I polish for demo? | `11-phase-6-polish.md` |
| How do I submit? | `12-phase-7-submission.md` |
| What's the overall product vision? | `00-concept.md` |

---

## Implementation Rules

Follow these rules during all code generation:

### Code style
- TypeScript strict mode everywhere
- Async/await over .then() chains
- Named exports over default exports (except page.tsx which Next.js requires default)
- Descriptive variable names, no abbreviations
- Comments only where logic is non-obvious
- Every API route has try/catch with proper error responses

### Component patterns
- Server Components by default; mark `"use client"` only when needed (interactivity, hooks, browser APIs)
- Use shadcn/ui components as base; customize via Tailwind classes not custom CSS
- Forms: use React state + controlled inputs (keep it simple, no form library needed for hackathon)
- Loading: use Skeleton components from shadcn/ui
- Errors: use toast notifications from shadcn/ui

### API patterns
- All API routes in `src/app/api/`
- Use Next.js Route Handlers (export async function GET/POST/PATCH/DELETE)
- Validate request body at the top of every handler
- Return consistent shape: `{ data: T }` on success, `{ error: string, message: string }` on failure
- HTTP status codes: 200 success, 201 created, 400 bad request, 401 unauthorized, 404 not found, 409 conflict, 500 server error

### Database patterns
- Use Supabase JS client, not raw SQL in application code
- Server-side: use service role key (full access)
- Client-side: use anon key (RLS enforced)
- Always select only needed columns
- Use `.single()` when expecting one result

### World ID patterns
- RP signing key NEVER leaves the server
- Generate fresh RP signature for every verification attempt
- Store nullifier hash immediately after successful verification
- Always check nullifier uniqueness BEFORE creating claim record
- Use staging environment during development, production for final demo

### File upload patterns
- Client validates file type + size before upload
- Upload to Supabase Storage with structured path
- Store file URL in database document record
- Process document async (don't block claim creation on extraction)

---

## Execution Order

When you (Claude Code / Codex) receive this prompt along with `docs/00-concept.md`:

1. **First:** Generate all docs (01 through 12) in order. Each doc should be complete, detailed, and reference the correct cross-docs.

2. **Then:** Start implementation beginning with Phase 1 (`docs/06-phase-1-foundation.md`).

3. **For each phase:**
   - Re-read the phase doc
   - Re-read any referenced docs (architecture, UI spec, etc.)
   - Implement every file and component specified
   - Verify acceptance criteria before moving to next phase

4. **After all phases:** Run the polish checklist from Phase 6, seed demo data, test the full flow.

---

## Context Reminders

Things to keep in mind throughout the entire build:

- **This is a 36-hour hackathon.** Prefer working code over perfect code. Ship features, polish later.
- **Demo is everything.** The judges see a 3–5 minute video and a 5-minute live pitch. Every feature should be demoable.
- **World ID is the star.** The proof-of-personhood integration should be prominent, polished, and clearly explained in the UI. It's not hidden infrastructure — it's the headline feature.
- **The "money shot" is abuse prevention.** Same person tries to claim twice → blocked. Same receipt submitted by two people → flagged. These moments win the category.
- **Mobile matters for claimants.** The claim page will be opened on phones (QR code scan → claim link). It must work on mobile.
- **Desktop matters for organizers.** The dashboard will be used on laptops. Information density is good here.
- **Use the hackathon's own context.** The demo scenario is "Catapult Hacks meal stipend." The judges are literally at this hackathon. Make it meta.
