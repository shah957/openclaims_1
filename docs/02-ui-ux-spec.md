---
doc: 02-ui-ux-spec
depends_on:
  - 00-concept.md
  - 01-technical-architecture.md
referenced_by:
  - 06-phase-1-foundation.md
  - 07-phase-2-world-id.md
  - 08-phase-3-claims.md
  - 10-phase-5-organizer.md
  - 11-phase-6-polish.md
status: complete
---

# OpenClaims Ops UI / UX Specification

## 1. Design System

### Color tokens

| Token | CSS variable | Value | Use |
|---|---|---|---|
| Primary | `--color-primary` | `#1a1f36` | Headers, primary actions, dashboard chrome |
| Accent | `--color-accent` | `#6c63ff` | World ID moments, highlights, links |
| Success | `--color-success` | `#22c55e` | Approved claims |
| Warning | `--color-warning` | `#f59e0b` | Flagged claims |
| Error | `--color-error` | `#ef4444` | Rejections and validation issues |
| Background | `--color-background` | `#f8fafc` | Page background |
| Surface | `--color-surface` | `#ffffff` | Cards and panels |
| Text | `--color-text` | `#0f172a` | Primary readable text |
| Muted | `--color-muted` | `#64748b` | Secondary labels and helper text |

### Typography scale

| Token | Size / style | Use |
|---|---|---|
| `display` | `3.5rem`, `700`, tight tracking | Landing hero |
| `h1` | `2.5rem`, `700` | Main page headings |
| `h2` | `2rem`, `700` | Section headings |
| `h3` | `1.5rem`, `600` | Card headers |
| `body` | `1rem`, `400` | Standard text |
| `small` | `0.875rem`, `400` | Supporting copy |
| `mono` | `0.875rem`, JetBrains Mono | Claim IDs, nullifiers, CSV samples |

### Spacing scale

Use Tailwind defaults with these semantic anchors:

- `space-2`: compact badge and icon gaps
- `space-4`: form row spacing
- `space-6`: card internal spacing
- `space-8`: page section spacing
- `space-12`: major page region separation

### Border radius

- Panels and inputs: `0.875rem`
- Pills and badges: `9999px`
- Full-page feature cards: `1.5rem`

### Shadow levels

- `shadow-sm`: form controls
- `shadow-md`: standard cards
- `shadow-lg`: modals and dropdowns
- `shadow-xl`: landing hero spotlight card

### Animation defaults

- Standard transition: `150ms ease-out`
- Page reveal: fade/translate `250ms`
- Loading shimmer: skeleton pulse `1.2s`
- Chart / progress fill: `300ms ease`

## 2. shadcn/ui Components To Install

Install exactly:

- `button`
- `card`
- `input`
- `label`
- `select`
- `textarea`
- `badge`
- `dialog`
- `dropdown-menu`
- `table`
- `tabs`
- `toast`
- `tooltip`
- `progress`
- `separator`
- `sheet`
- `avatar`
- `skeleton`

### Theme configuration notes

1. Override shadcn theme tokens to point at the CSS variables above.
2. Use a high-contrast dark-on-light shell by default.
3. Apply accent purple only to World ID or linkable action surfaces so it feels intentional.

## 3. Page Wireframes

### Landing page (`/`)

- Layout: full-width public marketing page with sticky navbar.
- Top to bottom:
  - Navbar with logo, "How it works", "For organizers", primary CTA.
  - Hero with headline, supporting copy, CTA pair, proof-of-human badge.
  - Three-step explainer cards: verify, upload, automate.
  - "Why World ID matters" band with one-person-one-claim diagram.
  - Demo use cases grid.
  - Footer.
- States:
  - CTA hover lifts slightly.
  - Skeleton only needed if stats or screenshots become dynamic.
- Mobile:
  - Stack hero actions vertically.
  - Convert navbar links into `sheet` menu.
- Data source:
  - Static for MVP.

### Auth page (`/auth`)

- Layout: centered split panel, no sidebar.
- Elements:
  - Brand header.
  - Email field.
  - Password field.
  - Tabs for sign in / sign up.
  - Submit button.
  - Optional magic-link helper copy.
- States:
  - Disabled button until fields valid.
  - Inline error copy for auth failures.
- Mobile:
  - Single card, full width with generous padding.
- Data source:
  - Supabase Auth.

### Dashboard home (`/dashboard`)

- Layout: desktop-first sidebar plus scrollable main area.
- Elements:
  - Sidebar with program list, create button, settings.
  - Page header with selected program and quick actions.
  - Stats cards row.
  - Claims table.
  - Budget chart and status distribution chart.
- States:
  - Empty state if no program exists yet.
  - Skeleton cards/tables while loading.
- Mobile:
  - Sidebar becomes `sheet`.
  - Stats cards turn into 2-column grid.
- Data source:
  - `/api/programs`
  - `/api/claims`

### Program creation wizard (`/dashboard/programs/new`)

- Layout: centered wizard card, desktop-first.
- Step 1:
  - Name, description, slug.
- Step 2:
  - Max amount, deadline, proof types, categories, auto-approve threshold.
- Step 3:
  - Total budget, optional per-claim cap.
- Step 4:
  - Review summary, generated public link preview, publish CTA.
- States:
  - Back/Next disabled appropriately.
  - Validation errors inline per step.
- Mobile:
  - Stepper becomes compact progress text.
- Data source:
  - `POST /api/programs`

### Program detail (`/dashboard/programs/[id]`)

- Layout: same dashboard shell.
- Elements:
  - Header with link copy button and status badge.
  - Stats cards.
  - Budget meter.
  - Recent claims feed.
  - Quick actions: pause, extend deadline, export.
- States:
  - Empty recent feed.
  - Warning banner if budget is under 20%.
- Mobile:
  - Quick actions move into dropdown.
- Data source:
  - `/api/programs/[id]`
  - `/api/claims?programId=...`

### Review queue (`/dashboard/programs/[id]/review`)

- Layout: two-column review workspace on desktop.
- Left column:
  - Flagged claims list with status, amount, confidence, submitted time.
- Right column:
  - Original document viewer.
  - Extracted data card.
  - Rules result list.
  - Approve / reject controls with notes.
- States:
  - Empty state when no flagged claims remain.
  - Keyboard shortcut hints visible on desktop.
- Mobile:
  - Single-column stacked detail view.
- Data source:
  - `/api/claims?programId=...&status=flagged`
  - `PATCH /api/claims/[id]`

### Export page (`/dashboard/programs/[id]/export`)

- Layout: filter bar + preview table.
- Elements:
  - Date range controls.
  - Status filter.
  - Preview rows.
  - Download CSV button.
  - Audit log tab.
- States:
  - Loading preview.
  - Empty export set.
- Mobile:
  - Filters stack above preview table.
- Data source:
  - `/api/programs/[id]/export`

### Claim page (`/claim/[slug]`)

- Layout: mobile-first single-column public page.
- Step 1:
  - Program banner with deadline, max amount, accepted categories.
  - World ID explainer card.
- Step 2:
  - QR/connect state.
  - Verified success state or already-claimed state.
- Step 3:
  - Claim form fields, upload dropzone, live helper text.
- Step 4:
  - Review summary.
- Step 5:
  - Confirmation card with claim ID and current status.
- States:
  - Verifying.
  - Verification failed.
  - Uploading.
  - Processing after submit.
- Mobile:
  - Camera-friendly dropzone and large tap targets.
- Data source:
  - `/api/rp-signature`
  - `/api/verify-proof`
  - `/api/documents/upload`
  - `/api/claims`

### Claim status page (`/claim/[slug]/status`)

- Layout: mobile-first centered card.
- Elements:
  - Re-verify with World ID prompt.
  - Status timeline.
  - Claim details and rejection reason when relevant.
- States:
  - No claim found.
  - Claimed but still processing.
- Data source:
  - `/api/verify-proof` for lookup flow
  - `/api/claims/[id]`

## 4. Component Specifications

| Component | Props interface | Visual states | Responsive behavior | Accessibility |
|---|---|---|---|---|
| `world-id/verify-button` | `{ action: string; onVerified(result); onError(error); disabled?: boolean }` | idle, verifying, success, already-claimed, error | full-width on mobile | button label, live region for status |
| `world-id/verification-status` | `{ status: "idle" \| "loading" \| "success" \| "duplicate" \| "error"; message?: string }` | neutral, success, warning, error | inline on desktop, stacked on mobile | `aria-live="polite"` |
| `claims/claim-form` | `{ program: Program; claimId: string; onSubmit(values) }` | pristine, invalid, uploading, submitting | single column mobile, 2-column desktop summary | labels, describedby helper text |
| `claims/claim-card` | `{ claim: ClaimListItem; onOpen(): void }` | default, hover, selected | condensed on tablet/mobile | clickable region uses button semantics |
| `claims/claim-detail` | `{ claim: ClaimDetail }` | normal, loading | stacked info blocks on mobile | headings and definition lists |
| `claims/claim-status-timeline` | `{ status: ClaimStatus; updatedAt: string; notes?: string }` | pending, processing, approved, rejected, flagged | horizontal desktop, vertical mobile | ordered list semantics |
| `programs/program-wizard` | `{ mode: "create" \| "edit"; initialValues?; onSubmit(values) }` | each step active/inactive, saving | full width mobile | stepper labels, input labels |
| `programs/program-card` | `{ program: ProgramSummary; selected?: boolean }` | default, selected, paused, closed | compact card in sidebar or grid | `aria-current` on selected |
| `programs/program-dashboard` | `{ program: ProgramDetail; claims: ClaimListItem[] }` | loading, empty, loaded | sections stack on tablet | landmarks for charts/tables |
| `dashboard/sidebar` | `{ programs: ProgramSummary[]; activeProgramId?: string }` | collapsed, expanded | sheet on mobile | nav landmarks, focus trap in sheet |
| `dashboard/stats-cards` | `{ stats: DashboardStats }` | loading skeleton, alerting low budget | responsive grid | icon labels hidden from SR |
| `dashboard/budget-meter` | `{ total: number; committed: number }` | healthy, warning, critical | full width | progress semantics |
| `dashboard/claims-table` | `{ rows: ClaimListItem[]; onSort(key); onFilter(status) }` | loading, empty, loaded | horizontal scroll on mobile | sortable headers announce state |
| `documents/document-upload` | `{ claimId: string; programId: string; onUploaded(doc) }` | idle, drag active, uploading, uploaded, invalid | large touch target mobile | dropzone instructions linked |
| `documents/document-viewer` | `{ url: string; filename: string }` | thumbnail, modal open, loading | modal fullscreen on mobile | zoom button labels |
| `documents/extraction-display` | `{ extraction: ExtractionResult | null }` | loading, populated, low-confidence | stacked cards | semantic table / list |
| `shared/navbar` | `{ authenticated?: boolean }` | default, scrolled | sheet on mobile | nav, skip link support |
| `shared/footer` | `{}` | default only | stacked columns on mobile | semantic footer |
| `shared/confidence-badge` | `{ score: number }` | green, amber, red | same size across breakpoints | tooltip content accessible |
| `shared/status-badge` | `{ status: ClaimStatus | ProgramStatus }` | semantic color variants | wraps on small screens | readable text, not color-only |

## 5. Responsive Breakpoints

| Breakpoint | Width | Strategy |
|---|---|---|
| Mobile | `< 768px` | Claim flows are mobile-first |
| Tablet | `768px - 1024px` | Dashboard condenses into two columns |
| Desktop | `> 1024px` | Organizer views are desktop-first |

### Mobile-first pages

- `/`
- `/auth`
- `/claim/[slug]`
- `/claim/[slug]/status`

### Desktop-first pages

- `/dashboard`
- `/dashboard/programs/new`
- `/dashboard/programs/[id]`
- `/dashboard/programs/[id]/review`
- `/dashboard/programs/[id]/export`

## 6. UX Guardrails

1. Claimants never create accounts.
2. World ID verification should feel like a benefit, not a hurdle.
3. Organizer pages can be denser, but claimant pages should remain calm and linear.
4. Status should always be expressed with text plus color plus icon, never color alone.
