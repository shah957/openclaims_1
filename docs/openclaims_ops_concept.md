# OpenClaims Ops — Complete Concept & Planning Document

## Catapult Hacks 2026 | Purdue University | April 3–5, 2026

---

## 1. Executive Summary

### What is OpenClaims Ops?

OpenClaims Ops is an end-to-end automation platform for processing rebates, stipends, grants, rewards, and reimbursements in **open applicant pools** — situations where the operator does not already have a strong identity relationship with every user.

It replaces the current painful workflow:

> Google Form → spreadsheet → manual duplicate check → manual eligibility review → manual follow-ups → manual approval/rejection → manual payout export

with a fully automated pipeline:

> Claim link → World ID verification → form + document upload → AI-powered extraction & validation → rules engine → auto-approve/reject/flag → notification → payout queue → analytics

### Why This Wins

**Target categories:**
1. **Best Proof of Human Application** (primary) — RayBan Meta Glasses Gen2
2. **Best Automation** (secondary) — Sony WH-XM5 Headphones
3. **Best Overall Project** (tertiary) — MacBook Neo

**The strategic insight:** Most hackathon teams using World ID will bolt it onto a login page. OpenClaims Ops makes proof-of-personhood the *structural foundation* of the entire product — it's the reason the automation pipeline works at all. Without World ID, you can't enforce one-person-one-claim in an open pool. With it, you can auto-approve clean claims without any human review. That's not "using World ID" — that's building a product that *couldn't exist* without World ID.

Simultaneously, the platform is a genuine end-to-end automation system: document processing, rules engines, routing logic, notifications, payout exports, analytics. That double-category coverage is the strategic advantage.

---

## 2. The Problem — In Detail

### Who has this problem?

Any organization running an open benefit program where they don't already know every applicant:

| Operator | Program | Current Pain |
|---|---|---|
| Hackathon organizers | Meal stipends, travel reimbursements | Google Form → manual receipt review → Venmo one by one |
| University departments | Student travel grants, conference funding | Email submissions → faculty manually reviews each PDF → spreadsheet tracking |
| Student organizations | Event reimbursements, competition prizes | GroupMe receipts → treasurer manually validates → Zelle payments |
| Nonprofits | Emergency microgrants, community aid | Application form → caseworker manually reviews eligibility → check mailing |
| Companies | Cashback rebates, promo rewards | Web form → CS team manually checks receipts → gift card codes |
| Government programs | Utility rebates, appliance cashback | Paper forms → clerk enters data → mailed checks weeks later |

### What makes the current process painful?

1. **Duplicate abuse.** One person submits under three emails. Same receipt uploaded by two people. No way to know without manual cross-referencing.
2. **Manual document review.** Every receipt, invoice, or proof document is opened, read, and validated by a human. For a 200-person hackathon, that's 200 receipts reviewed by hand.
3. **No rules enforcement.** "Maximum $25 per meal" is a policy, but the spreadsheet doesn't enforce it. A human reads every amount and checks it.
4. **No status visibility.** Claimants have no idea if their submission was received, is being reviewed, was approved, or was rejected. They email asking "where's my reimbursement?" — creating more manual work.
5. **Payout chaos.** Approved claims still require manual export to Venmo, Zelle, PayPal, or check-writing. No audit trail.
6. **No analytics.** "How much of the budget is committed? How many claims are pending? What's the average processing time?" Requires manual spreadsheet analysis.

### Why can't existing tools solve this?

- **Google Forms + Sheets:** No duplicate detection, no document processing, no rules engine, no automation.
- **Typeform / JotForm:** Better forms, same manual review problem. No identity layer.
- **Expensify / Concur:** Designed for employees (known users with company accounts). Require user accounts, IT setup, enterprise licensing. Overkill and wrong fit for open pools.
- **Submittable / OpenGrants:** Designed for grant management. Heavy, slow, expensive. No proof-of-personhood. No auto-approval.
- **Custom scripts:** Every org builds a one-off solution. No reusability, no identity verification, no automation.

**The gap:** No tool exists that combines open-pool identity verification + document processing + rules automation + payout management in a single lightweight platform.

---

## 3. World ID Integration — Deep Technical Design

### Why World ID is structurally necessary (not bolted on)

World ID solves the **one-person-one-claim** problem in open pools. This is the fundamental trust gap that makes manual review necessary in the first place.

**Without World ID:** You can't know if `john@gmail.com` and `j.smith@purdue.edu` are the same person. You can't know if the same receipt was uploaded by roommates splitting a "reimbursement." You can't auto-approve anything because you can't trust uniqueness.

**With World ID:** Each human gets a unique nullifier per action (program). If the nullifier has been seen before for that action, the claim is rejected at the protocol level. No email matching, no name deduplication, no manual review needed for uniqueness.

### How World ID maps to the product

| Product Concept | World ID Concept | Technical Implementation |
|---|---|---|
| Each claim program | An **Action** | Developer defines action string per program (e.g., `catapult-meal-stipend-2026`) |
| "Has this person already claimed?" | **Nullifier uniqueness** | Same (user + app_id + action) always produces the same nullifier. If nullifier exists in DB, claim is duplicate. |
| "Is this a real human?" | **Proof of Human credential** | Orb verification or Selfie Check provides uniqueness assurance |
| Claim submission | **Signal** | Optional: bind the claim ID into the proof so it can't be replayed on a different claim |

### Technical integration flow

```
1. User opens claim page for program "catapult-meal-stipend-2026"
2. Frontend calls backend: POST /api/rp-signature
   → Backend generates RP signature using signing_key (never exposed to client)
   → Returns { sig, nonce, created_at, expires_at }

3. Frontend creates IDKit request:
   IDKit.request({
     app_id: "app_xxxxx",
     action: "catapult-meal-stipend-2026",  // unique per program
     rp_context: { rp_id, nonce, created_at, expires_at, signature },
     environment: "production"
   }).preset(orbLegacy({ signal: claimId }))  // bind specific claim

4. User scans QR code with World App (or uses simulator in staging)
5. IDKit returns proof payload with nullifier

6. Frontend sends proof to backend: POST /api/verify-proof
   → Backend forwards to World API: POST https://developer.world.org/api/v4/verify/{rp_id}
   → If success=true:
       a. Check if nullifier already exists in claims DB for this action
       b. If exists → reject (duplicate human)
       c. If new → store nullifier, proceed to claim form
   → If success=false: reject (not verified human)

7. Only after verification: user can access claim form + document upload
```

### World Developer Tools Used

| Tool | How We Use It | Category Relevance |
|---|---|---|
| **World ID (IDKit 4.x)** | Core identity verification at claim time | Primary — proof-of-personhood |
| **IDKit React SDK** | Frontend verification widget | Integration depth |
| **RP Signatures** | Backend security for proof requests | Security best practice |
| **Actions** | One per claim program for uniqueness scoping | Core product architecture |
| **Nullifiers** | Duplicate human detection | The key innovation |
| **World ID Simulator** | Demo/testing environment | Development workflow |
| **Verify API (v4)** | Backend proof verification | Server-side validation |

### Why this is the strongest World ID integration at the hackathon

Most teams will use World ID as a login gate: "verify you're human, then use our app." That's equivalent to "sign in with Google." It doesn't leverage what makes World ID unique.

OpenClaims Ops uses World ID's **action-scoped nullifiers** as the structural foundation for automated trust. The entire rules engine, auto-approval pipeline, and abuse prevention system is built on top of the guarantee that one human = one nullifier per program. Remove World ID, and the product collapses back to manual review.

That's what "leverages proof-of-personhood" means.

---

## 4. Product Architecture

### System overview

```
┌─────────────────────────────────────────────────────────┐
│                    OPENCLAIMS OPS                         │
├─────────────┬─────────────┬─────────────┬───────────────┤
│  Organizer  │   Claimant  │  Reviewer   │   Analytics   │
│    Portal   │    Portal   │    Queue    │   Dashboard   │
├─────────────┴─────────────┴─────────────┴───────────────┤
│                    Next.js Frontend                       │
├─────────────────────────────────────────────────────────┤
│                    API Layer (Next.js API Routes)         │
├────────┬──────────┬───────────┬──────────┬──────────────┤
│ World  │  Rules   │  Document │  Notif   │   Export     │
│   ID   │  Engine  │ Processing│  System  │   Engine     │
│ Verify │          │  Pipeline │          │              │
├────────┴──────────┴───────────┴──────────┴──────────────┤
│              PostgreSQL (via Supabase)                    │
└─────────────────────────────────────────────────────────┘
```

### Data model

```
Programs
├── id (uuid)
├── name ("Catapult Meal Stipend")
├── slug ("catapult-meal-stipend-2026")
├── world_id_action (= slug, used as World ID action string)
├── description
├── rules (JSON)
│   ├── max_amount_per_claim (25.00)
│   ├── max_claims_per_person (1)  // enforced by World ID
│   ├── deadline (ISO datetime)
│   ├── required_proof_types (["receipt"])
│   ├── allowed_categories (["food", "transport"])
│   └── auto_approve_threshold (confidence >= 0.85)
├── budget_total (5000.00)
├── budget_committed (running total)
├── status (active | paused | closed)
├── created_by (organizer user id)
├── created_at
└── updated_at

Claims
├── id (uuid)
├── program_id (FK)
├── nullifier_hash (from World ID — the unique human identifier for this program)
├── world_id_verified (boolean)
├── verification_level ("orb" | "selfie" | "document")
├── status (pending | auto_approved | auto_rejected | flagged | manually_approved | manually_rejected)
├── amount_requested (decimal)
├── amount_approved (decimal, nullable)
├── category (string)
├── description (text)
├── documents[] (array of document references)
├── extraction_result (JSON — OCR/AI extracted data)
├── rule_check_result (JSON — which rules passed/failed)
├── confidence_score (0.0 – 1.0)
├── reviewer_notes (text, nullable)
├── reviewed_by (user id, nullable)
├── reviewed_at (timestamp, nullable)
├── submitted_at
└── updated_at

Documents
├── id (uuid)
├── claim_id (FK)
├── file_url (Supabase storage)
├── file_type ("receipt" | "invoice" | "id" | "other")
├── original_filename
├── extraction_data (JSON)
│   ├── merchant_name
│   ├── date
│   ├── total_amount
│   ├── line_items[]
│   ├── currency
│   └── confidence
├── duplicate_hash (perceptual hash for image dedup)
├── uploaded_at
└── processed_at

Organizers (users who create programs)
├── id (uuid)
├── email
├── name
├── password_hash
├── created_at
└── updated_at

AuditLog
├── id (uuid)
├── claim_id (FK)
├── action ("submitted" | "verified" | "auto_approved" | "flagged" | "manually_approved" | "rejected" | "exported")
├── actor ("system" | "world_id" | organizer_user_id)
├── details (JSON)
├── timestamp
└── ip_address (nullable)
```

---

## 5. Feature Specification

### 5A. Organizer Portal

**Program Creation Wizard**
- Step 1: Basic info — name, description, slug (auto-generated, editable)
- Step 2: Rules configuration
  - Maximum amount per claim (e.g., $25)
  - Claims per person: always 1 (enforced by World ID) or configurable
  - Deadline (date + time picker)
  - Required proof types (receipt, invoice, photo, none)
  - Allowed categories (dropdown/tags: food, transport, lodging, supplies, other)
  - Auto-approve threshold (confidence slider: 0.0–1.0, default 0.85)
- Step 3: Budget — total budget, optional per-claim cap
- Step 4: Review & publish → generates shareable claim link

**Program Dashboard**
- Summary cards: total claims, approved, rejected, flagged, pending, budget remaining
- Real-time claim feed (newest first, filterable by status)
- Budget burn chart (committed vs. remaining vs. time)
- Quick actions: pause program, extend deadline, export approved claims

**Review Queue**
- Only shows claims with status = `flagged`
- Each claim card shows: extracted receipt data, confidence score, rule check results, document thumbnail
- One-click approve or reject with optional notes
- Side-by-side view: original document | extracted data | rule results

**Export / Payout**
- Filter approved claims
- Export as CSV: claimant pseudonym (nullifier-based), amount approved, category, date
- Copy-ready for PayPal mass pay, Venmo business, bank batch transfer
- Full audit log downloadable

### 5B. Claimant Portal

**Claim Submission Flow**
```
Step 1: Land on claim page (public link, no login required)
   └── See program info: name, description, deadline, rules summary

Step 2: Verify with World ID
   └── IDKit widget appears
   └── User scans QR with World App (or simulator for demo)
   └── Proof verified → proceed
   └── If already claimed → show "You have already submitted a claim for this program"

Step 3: Claim form
   └── Amount requested (number input, shows max from rules)
   └── Category (dropdown from program's allowed categories)
   └── Description (optional text)
   └── Document upload (drag-drop, camera capture on mobile)
       └── Accepted: JPG, PNG, PDF
       └── Max file size: 10MB
       └── Shows upload progress

Step 4: Review & submit
   └── Summary of entered data
   └── Preview of uploaded document
   └── Submit button

Step 5: Confirmation
   └── Claim ID for reference
   └── Current status (processing...)
   └── "You'll be notified when your claim is reviewed"
```

**Status Tracking**
- Claimant can return to check status using their World ID verification (same nullifier = same claim lookup)
- Status timeline: Submitted → Processing → [Auto-Approved | Flagged for Review | Rejected]
- If rejected: shows reason

### 5C. Automation Backend

**Document Processing Pipeline**
```
1. Document uploaded
2. File type detection (image vs PDF)
3. If image: run through OCR (Tesseract.js or Claude Vision API)
4. If PDF: extract text directly, fall back to OCR for scanned PDFs
5. AI extraction (Claude API call):
   - System prompt: "Extract the following from this receipt/document:
     merchant_name, date, total_amount, line_items, currency.
     Return as JSON. Include confidence score 0-1 for each field."
   - Input: OCR text + original image (if using vision)
   - Output: structured JSON
6. Store extraction_data on Document record
7. Generate perceptual hash of document image for duplicate detection
```

**Rules Engine**
```
For each claim, run all program rules in sequence:

1. DEADLINE CHECK
   - Is current time before program deadline?
   - Pass/Fail

2. AMOUNT CHECK
   - Is requested amount ≤ max_amount_per_claim?
   - Does extracted receipt amount match requested amount (±10% tolerance)?
   - Pass/Fail/Warning

3. CATEGORY CHECK
   - Is selected category in program's allowed_categories?
   - Does extracted merchant/description match category? (AI classification)
   - Pass/Fail/Warning

4. DOCUMENT CHECK
   - Was a required document uploaded?
   - Did OCR extraction succeed with confidence > 0.5?
   - Pass/Fail

5. DUPLICATE DOCUMENT CHECK
   - Compare document perceptual hash against all documents in this program
   - If hash similarity > 95%: flag as potential duplicate receipt
   - Pass/Flag

6. BUDGET CHECK
   - Is (budget_committed + requested_amount) ≤ budget_total?
   - Pass/Fail

7. COMPUTE CONFIDENCE SCORE
   - Average of all individual check scores
   - Weight: amount match (0.3), document quality (0.3), category match (0.2), no duplicates (0.2)

8. ROUTING DECISION
   - If all checks pass AND confidence ≥ auto_approve_threshold → AUTO_APPROVE
   - If any check hard-fails (deadline, budget, duplicate human) → AUTO_REJECT
   - Otherwise → FLAG for manual review
```

**Notification System**
- On submission: "Your claim has been received" (email or in-app)
- On auto-approve: "Your claim for $X has been approved"
- On rejection: "Your claim was not approved. Reason: [reason]"
- On flag: notify reviewers "New claim needs review"
- Implementation: email via Resend API (or console log for hackathon MVP)

---

## 6. Demo Scenario — Exactly What We Show Judges

### Demo script (3–5 minute video, Round 1)

**Opening (30 seconds)**
"Every hackathon, every student org, every community program runs into the same problem. You want to reimburse people, distribute stipends, process grants. But you don't know every applicant. So you end up with a Google Form, a messy spreadsheet, and hours of manual review — checking receipts, catching duplicates, chasing missing info. OpenClaims Ops automates that entire pipeline. And it uses World ID's proof of personhood to solve the one problem no spreadsheet can: making sure one person can only claim once."

**Demo Part 1: Organizer creates a program (45 seconds)**
- Show the organizer portal
- Create "Catapult Hacks 2026 — Meal Stipend"
- Set rules: max $25, deadline Sunday 10 AM, require receipt, category = food
- Set auto-approve threshold to 0.85
- Publish → copy shareable link

**Demo Part 2: Claimant submits (60 seconds)**
- Open the claim link (clean, public page — no login)
- Click "Verify with World ID" → IDKit widget appears
- Scan QR code with World App (or simulator)
- Verification succeeds → form appears
- Enter amount: $18.50, category: food
- Upload photo of a Chipotle receipt
- Submit
- Watch the magic: document processes in real-time, receipt data extracted (merchant: Chipotle, amount: $18.50, date: April 4 2026)
- Rules engine runs: all checks pass, confidence 0.92
- Status: AUTO-APPROVED
- "Your claim for $18.50 has been approved."

**Demo Part 3: Abuse prevention (60 seconds)** ← THE MONEY SHOT
- Same person opens claim link again
- Clicks "Verify with World ID" → scans QR again
- System detects: same nullifier for this action
- **"You have already submitted a claim for this program."**
- No form, no upload, no manual review needed. One human, one claim. Done.
- Then: different person uploads the SAME receipt image
- Document processes → duplicate hash detected
- Status: FLAGGED — "Potential duplicate document"
- Reviewer queue shows the flagged claim with side-by-side comparison

**Demo Part 4: Organizer dashboard (30 seconds)**
- Show dashboard: 47 claims processed, 38 auto-approved, 6 flagged, 3 rejected
- Budget: $712 committed of $1,000
- Click "Export approved" → CSV downloads
- "This entire process used to take a treasurer 8 hours. It took 8 minutes."

**Close (15 seconds)**
"OpenClaims Ops. One link. One verification. Zero spreadsheets. Built on World ID because the hardest part of processing claims in open pools isn't the paperwork — it's knowing who's real."

### Demo for Round 2 (Shark Tank, 5 minutes)

Same core demo but add:
- Quick pitch framing (30 sec): the market size and problem
- Live demo (3 min): same as above but live, not recorded
- Scale narrative (1 min): "This works for hackathon stipends. It also works for $50M utility rebate programs. The architecture is the same. The trust layer is the same."
- Close with the one-liner

---

## 7. Use Cases — Expanded

### Primary demo use case: Hackathon meal stipend
- Perfect for the venue — literally happening right now at Catapult
- Judges immediately understand the pain
- The "meta" angle: "we built a tool to automate the exact process this hackathon is running manually"

### Secondary use cases (for pitch depth):

**Student travel reimbursement**
A department offers $500 travel grants for conference attendance. Students submit receipts for flights, hotels, registration. Currently: email + PDF + manual review. With OpenClaims: one link, World ID verification, receipt OCR, auto-validation against $500 cap, auto-approve clean claims, flag edge cases.

**Manufacturer cashback rebate**
Buy a qualifying product, submit receipt for $50 cashback. Currently: web form + manual receipt check + mailed check. Problem: people submit multiple times with different emails, share receipts. With OpenClaims: World ID ensures one rebate per human, receipt OCR validates purchase, auto-approve and queue digital payout.

**Nonprofit emergency microgrants**
Community org offers $200 emergency grants to residents. Currently: paper application + caseworker review + check mailing. With OpenClaims: World ID prevents double-dipping, eligibility rules auto-checked, clean applications auto-approved within minutes instead of weeks.

**Event attendance rewards**
Conference gives $25 gift card to every attendee who fills out feedback survey. Currently: collect emails, manually deduplicate, send codes. With OpenClaims: World ID = one reward per human, auto-distribution after survey completion.

---

## 8. UI/UX Design Specification

### Design principles
- **Clean and trustworthy.** This handles money. The UI must feel professional and secure.
- **Minimal friction for claimants.** No account creation. No login. Just World ID + form + upload.
- **Information density for organizers.** Dashboard should show everything at a glance.
- **Mobile-first for claimants, desktop-first for organizers.**

### Color palette
- Primary: Deep blue (#1a1f36) — trust, professionalism
- Accent: World ID purple (#6C63FF) — ties to World brand
- Success: Green (#22c55e) — approved claims
- Warning: Amber (#f59e0b) — flagged claims
- Error: Red (#ef4444) — rejected claims
- Background: Clean white (#ffffff) with subtle gray (#f8fafc) sections
- Text: Near-black (#0f172a) for readability

### Typography
- Headings: Inter (bold, clean, modern)
- Body: Inter (regular)
- Monospace (for claim IDs, nullifiers): JetBrains Mono

### Pages

**1. Landing page** (`/`)
- Hero: "Automate claims, stipends, and reimbursements for open pools"
- Subhead: "Powered by World ID proof of personhood"
- CTA: "Create a Program" → organizer signup/login
- Secondary: "How it works" → 3-step visual explainer
- Footer: built for Catapult Hacks 2026

**2. Organizer auth** (`/auth`)
- Simple email + password (or magic link for hackathon)
- No World ID here — organizers are known entities

**3. Organizer dashboard** (`/dashboard`)
- Left sidebar: Programs list, Settings
- Main area: selected program's dashboard
- Top row: summary cards (total claims, approved, flagged, rejected, pending, budget remaining)
- Middle: claim feed (table view, sortable/filterable)
- Bottom: budget chart, processing time stats

**4. Program creation** (`/dashboard/programs/new`)
- Multi-step wizard (4 steps as described in 5A)
- Clean form UI with validation
- Preview at the end before publish

**5. Review queue** (`/dashboard/programs/[id]/review`)
- List of flagged claims
- Click to expand: full claim detail + document + extraction results + rule check results
- Approve / Reject buttons with optional notes field
- Keyboard shortcuts (A = approve, R = reject, N = next)

**6. Export page** (`/dashboard/programs/[id]/export`)
- Date range filter
- Status filter (approved only by default)
- Preview table
- Download CSV button
- Audit log viewer

**7. Claim page** (`/claim/[program-slug]`) ← PUBLIC, no auth
- Program info header (name, description, deadline, rules summary)
- World ID verification step (IDKit widget)
- Claim form (amount, category, description, document upload)
- Confirmation page with status
- Mobile-optimized layout

**8. Claim status** (`/claim/[program-slug]/status`)
- World ID re-verification to look up claim
- Status timeline visualization
- Claim details

### Key UI Components

**World ID Verification Card**
- Prominent placement in claim flow
- "Verify you're human" heading
- World ID branded button/QR area
- Status indicators: verifying → verified → already claimed
- Subtle explanation: "This ensures each person can only claim once"

**Claim Card (in organizer view)**
- Compact: status badge, amount, category, timestamp, confidence score
- Expandable: full details, document preview, extraction data, rule results
- Color-coded left border by status (green/amber/red/gray)

**Document Viewer**
- Thumbnail in list view
- Full-size modal on click
- Side-by-side: original document | extracted data overlay
- Highlight extracted fields (merchant name, amount, date)

**Confidence Score Badge**
- Circular progress indicator
- Color: green (>0.85), amber (0.6–0.85), red (<0.6)
- Tooltip showing breakdown by component

**Budget Meter**
- Horizontal progress bar
- Shows committed / total
- Color shifts from green → amber → red as budget depletes

---

## 9. Technical Stack

### Frontend
- **Next.js 15** (App Router) — React framework, SSR, API routes in one package
- **TypeScript** — type safety across the codebase
- **Tailwind CSS** — rapid UI development
- **shadcn/ui** — polished component library (built on Radix primitives)
- **@worldcoin/idkit** — World ID React SDK (v4.x)
- **Recharts** — dashboard charts
- **react-dropzone** — file upload
- **Lucide React** — icons

### Backend (Next.js API Routes)
- **Next.js API Routes** — serverless functions, same repo
- **Supabase JS Client** — database queries, auth, storage
- **@worldcoin/idkit** (server-side signing) — RP signature generation
- **OpenAI API** (GPT-4o Vision) — receipt OCR and field extraction (using $100 Codex credits)
- **Resend** — transactional email (or console log for MVP)
- **crypto** — hashing for document deduplication

### Database & Storage
- **Supabase** (hosted PostgreSQL) — database + auth + file storage + realtime
  - Why Supabase: free tier is generous, instant setup, built-in file storage for receipt uploads, realtime subscriptions for live dashboard updates, row-level security for multi-org isolation
- **Supabase Storage** — receipt/document file uploads (S3-compatible)

### External Services
- **World ID Developer Portal** — app registration, RP credentials
- **World ID Verify API** (v4) — proof verification endpoint
- **World ID Simulator** — staging/demo testing
- **OpenAI API** — document extraction (GPT-4o vision)

### Development Tools
- **pnpm** — package manager
- **ESLint + Prettier** — code quality
- **Vercel** — deployment (free tier, instant Next.js deploys)

---

## 10. World ID Implementation Details

### Developer Portal Setup
1. Go to https://developer.worldcoin.org
2. Create a new app → get `app_id` and `rp_id`
3. Generate `signing_key` → store as environment variable (NEVER expose to client)
4. Set environment to `staging` for development, `production` for final demo

### Environment Variables
```
NEXT_PUBLIC_WORLD_APP_ID=app_xxxxx
WORLD_RP_ID=rp_xxxxx
WORLD_RP_SIGNING_KEY=sk_xxxxx
OPENAI_API_KEY=sk-xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
RESEND_API_KEY=re_xxxxx (optional)
```

### Action string convention
Each program generates a unique action string: `openclaims-{program-slug}`
Example: `openclaims-catapult-meal-stipend-2026`

This means:
- One nullifier per human per program
- Different programs = different nullifiers = same person can claim from multiple programs
- Same program = same nullifier = one claim per human

### IDKit Frontend Implementation (React)
```typescript
// Simplified flow — actual implementation will follow IDKit 4.x docs exactly

import { IDKit, orbLegacy } from "@worldcoin/idkit-core";

async function startVerification(programSlug: string, claimId: string) {
  // 1. Get RP signature from our backend
  const rpSig = await fetch("/api/rp-signature", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: `openclaims-${programSlug}` }),
  }).then(r => r.json());

  // 2. Create IDKit request
  const request = await IDKit.request({
    app_id: process.env.NEXT_PUBLIC_WORLD_APP_ID,
    action: `openclaims-${programSlug}`,
    rp_context: {
      rp_id: rpSig.rp_id,
      nonce: rpSig.nonce,
      created_at: rpSig.created_at,
      expires_at: rpSig.expires_at,
      signature: rpSig.sig,
    },
    allow_legacy_proofs: true,
    environment: process.env.NODE_ENV === "production" ? "production" : "staging",
  }).preset(orbLegacy({ signal: claimId }));

  // 3. Get connect URL for QR code display
  const connectUrl = request.connectorURI;
  
  // 4. Wait for user to complete verification
  const response = await request.pollUntilCompletion();
  
  return response;
}
```

### Backend Verification
```typescript
// POST /api/verify-proof
export async function POST(request: Request) {
  const { programSlug, idkitResponse } = await request.json();
  
  // 1. Verify with World API
  const verifyResponse = await fetch(
    `https://developer.world.org/api/v4/verify/${process.env.WORLD_RP_ID}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(idkitResponse),
    }
  );
  
  const result = await verifyResponse.json();
  
  if (!result.success) {
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }
  
  // 2. Extract nullifier
  const nullifier = result.nullifier;
  
  // 3. Check if nullifier already exists for this program
  const existingClaim = await supabase
    .from("claims")
    .select("id")
    .eq("program_id", programId)
    .eq("nullifier_hash", nullifier)
    .single();
  
  if (existingClaim.data) {
    return Response.json({ 
      error: "already_claimed",
      message: "You have already submitted a claim for this program" 
    }, { status: 409 });
  }
  
  // 4. Create pending claim with verified nullifier
  const { data: claim } = await supabase
    .from("claims")
    .insert({
      program_id: programId,
      nullifier_hash: nullifier,
      world_id_verified: true,
      verification_level: result.results[0].identifier,
      status: "pending",
    })
    .select()
    .single();
  
  return Response.json({ claimId: claim.id, verified: true });
}
```

---

## 11. Document Processing Pipeline — Detail

### Receipt extraction using GPT-4o Vision
```typescript
async function extractReceiptData(imageUrl: string): Promise<ExtractionResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a receipt data extraction system. Extract structured data from receipt images.
Return ONLY valid JSON with these fields:
{
  "merchant_name": string,
  "date": string (YYYY-MM-DD),
  "total_amount": number,
  "currency": string (default "USD"),
  "line_items": [{ "description": string, "amount": number }],
  "category_guess": "food" | "transport" | "lodging" | "supplies" | "other",
  "confidence": number (0.0-1.0, your confidence in the extraction accuracy)
}
If any field cannot be determined, set it to null. Always include confidence.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract data from this receipt:" },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 500,
    temperature: 0,
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Duplicate document detection
```typescript
import crypto from "crypto";

// Simple approach: hash the file content
function computeDocumentHash(fileBuffer: Buffer): string {
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

// Check for duplicates within a program
async function checkDuplicateDocument(
  programId: string, 
  documentHash: string
): Promise<{ isDuplicate: boolean; matchingClaimId?: string }> {
  const { data } = await supabase
    .from("documents")
    .select("claim_id")
    .eq("duplicate_hash", documentHash)
    .eq("claims.program_id", programId);
  
  if (data && data.length > 0) {
    return { isDuplicate: true, matchingClaimId: data[0].claim_id };
  }
  return { isDuplicate: false };
}
```

---

## 12. Rules Engine — Detail

```typescript
interface RuleCheckResult {
  rule: string;
  passed: boolean;
  severity: "hard_fail" | "soft_fail" | "warning" | "pass";
  message: string;
  score: number; // 0.0 - 1.0
}

async function runRulesEngine(
  claim: Claim,
  program: Program,
  extraction: ExtractionResult,
  documentHash: string
): Promise<{ results: RuleCheckResult[]; confidence: number; decision: "auto_approve" | "auto_reject" | "flag" }> {
  
  const results: RuleCheckResult[] = [];

  // Rule 1: Deadline
  const deadlineCheck = new Date() <= new Date(program.rules.deadline);
  results.push({
    rule: "deadline",
    passed: deadlineCheck,
    severity: deadlineCheck ? "pass" : "hard_fail",
    message: deadlineCheck ? "Submitted before deadline" : "Submitted after deadline",
    score: deadlineCheck ? 1.0 : 0.0,
  });

  // Rule 2: Amount
  const amountWithinCap = claim.amount_requested <= program.rules.max_amount_per_claim;
  const amountMatchesReceipt = extraction.total_amount 
    ? Math.abs(claim.amount_requested - extraction.total_amount) / extraction.total_amount <= 0.10
    : false;
  results.push({
    rule: "amount",
    passed: amountWithinCap && amountMatchesReceipt,
    severity: !amountWithinCap ? "hard_fail" : !amountMatchesReceipt ? "soft_fail" : "pass",
    message: !amountWithinCap 
      ? `Requested $${claim.amount_requested} exceeds cap of $${program.rules.max_amount_per_claim}`
      : !amountMatchesReceipt 
      ? `Requested amount doesn't match receipt ($${extraction.total_amount})`
      : "Amount within cap and matches receipt",
    score: amountWithinCap && amountMatchesReceipt ? 1.0 : amountWithinCap ? 0.5 : 0.0,
  });

  // Rule 3: Category
  const categoryAllowed = program.rules.allowed_categories.includes(claim.category);
  const categoryMatchesExtraction = extraction.category_guess === claim.category;
  results.push({
    rule: "category",
    passed: categoryAllowed,
    severity: categoryAllowed ? "pass" : "hard_fail",
    message: categoryAllowed ? "Category allowed" : "Category not allowed for this program",
    score: categoryAllowed && categoryMatchesExtraction ? 1.0 : categoryAllowed ? 0.7 : 0.0,
  });

  // Rule 4: Document quality
  const docQuality = extraction.confidence >= 0.5;
  results.push({
    rule: "document_quality",
    passed: docQuality,
    severity: docQuality ? "pass" : "soft_fail",
    message: docQuality ? `Extraction confidence: ${extraction.confidence}` : "Low quality document extraction",
    score: extraction.confidence,
  });

  // Rule 5: Duplicate document
  const dupCheck = await checkDuplicateDocument(claim.program_id, documentHash);
  results.push({
    rule: "duplicate_document",
    passed: !dupCheck.isDuplicate,
    severity: dupCheck.isDuplicate ? "soft_fail" : "pass",
    message: dupCheck.isDuplicate ? "Potential duplicate document detected" : "No duplicate documents found",
    score: dupCheck.isDuplicate ? 0.0 : 1.0,
  });

  // Rule 6: Budget
  const budgetAvailable = (program.budget_committed + claim.amount_requested) <= program.budget_total;
  results.push({
    rule: "budget",
    passed: budgetAvailable,
    severity: budgetAvailable ? "pass" : "hard_fail",
    message: budgetAvailable ? "Within budget" : "Program budget exhausted",
    score: budgetAvailable ? 1.0 : 0.0,
  });

  // Compute weighted confidence
  const weights = { deadline: 0.1, amount: 0.3, category: 0.1, document_quality: 0.25, duplicate_document: 0.15, budget: 0.1 };
  const confidence = results.reduce((sum, r) => sum + r.score * (weights[r.rule] || 0.1), 0);

  // Routing decision
  const hasHardFail = results.some(r => r.severity === "hard_fail");
  const hasSoftFail = results.some(r => r.severity === "soft_fail");
  
  let decision: "auto_approve" | "auto_reject" | "flag";
  if (hasHardFail) decision = "auto_reject";
  else if (hasSoftFail || confidence < program.rules.auto_approve_threshold) decision = "flag";
  else decision = "auto_approve";

  return { results, confidence, decision };
}
```

---

## 13. Implementation Phases

### Phase 1: Foundation (Hours 0–4)
- Next.js 15 project setup with TypeScript + Tailwind + shadcn/ui
- Supabase project creation + database schema (all tables)
- Environment variables configured
- World ID Developer Portal app created
- Basic page routing structure
- Landing page with project branding

### Phase 2: World ID Integration (Hours 4–8)
- RP signature endpoint (`/api/rp-signature`)
- IDKit verification flow on claim page
- Backend verification endpoint (`/api/verify-proof`)
- Nullifier storage and duplicate-human detection
- Test with World ID Simulator (staging environment)
- "Already claimed" rejection flow

### Phase 3: Claim Submission (Hours 8–14)
- Claim form UI (amount, category, description, file upload)
- Supabase Storage integration for document uploads
- Document upload API endpoint
- Claim creation API endpoint
- Claim confirmation page

### Phase 4: Document Processing + Rules Engine (Hours 14–20)
- GPT-4o Vision integration for receipt extraction
- Extraction results stored on document records
- Document hash computation for duplicate detection
- Full rules engine implementation
- Auto-approve / auto-reject / flag routing
- Claim status updates

### Phase 5: Organizer Portal (Hours 20–28)
- Organizer auth (simple email/password via Supabase Auth)
- Program creation wizard
- Program dashboard with summary cards
- Claims feed (table with filters)
- Review queue for flagged claims
- Approve/reject actions with notes
- Budget tracking

### Phase 6: Polish + Demo Prep (Hours 28–34)
- Export/payout CSV generation
- Analytics charts (Recharts)
- Notification system (email or toast)
- Audit log viewer
- Status tracking for claimants
- Mobile responsiveness pass
- Loading states, error states, empty states
- Demo data seeded for video recording

### Phase 7: Demo Recording + Submission (Hours 34–36)
- Record 3–5 minute demo video
- Prepare Shark Tank pitch slides/talking points
- Submit to Devpost
- Deploy to Vercel for live demo

---

## 14. Hackathon Category Fit Analysis

### Best Proof of Human Application (PRIMARY TARGET)

**Category definition:** "Most creative application built with World's developer tools (World ID, MiniKit, or World Chain) that leverages proof-of-personhood."

**How we win:**
- World ID is not a login gate — it's the structural foundation. The one-person-one-claim enforcement via action-scoped nullifiers is what makes the entire automation pipeline possible.
- Without proof-of-personhood, you cannot auto-approve claims in open pools. With it, you can. That's the creative application.
- We use: IDKit 4.x (React SDK), RP Signatures, Actions, Nullifiers, Verify API v4, World ID Simulator.
- The use case (claims/reimbursement automation) is genuinely novel — nobody else in the World ecosystem is doing this.

### Best Automation (SECONDARY TARGET)

**Category definition:** "Project that best streamlines a manual or repetitive process through clever automation."

**How we win:**
- The before/after is devastating: Google Form + spreadsheet + manual review → automated pipeline with document OCR, rules engine, auto-routing, and audit trail.
- The demo shows end-to-end elimination: claim submitted, processed, and approved without a human touching it.
- The abuse prevention demo (duplicate human blocked, duplicate receipt flagged) shows automation at its most impressive — the system catches things humans miss.

### Best Overall (STRETCH TARGET)

**How we contend:**
- Innovation: genuinely new product combining proof-of-personhood with claims automation. Nothing like this exists.
- Technical prowess: World ID integration, AI document processing, rules engine, real-time dashboard, multi-tenant architecture.
- Impact: affects hackathons, universities, nonprofits, businesses — massive addressable market.
- Creativity: the "meta" angle (automating the exact process this hackathon runs manually) is memorable.
- Demo-ability: the abuse prevention moment is a showstopper.

---

## 15. Risk Assessment & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| World ID Simulator doesn't work smoothly in demo | Medium | High | Test extensively beforehand; have pre-recorded backup clip of verification flow |
| GPT-4o Vision extraction fails on some receipts | Medium | Medium | Pre-test with demo receipts; have fallback manual entry option |
| Supabase free tier rate limits during demo | Low | High | Seed data before demo; don't hit DB during recording if possible |
| IDKit SDK has breaking changes or bugs | Low | High | Pin exact versions; test integration early in Phase 2 |
| Judges don't understand World ID | Medium | Medium | Demo video explains it clearly in 15 seconds; pitch includes simple analogy |
| Other teams also build a World ID claims app | Very Low | Medium | Our depth of automation (OCR, rules engine, duplicate detection) differentiates |

---

## 16. One-Line Pitch Variations

**For Best Proof of Human Application:**
"OpenClaims Ops uses World ID's proof of personhood to make one-person-one-claim enforceable at the protocol level — turning manual spreadsheet reviews into automated, trustworthy claim processing for open applicant pools."

**For Best Automation:**
"OpenClaims Ops replaces the Google Form → spreadsheet → manual review pipeline with an end-to-end automation system that processes, validates, and approves claims in seconds instead of hours."

**For Best Overall:**
"Every hackathon, every grant program, every rebate offer runs into the same problem: you can't trust open submissions without manual review. OpenClaims Ops solves trust with World ID and solves everything else with automation."

**The punchy one:**
"One link. One verification. Zero spreadsheets."
