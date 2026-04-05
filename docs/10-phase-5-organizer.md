---
doc: 10-phase-5-organizer
depends_on:
  - 01-technical-architecture.md
  - 02-ui-ux-spec.md
  - 05-rules-engine.md
  - 06-phase-1-foundation.md
  - 09-phase-4-processing.md
referenced_by:
  - 11-phase-6-polish.md
  - 12-phase-7-submission.md
status: complete
---

# Phase 5 Organizer Portal (Hours 20-28)

## 1. Auth Implementation

- Use Supabase Auth with email/password.
- Create:
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/middleware.ts`
- Protect `/dashboard` routes with middleware.
- On first sign-in, upsert `organizers` profile row.

## 2. Dashboard Layout

File: `src/app/(dashboard)/dashboard/layout.tsx`

- Sidebar left
- Main scrollable content right
- Mobile fallback uses `sheet`

Core shell:

```tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 lg:block">{/* Sidebar */}</aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
```

## 3. Program Creation Wizard

- Step 1: basic info
- Step 2: rules
- Step 3: budget
- Step 4: review and publish

POST body:

```json
{
  "name": "Catapult Hacks Meal Stipend",
  "slug": "catapult-hacks-meal-stipend-2026",
  "description": "Reimburse meals during Catapult Hacks 2026.",
  "rules": {
    "max_amount_per_claim": 25,
    "deadline": "2026-04-05T10:00:00.000Z",
    "required_proof_types": ["receipt"],
    "allowed_categories": ["food"],
    "auto_approve_threshold": 0.85
  },
  "budgetTotal": 1000
}
```

After publish, show:

- public claim link
- copy button
- link to dashboard

## 4. Program Dashboard Page

Required sections:

- stats cards
- claims table with filters
- budget meter
- quick actions

Stats to fetch:

- total claims
- approved
- rejected
- flagged
- pending
- remaining budget

## 5. Review Queue

- Query only claims with status `flagged`.
- Show:
  - original document preview
  - extracted data
  - rule results
  - approve button
  - reject button
  - reviewer notes input

PATCH body:

```json
{
  "status": "manually_approved",
  "amountApproved": 18.5,
  "reviewerNotes": "Receipt looks valid after manual review."
}
```

## 6. Export Page

- Default filter: approved claims only
- Optional date range
- CSV columns:
  - `claim_id`
  - `claimant_pseudonym`
  - `amount_approved`
  - `category`
  - `submitted_at`
  - `status`

## 7. Dashboard Analytics

Use `recharts` for:

- claims over time bar chart
- status distribution pie chart
- budget burn line chart

## 8. Acceptance Criteria

- Organizer can sign up and sign in.
- Organizer can create a fully configured program.
- Dashboard shows live claim stats.
- Flagged claims can be manually approved or rejected.
- Approved claims export as CSV.
