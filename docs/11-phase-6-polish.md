---
doc: 11-phase-6-polish
depends_on:
  - 02-ui-ux-spec.md
  - 07-phase-2-world-id.md
  - 08-phase-3-claims.md
  - 09-phase-4-processing.md
  - 10-phase-5-organizer.md
referenced_by:
  - 12-phase-7-submission.md
status: complete
---

# Phase 6 Polish And Demo Prep (Hours 28-34)

## 1. Notification System

Minimum MVP:

- toast on submit
- toast on organizer approve/reject actions

Stretch:

- email via Resend on:
  - claim received
  - auto-approved
  - rejected
  - flagged reviewer alert

## 2. Claim Status Page

- Re-verify claimant with World ID.
- Lookup claim by `(program_id, nullifier_hash)`.
- Render timeline:
  - submitted
  - processing
  - approved / rejected / flagged

## 3. Loading States

Create skeletons for:

- dashboard cards
- claims table
- review queue detail
- claim page form shell

## 4. Error States

- Add route-level error boundaries where useful.
- Friendly copy:
  - “We couldn’t verify your proof.”
  - “Your document upload failed.”
  - “This program could not be found.”

## 5. Empty States

- no programs yet
- no claims yet
- no flagged claims
- no export rows

## 6. Mobile Responsive Pass

Specific fixes:

- keep claim CTA buttons full width
- increase QR card padding on mobile
- use sticky submit bar on long claim forms if helpful
- ensure upload area supports camera capture

## 7. Demo Data Seeding Script

File: `scripts/seed-demo-data.ts`

Create:

- 1 demo program: `Catapult Meal Stipend`
- 50 sample claims
- realistic status distribution
- sample extraction data
- committed budget numbers that make the dashboard visually convincing

Suggested distribution:

- 38 auto-approved
- 6 flagged
- 3 auto-rejected
- 3 manually approved / rejected mixed

## 8. Deployment To Vercel

1. Import the repo into Vercel.
2. Add environment variables from `.env.local`.
3. Confirm route handlers work in the deployed environment.
4. Test World ID against the correct environment.

## 9. Demo Recording Prep

- Browser: Chrome
- Resolution: 1440p if available
- Theme: light mode
- Preload:
  - organizer dashboard
  - claim link
  - World ID Simulator
  - test receipt files

Checklist:

- reset demo data
- verify public link works
- verify duplicate-human flow works
- verify duplicate-document flow works
